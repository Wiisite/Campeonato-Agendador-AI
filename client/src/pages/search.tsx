import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search,
  Filter,
  X,
  MapPin,
  Building2,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { SportTypeBadge, OrgTypeBadge } from "@/components/sport-badge";
import { EmptyState } from "@/components/empty-state";
import { LeadCardSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Organization, SportType, OrganizationType, SearchFilters } from "@shared/schema";

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

export default function SearchPage() {
  const { toast } = useToast();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    sportTypes: [],
    orgTypes: [],
    state: "",
    city: "",
  });
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations", filters],
  });

  const addLeadMutation = useMutation({
    mutationFn: (organizationId: string) =>
      apiRequest("POST", "/api/leads", { organizationId }),
    onSuccess: () => {
      toast({
        title: "Lead adicionado",
        description: "A organização foi adicionada aos seus leads.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o lead.",
        variant: "destructive",
      });
    },
  });

  const handleSportTypeToggle = (sportType: SportType) => {
    setFilters((prev) => ({
      ...prev,
      sportTypes: prev.sportTypes?.includes(sportType)
        ? prev.sportTypes.filter((t) => t !== sportType)
        : [...(prev.sportTypes || []), sportType],
    }));
  };

  const handleOrgTypeToggle = (orgType: OrganizationType) => {
    setFilters((prev) => ({
      ...prev,
      orgTypes: prev.orgTypes?.includes(orgType)
        ? prev.orgTypes.filter((t) => t !== orgType)
        : [...(prev.orgTypes || []), orgType],
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      sportTypes: [],
      orgTypes: [],
      state: "",
      city: "",
    });
  };

  const activeFilterCount =
    (filters.sportTypes?.length || 0) +
    (filters.orgTypes?.length || 0) +
    (filters.state ? 1 : 0) +
    (filters.city ? 1 : 0);

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orgId)) {
        newSet.delete(orgId);
      } else {
        newSet.add(orgId);
      }
      return newSet;
    });
  };

  const handleAddSelectedAsLeads = () => {
    selectedOrgs.forEach((orgId) => {
      addLeadMutation.mutate(orgId);
    });
    setSelectedOrgs(new Set());
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="page-search">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Buscar Organizações</h1>
        <p className="text-muted-foreground">
          Encontre campeonatos, escolas, clubes e associações esportivas
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Collapsible
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          className="lg:w-80 shrink-0"
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover-elevate">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <CardTitle className="text-lg">Filtros</CardTitle>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Esporte</label>
                  <div className="flex flex-wrap gap-2">
                    {sportTypeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.sportTypes?.includes(option.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSportTypeToggle(option.value)}
                        data-testid={`filter-sport-${option.value}`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Organização</label>
                  <div className="flex flex-wrap gap-2">
                    {orgTypeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters.orgTypes?.includes(option.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleOrgTypeToggle(option.value)}
                        data-testid={`filter-org-${option.value}`}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select
                    value={filters.state || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, state: value === "all" ? "" : value }))
                    }
                  >
                    <SelectTrigger data-testid="select-state">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <Input
                    placeholder="Nome da cidade"
                    value={filters.city || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, city: e.target.value }))
                    }
                    data-testid="input-city"
                  />
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar filtros
                  </Button>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cidade ou palavras-chave..."
                className="pl-10"
                value={filters.query || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, query: e.target.value }))
                }
                data-testid="input-search"
              />
            </div>
            {selectedOrgs.size > 0 && (
              <Button
                onClick={handleAddSelectedAsLeads}
                disabled={addLeadMutation.isPending}
                data-testid="button-add-selected"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar {selectedOrgs.size} como leads
              </Button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.sportTypes?.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleSportTypeToggle(type)}
                >
                  {sportTypeOptions.find((o) => o.value === type)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.orgTypes?.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="cursor-pointer hover-elevate"
                  onClick={() => handleOrgTypeToggle(type)}
                >
                  {orgTypeOptions.find((o) => o.value === type)?.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
              {filters.state && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover-elevate"
                  onClick={() => setFilters((prev) => ({ ...prev, state: "" }))}
                >
                  {filters.state}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {filters.city && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover-elevate"
                  onClick={() => setFilters((prev) => ({ ...prev, city: "" }))}
                >
                  {filters.city}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-320px)]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <LeadCardSkeleton key={i} />
                ))}
              </div>
            ) : organizations && organizations.length > 0 ? (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <Card
                    key={org.id}
                    className={`hover-elevate cursor-pointer transition-all ${
                      selectedOrgs.has(org.id) ? "ring-2 ring-primary" : ""
                    }`}
                    data-testid={`card-org-${org.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedOrgs.has(org.id)}
                          onCheckedChange={() => toggleOrgSelection(org.id)}
                          data-testid={`checkbox-org-${org.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{org.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <SportTypeBadge type={org.sportType} />
                                <OrgTypeBadge type={org.orgType} />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                addLeadMutation.mutate(org.id);
                              }}
                              disabled={addLeadMutation.isPending}
                              data-testid={`button-add-lead-${org.id}`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Lead
                            </Button>
                          </div>
                          {org.description && (
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                              {org.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            {org.contactInfo?.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {org.contactInfo.city}, {org.contactInfo.state}
                              </span>
                            )}
                            {org.contactInfo?.email && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {org.contactInfo.email}
                              </span>
                            )}
                          </div>
                          {org.tags && org.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {org.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {org.tags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{org.tags.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                type="search"
                testId="empty-state-search"
              />
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
