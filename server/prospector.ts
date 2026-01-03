import OpenAI from "openai";
import type { Organization, InsertOrganization, SportType, OrganizationType } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ProspectorQuery {
  query: string;
  sportType?: SportType;
  orgType?: OrganizationType;
  state?: string;
  city?: string;
}

export interface ProspectorResult {
  organizations: Partial<InsertOrganization>[];
  summary: string;
}

const SYSTEM_PROMPT = `Você é um assistente especializado em encontrar organizações esportivas no Brasil.
Sua tarefa é gerar uma lista de organizações esportivas baseada na consulta do usuário.

Tipos de esporte válidos: society, futsal, campo
Tipos de organização válidos: empresa, escola, gremio, associacao, clube

Para cada organização, forneça:
- name: Nome da organização
- sportType: Tipo de esporte (society, futsal, ou campo)
- orgType: Tipo de organização (empresa, escola, gremio, associacao, clube)
- description: Breve descrição
- contactInfo: Objeto com email, phone, city, state, address (preencha com dados realistas)
- tags: Array de tags relevantes

Responda APENAS com JSON válido no formato:
{
  "organizations": [...],
  "summary": "Resumo dos resultados encontrados"
}`;

export async function searchOrganizations(query: ProspectorQuery): Promise<ProspectorResult> {
  let userPrompt = `Busque organizações esportivas: "${query.query}"`;
  
  if (query.sportType) {
    userPrompt += `\nTipo de esporte: ${query.sportType}`;
  }
  if (query.orgType) {
    userPrompt += `\nTipo de organização: ${query.orgType}`;
  }
  if (query.state) {
    userPrompt += `\nEstado: ${query.state}`;
  }
  if (query.city) {
    userPrompt += `\nCidade: ${query.city}`;
  }
  
  userPrompt += "\n\nGere de 3 a 5 organizações que correspondam a essa busca.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as ProspectorResult;
    
    return {
      organizations: parsed.organizations || [],
      summary: parsed.summary || "Busca concluída",
    };
  } catch (error) {
    console.error("Prospector error:", error);
    throw new Error("Falha ao buscar organizações com IA");
  }
}

export async function enrichOrganization(org: Partial<InsertOrganization>): Promise<Partial<InsertOrganization>> {
  const prompt = `Enriqueça os dados desta organização esportiva com informações adicionais realistas:
${JSON.stringify(org)}

Mantenha os dados existentes e adicione ou complete campos faltantes.
Responda APENAS com JSON válido da organização enriquecida.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "Você é um assistente que enriquece dados de organizações esportivas brasileiras." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as Partial<InsertOrganization>;
  } catch (error) {
    console.error("Enrichment error:", error);
    return org;
  }
}
