import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Search,
  Plus,
  Check,
  Loader2,
  Building2,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SportTypeBadge, OrgTypeBadge } from "@/components/sport-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SportType, OrganizationType, InsertOrganization } from "@shared/schema";

interface ProspectorResult {
  organizations: Partial<InsertOrganization>[];
  summary: string;
}

const sportTypeOptions: { value: SportType; label: string }[] = [
  { value: "society", label: "Society" },
  { value: "futsal", label: "Futsal" },
  { value: "campo", label: "Campo" },
];

const orgTypeOptions: { value: OrganizationType; label: string }[] = [
  { value: "empresa", label: "Empresa" },
  { value: "escola", label: "Escola" },
  { value: "gremio", label: "Grêmio" },
  { value: "associacao", label: "Associação" },
  { value: "clube", label: "Clube" },
];

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO"
];

export default function ProspectorPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [sportType, setSportType] = useState<SportType | "">("");
  const [orgType, setOrgType] = useState<OrganizationType | "">("");
  const [state, setState] = useState("");
  const [results, setResults] = useState<ProspectorResult | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<number>>(new Set());

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/prospector/search", {
        query,
        sportType: sportType || undefined,
        orgType: orgType || undefined,
        state: state || undefined,
      });
      return response.json() as Promise<ProspectorResult>;
    },
    onSuccess: (data) => {
      setResults(data);
      setSelectedOrgs(new Set());
      toast({
        title: "Busca concluída",
        description: data.summary,
      });
    },
    onError: () => {
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca com IA. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (organizations: Partial<InsertOrganization>[]) => {
      const response = await apiRequest("POST", "/api/prospector/import", {
        organizations,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Importação concluída",
        description: `${data.count} organizações importadas com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setResults(null);
      setSelectedOrgs(new Set());
    },
    onError: () => {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar as organizações.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!query.trim()) {
      toast({
        title: "Busca vazia",
        description: "Digite uma descrição do que você está procurando.",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate();
  };

  const toggleSelection = (index: number) => {
    setSelectedOrgs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleImportSelected = () => {
    if (!results || selectedOrgs.size === 0) return;
    const orgsToImport = Array.from(selectedOrgs).map(
      (idx) => results.organizations[idx]
    );
    importMutation.mutate(orgsToImport);
  };

  const handleImportAll = () => {
    if (!results) return;
    importMutation.mutate(results.organizations);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="page-prospector">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-semibold">Busca com IA</h1>
        </div>
        <p className="text-muted-foreground">
          Use inteligência artificial para encontrar organizações esportivas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descreva o que você procura</CardTitle>
          <CardDescription>
            A IA vai buscar organizações reais baseadas no seu conhecimento. Recomendamos verificar os dados antes de usar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Ex: Ligas de futebol society em São Paulo, Escolas de futebol no Rio de Janeiro..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              data-testid="input-ai-query"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              value={sportType || "all"}
              onValueChange={(v) => setSportType(v === "all" ? "" : v as SportType)}
            >
              <SelectTrigger data-testid="select-ai-sport">
                <SelectValue placeholder="Tipo de esporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os esportes</SelectItem>
                {sportTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={orgType || "all"}
              onValueChange={(v) => setOrgType(v === "all" ? "" : v as OrganizationType)}
            >
              <SelectTrigger data-testid="select-ai-org">
                <SelectValue placeholder="Tipo de organização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {orgTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={state || "all"}
              onValueChange={(v) => setState(v === "all" ? "" : v)}
            >
              <SelectTrigger data-testid="select-ai-state">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {brazilianStates.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-ai-search"
          >
            {searchMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Buscar com IA
          </Button>
        </CardContent>
      </Card>

      {results && results.organizations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Resultados da IA</CardTitle>
                <CardDescription>
                  {results.summary}
                  <span className="block text-xs mt-1 text-amber-600 dark:text-amber-400">
                    Verifique os dados antes de usar - resultados baseados no conhecimento da IA
                  </span>
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleImportSelected}
                  disabled={selectedOrgs.size === 0 || importMutation.isPending}
                  data-testid="button-import-selected"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Importar selecionados ({selectedOrgs.size})
                </Button>
                <Button
                  onClick={handleImportAll}
                  disabled={importMutation.isPending}
                  data-testid="button-import-all"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Importar todos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {results.organizations.map((org, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => toggleSelection(idx)}
                    data-testid={`card-ai-result-${idx}`}
                  >
                    <Checkbox
                      checked={selectedOrgs.has(idx)}
                      onCheckedChange={() => toggleSelection(idx)}
                      data-testid={`checkbox-ai-result-${idx}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium">{org.name}</h3>
                        {org.sportType && (
                          <SportTypeBadge type={org.sportType} />
                        )}
                        {org.orgType && <OrgTypeBadge type={org.orgType} />}
                      </div>
                      {org.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {org.description}
                        </p>
                      )}
                      {org.contactInfo && (
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {(org.contactInfo.city || org.contactInfo.state) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {org.contactInfo.city}
                              {org.contactInfo.city && org.contactInfo.state && ", "}
                              {org.contactInfo.state}
                            </span>
                          )}
                          {org.contactInfo.email && (
                            <span>{org.contactInfo.email}</span>
                          )}
                        </div>
                      )}
                      {org.tags && org.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {org.tags.map((tag, tagIdx) => (
                            <Badge key={tagIdx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {results && results.organizations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum resultado</h3>
            <p className="text-muted-foreground">
              Tente uma descrição diferente ou ajuste os filtros.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
