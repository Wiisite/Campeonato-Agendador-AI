import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Video,
  Users,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { MeetingStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { MeetingCardSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  MeetingWithLead,
  LeadWithOrganization,
  MeetingType,
  MeetingStatus,
  InsertMeeting,
} from "@shared/schema";

const meetingTypeLabels: Record<MeetingType, { label: string; icon: React.ElementType }> = {
  virtual: { label: "Virtual", icon: Video },
  presencial: { label: "Presencial", icon: MapPin },
};

const durationOptions = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" },
];

export default function MeetingsPage() {
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showNewMeetingDialog, setShowNewMeetingDialog] = useState(params.get("new") === "true");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "list">("week");

  const [newMeeting, setNewMeeting] = useState<Partial<InsertMeeting>>({
    title: "",
    leadId: params.get("leadId") || "",
    meetingType: "virtual",
    scheduledFor: new Date().toISOString(),
    duration: 60,
    location: "",
    notes: "",
  });

  const { data: meetings, isLoading } = useQuery<MeetingWithLead[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: leads } = useQuery<LeadWithOrganization[]>({
    queryKey: ["/api/leads"],
  });

  const createMeetingMutation = useMutation({
    mutationFn: (meeting: InsertMeeting) => apiRequest("POST", "/api/meetings", meeting),
    onSuccess: () => {
      toast({
        title: "Reunião agendada",
        description: "A reunião foi agendada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowNewMeetingDialog(false);
      resetNewMeeting();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível agendar a reunião.",
        variant: "destructive",
      });
    },
  });

  const updateMeetingStatusMutation = useMutation({
    mutationFn: ({ meetingId, status }: { meetingId: string; status: MeetingStatus }) =>
      apiRequest("PATCH", `/api/meetings/${meetingId}`, { status }),
    onSuccess: () => {
      toast({
        title: "Reunião atualizada",
        description: "O status da reunião foi atualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a reunião.",
        variant: "destructive",
      });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (meetingId: string) => apiRequest("DELETE", `/api/meetings/${meetingId}`),
    onSuccess: () => {
      toast({
        title: "Reunião removida",
        description: "A reunião foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a reunião.",
        variant: "destructive",
      });
    },
  });

  const resetNewMeeting = () => {
    setNewMeeting({
      title: "",
      leadId: "",
      meetingType: "virtual",
      scheduledFor: new Date().toISOString(),
      duration: 60,
      location: "",
      notes: "",
    });
    setSelectedDate(new Date());
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const meetingsByDay = useMemo(() => {
    const byDay: Record<string, MeetingWithLead[]> = {};
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      byDay[key] = [];
    });

    meetings?.forEach((meeting) => {
      if (meeting.scheduledFor) {
        const meetingDate = new Date(meeting.scheduledFor);
        const key = format(meetingDate, "yyyy-MM-dd");
        if (byDay[key]) {
          byDay[key].push(meeting);
        }
      }
    });

    Object.keys(byDay).forEach((key) => {
      byDay[key].sort((a, b) => {
        const dateA = new Date(a.scheduledFor!);
        const dateB = new Date(b.scheduledFor!);
        return dateA.getTime() - dateB.getTime();
      });
    });

    return byDay;
  }, [meetings, weekDays]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleCreateMeeting = () => {
    if (!newMeeting.title || !newMeeting.leadId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e selecione um lead.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDate = selectedDate || new Date();
    const [hours, minutes] = (newMeeting.scheduledFor?.split("T")[1]?.slice(0, 5) || "09:00").split(":");
    scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    createMeetingMutation.mutate({
      ...newMeeting,
      scheduledFor: scheduledDate.toISOString(),
    } as InsertMeeting);
  };

  const MeetingIcon = ({ type }: { type: MeetingType }) => {
    const config = meetingTypeLabels[type];
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="page-meetings">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Reuniões</h1>
          <p className="text-muted-foreground">Gerencie suas reuniões e agenda</p>
        </div>
        <Button onClick={() => setShowNewMeetingDialog(true)} data-testid="button-new-meeting">
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Button>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "week" | "list")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="week" data-testid="tab-week-view">
              Semana
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list-view">
              Lista
            </TabsTrigger>
          </TabsList>

          {viewMode === "week" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek} data-testid="button-prev-week">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[180px] text-center">
                {format(currentWeekStart, "dd MMM", { locale: ptBR })} -{" "}
                {format(addDays(currentWeekStart, 6), "dd MMM yyyy", { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextWeek} data-testid="button-next-week">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="week" className="mt-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              const dayKey = format(day, "yyyy-MM-dd");
              const dayMeetings = meetingsByDay[dayKey] || [];

              return (
                <div key={dayKey} className="min-h-[200px]">
                  <div
                    className={`text-center p-2 rounded-md mb-2 ${
                      isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className="text-lg font-bold">{format(day, "dd")}</div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {dayMeetings.map((meeting) => (
                        <Card
                          key={meeting.id}
                          className="hover-elevate cursor-pointer"
                          data-testid={`card-meeting-${meeting.id}`}
                        >
                          <CardContent className="p-2">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{meeting.title}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {meeting.lead?.organization?.name}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {meeting.scheduledFor &&
                                    format(new Date(meeting.scheduledFor), "HH:mm")}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateMeetingStatusMutation.mutate({
                                        meetingId: meeting.id,
                                        status: "concluida",
                                      })
                                    }
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar concluída
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateMeetingStatusMutation.mutate({
                                        meetingId: meeting.id,
                                        status: "cancelada",
                                      })
                                    }
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteMeetingMutation.mutate(meeting.id)}
                                  >
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <MeetingStatusBadge status={meeting.status} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ScrollArea className="h-[calc(100vh-300px)]">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <MeetingCardSkeleton key={i} />
                ))}
              </div>
            ) : meetings && meetings.length > 0 ? (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Card key={meeting.id} className="hover-elevate" data-testid={`card-meeting-list-${meeting.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center justify-center h-14 w-14 rounded-md bg-primary/10 text-primary text-sm font-medium shrink-0">
                            <span className="text-xs">
                              {meeting.scheduledFor &&
                                format(new Date(meeting.scheduledFor), "MMM", { locale: ptBR })}
                            </span>
                            <span className="text-xl font-bold">
                              {meeting.scheduledFor &&
                                format(new Date(meeting.scheduledFor), "dd")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg">{meeting.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {meeting.lead?.organization?.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.scheduledFor &&
                                  format(new Date(meeting.scheduledFor), "HH:mm")}{" "}
                                - {meeting.duration} min
                              </span>
                              <span className="flex items-center gap-1">
                                <MeetingIcon type={meeting.meetingType} />
                                {meetingTypeLabels[meeting.meetingType].label}
                              </span>
                              {meeting.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {meeting.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MeetingStatusBadge status={meeting.status} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-meeting-menu-${meeting.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateMeetingStatusMutation.mutate({
                                    meetingId: meeting.id,
                                    status: "concluida",
                                  })
                                }
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Marcar concluída
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateMeetingStatusMutation.mutate({
                                    meetingId: meeting.id,
                                    status: "cancelada",
                                  })
                                }
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteMeetingMutation.mutate(meeting.id)}
                              >
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                type="meetings"
                actionLabel="Agendar reunião"
                onAction={() => setShowNewMeetingDialog(true)}
                testId="empty-state-meetings"
              />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewMeetingDialog} onOpenChange={setShowNewMeetingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Reunião</DialogTitle>
            <DialogDescription>Agende uma reunião com um lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Apresentação comercial"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, title: e.target.value }))}
                data-testid="input-meeting-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead">Lead *</Label>
              <Select
                value={newMeeting.leadId}
                onValueChange={(value) => setNewMeeting((prev) => ({ ...prev, leadId: value }))}
              >
                <SelectTrigger data-testid="select-meeting-lead">
                  <SelectValue placeholder="Selecione um lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads?.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.organization?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-select-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  defaultValue="09:00"
                  onChange={(e) => {
                    const date = selectedDate || new Date();
                    const [hours, minutes] = e.target.value.split(":");
                    date.setHours(parseInt(hours), parseInt(minutes));
                    setNewMeeting((prev) => ({ ...prev, scheduledFor: date.toISOString() }));
                  }}
                  data-testid="input-meeting-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newMeeting.meetingType}
                  onValueChange={(value) =>
                    setNewMeeting((prev) => ({ ...prev, meetingType: value as MeetingType }))
                  }
                >
                  <SelectTrigger data-testid="select-meeting-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={String(newMeeting.duration)}
                  onValueChange={(value) =>
                    setNewMeeting((prev) => ({ ...prev, duration: parseInt(value) }))
                  }
                >
                  <SelectTrigger data-testid="select-meeting-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local / Link</Label>
              <Input
                id="location"
                placeholder={
                  newMeeting.meetingType === "virtual"
                    ? "Link da videochamada"
                    : "Endereço do local"
                }
                value={newMeeting.location || ""}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, location: e.target.value }))}
                data-testid="input-meeting-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre a reunião..."
                value={newMeeting.notes || ""}
                onChange={(e) => setNewMeeting((prev) => ({ ...prev, notes: e.target.value }))}
                data-testid="textarea-meeting-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMeetingDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMeeting}
              disabled={createMeetingMutation.isPending}
              data-testid="button-save-meeting"
            >
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
