import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Edit,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LeadStatusBadge } from "@/components/status-badge";
import { SportTypeBadge, OrgTypeBadge } from "@/components/sport-badge";
import { EmptyState } from "@/components/empty-state";
import { LeadCardSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  LeadWithOrganization,
  LeadStatus,
  Interaction,
  leadStatuses,
} from "@shared/schema";

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "contato", label: "Contato" },
  { value: "reuniao_agendada", label: "Reunião Agendada" },
  { value: "negociando", label: "Negociando" },
  { value: "convertido", label: "Convertido" },
  { value: "arquivado", label: "Arquivado" },
];

export default function LeadsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<LeadWithOrganization | null>(null);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [newNote, setNewNote] = useState("");

  const { data: leads, isLoading } = useQuery<LeadWithOrganization[]>({
    queryKey: ["/api/leads", { status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const { data: interactions } = useQuery<Interaction[]>({
    queryKey: ["/api/leads", selectedLead?.id, "interactions"],
    enabled: !!selectedLead,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) =>
      apiRequest("PATCH", `/api/leads/${leadId}`, { status }),
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do lead foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: ({ leadId, type, notes }: { leadId: string; type: string; notes: string }) =>
      apiRequest("POST", `/api/leads/${leadId}/interactions`, { type, notes }),
    onSuccess: () => {
      toast({
        title: "Nota adicionada",
        description: "A nota foi adicionada ao lead.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads", selectedLead?.id, "interactions"] });
      setShowAddNoteDialog(false);
      setNewNote("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a nota.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => apiRequest("DELETE", `/api/leads/${leadId}`),
    onSuccess: () => {
      toast({
        title: "Lead removido",
        description: "O lead foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLead(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o lead.",
        variant: "destructive",
      });
    },
  });

  const filteredLeads = leads?.filter((lead) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.organization?.name?.toLowerCase().includes(query) ||
        lead.organization?.contactInfo?.city?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleScheduleMeeting = (lead: LeadWithOrganization) => {
    navigate(`/meetings?new=true&leadId=${lead.id}`);
  };

  const handleAddNote = () => {
    if (selectedLead && newNote.trim()) {
      addInteractionMutation.mutate({
        leadId: selectedLead.id,
        type: "nota",
        notes: newNote,
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="page-leads">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e acompanhe o pipeline de vendas
          </p>
        </div>
        <Button asChild data-testid="button-add-lead">
          <a href="/search">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </a>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-leads"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as LeadStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <LeadCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredLeads && filteredLeads.length > 0 ? (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className={`hover-elevate cursor-pointer transition-all ${
                      selectedLead?.id === lead.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedLead(lead)}
                    data-testid={`card-lead-${lead.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg truncate">
                              {lead.organization?.name}
                            </h3>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {lead.organization?.sportType && (
                              <SportTypeBadge type={lead.organization.sportType} />
                            )}
                            {lead.organization?.orgType && (
                              <OrgTypeBadge type={lead.organization.orgType} />
                            )}
                            <LeadStatusBadge status={lead.status} />
                          </div>
                          {lead.organization?.contactInfo?.city && (
                            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {lead.organization.contactInfo.city}, {lead.organization.contactInfo.state}
                            </p>
                          )}
                          {lead.lastContactedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Último contato:{" "}
                              {format(new Date(lead.lastContactedAt), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" data-testid={`button-lead-menu-${lead.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScheduleMeeting(lead);
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Agendar reunião
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setShowAddNoteDialog(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Adicionar nota
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLeadMutation.mutate(lead.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                type="leads"
                actionLabel="Buscar organizações"
                onAction={() => navigate("/search")}
                testId="empty-state-leads"
              />
            )}
          </ScrollArea>
        </div>

        {selectedLead ? (
          <Card className="lg:sticky lg:top-6 h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">{selectedLead.organization?.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.organization?.sportType && (
                        <SportTypeBadge type={selectedLead.organization.sportType} />
                      )}
                      {selectedLead.organization?.orgType && (
                        <OrgTypeBadge type={selectedLead.organization.orgType} />
                      )}
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={selectedLead.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({
                      leadId: selectedLead.id,
                      status: value as LeadStatus,
                    })
                  }
                >
                  <SelectTrigger data-testid="select-lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLead.organization?.contactInfo && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Contato</h4>
                  <div className="space-y-2 text-sm">
                    {selectedLead.organization.contactInfo.email && (
                      <a
                        href={`mailto:${selectedLead.organization.contactInfo.email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-4 w-4" />
                        {selectedLead.organization.contactInfo.email}
                      </a>
                    )}
                    {selectedLead.organization.contactInfo.phone && (
                      <a
                        href={`tel:${selectedLead.organization.contactInfo.phone}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {selectedLead.organization.contactInfo.phone}
                      </a>
                    )}
                    {selectedLead.organization.contactInfo.city && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {selectedLead.organization.contactInfo.address && (
                          <>{selectedLead.organization.contactInfo.address}, </>
                        )}
                        {selectedLead.organization.contactInfo.city},{" "}
                        {selectedLead.organization.contactInfo.state}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleScheduleMeeting(selectedLead)}
                  data-testid="button-schedule-meeting"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddNoteDialog(true)}
                  data-testid="button-add-note"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Nota
                </Button>
              </div>

              {selectedLead.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Observações</h4>
                  <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                </div>
              )}

              {interactions && interactions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Histórico</h4>
                  <ScrollArea className="h-40">
                    <div className="space-y-3">
                      {interactions.map((interaction) => (
                        <div
                          key={interaction.id}
                          className="text-sm p-3 rounded-md bg-muted/50"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {interaction.type === "nota"
                                ? "Nota"
                                : interaction.type === "email"
                                ? "Email"
                                : interaction.type === "ligacao"
                                ? "Ligação"
                                : "Reunião"}
                            </Badge>
                            {interaction.occurredAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(interaction.occurredAt), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                          </div>
                          {interaction.notes && (
                            <p className="text-muted-foreground">{interaction.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:sticky lg:top-6">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecione um lead para ver os detalhes
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nota</DialogTitle>
            <DialogDescription>
              Adicione uma nota ou observação sobre o lead {selectedLead?.organization?.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Digite sua nota aqui..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-32"
            data-testid="textarea-note"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNoteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || addInteractionMutation.isPending}
              data-testid="button-save-note"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
