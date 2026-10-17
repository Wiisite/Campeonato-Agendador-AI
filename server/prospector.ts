import OpenAI from "openai";
import { z } from "zod";
import type { InsertOrganization, SportType, OrganizationType, ContactInfo } from "@shared/schema";

// Criado sob demanda para o servidor subir mesmo sem a chave configurada
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
    });
  }
  return openaiClient;
}

export interface ProspectorQuery {
  query: string;
  sportType?: SportType;
  orgType?: OrganizationType;
  state?: string;
  city?: string;
  limit?: number;
}

export interface ProspectorResult {
  organizations: Partial<InsertOrganization>[];
  summary: string;
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// A IA costuma devolver "" em campos desconhecidos, e-mails/URLs mal formados
// e o website fora de contactInfo. Normaliza tudo isso para que a validação
// descarte apenas o campo ruim, e não a organização inteira.
export function normalizeProspectedOrganization(raw: unknown): Partial<InsertOrganization> {
  if (!raw || typeof raw !== "object") return {};
  const org = raw as Record<string, any>;
  const rawContact = org.contactInfo && typeof org.contactInfo === "object" ? org.contactInfo : {};

  let email = cleanString(rawContact.email);
  if (email && !z.string().email().safeParse(email).success) email = undefined;

  let website = cleanString(rawContact.website) ?? cleanString(org.website);
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website && !z.string().url().safeParse(website).success) website = undefined;

  const contactInfo: ContactInfo = {
    email,
    phone: cleanString(rawContact.phone),
    website,
    address: cleanString(rawContact.address),
    city: cleanString(rawContact.city),
    state: cleanString(rawContact.state)?.toUpperCase(),
  };
  (Object.keys(contactInfo) as (keyof ContactInfo)[]).forEach((key) => {
    if (contactInfo[key] === undefined) delete contactInfo[key];
  });

  const tags = Array.isArray(org.tags)
    ? org.tags.map(cleanString).filter((tag): tag is string => !!tag)
    : undefined;

  return {
    name: cleanString(org.name),
    sportType: cleanString(org.sportType)?.toLowerCase() as SportType | undefined,
    orgType: cleanString(org.orgType)?.toLowerCase() as OrganizationType | undefined,
    description: cleanString(org.description),
    contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
    tags,
  };
}

const SYSTEM_PROMPT =`Você é um assistente especializado em encontrar organizações esportivas REAIS no Brasil.
Sua tarefa é listar APENAS organizações esportivas que REALMENTE EXISTEM, baseado no seu conhecimento.

IMPORTANTE:
- Liste APENAS organizações REAIS e VERIFICÁVEIS que você tem certeza que existem
- Use nomes oficiais completos das organizações
- Inclua informações de contato que sejam plausíveis e verificáveis
- Se não conhecer organizações reais que atendam aos critérios, retorne uma lista vazia
- NÃO INVENTE organizações fictícias

Tipos de esporte válidos: society, futsal, campo
Tipos de organização válidos: empresa, escola, gremio, associacao, clube

Para cada organização REAL, forneça:
- name: Nome oficial completo da organização
- sportType: Tipo de esporte (society, futsal, ou campo)
- orgType: Tipo de organização (empresa, escola, gremio, associacao, clube)
- description: Descrição factual da organização
- contactInfo: Objeto com email, phone, city, state, address (apenas dados que você conhece ou deixe em branco)
- tags: Array de tags relevantes
- website: URL do site oficial se conhecido (opcional)

Responda APENAS com JSON válido no formato:
{
  "organizations": [...],
  "summary": "Resumo indicando se são organizações reais conhecidas ou se não foi possível encontrar dados verificáveis"
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
  
  const resultLimit = Math.min(Math.max(query.limit || 15, 5), 20);
  userPrompt += `\n\nListe até ${resultLimit} organizações REAIS que você conhece e que correspondam a essa busca. Priorize as mais relevantes primeiro. Se não conhecer organizações reais suficientes, liste todas que conhecer.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as ProspectorResult;
    
    const organizations = Array.isArray(parsed.organizations) ? parsed.organizations : [];

    return {
      organizations: organizations
        .map(normalizeProspectedOrganization)
        .filter((org) => !!org.name),
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
    const response = await getOpenAI().chat.completions.create({
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
