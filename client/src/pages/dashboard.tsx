import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  Clock,
  ArrowRight,
  Search,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetricCard } from "@/components/metric-card";
import { MetricCardSkeleton, MeetingCardSkeleton } from "@/components/loading-skeleton";
import { LeadStatusBadge } from "@/components/status-badge";
import { SportTypeBadge, OrgTypeBadge } from "@/components/sport-badge";
import type { DashboardMetrics, LeadWithOrganization, MeetingWithLead } from "@shared/schema";

export default function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: recentLeads, isLoading: leadsLoading } = useQuery<LeadWithOrganization[]>({
    queryKey: ["/api/leads", { limit: 5 }],
  });

  const { data: upcomingMeetings, isLoading: meetingsLoading } = useQuery<MeetingWithLead[]>({
    queryKey: ["/api/meetings", { status: "agendada", limit: 5 }],
  });

  return (
    <div className="p-6 lg:p-8 space-y-8" data-testid="page-dashboard">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu pipeline de vendas esportivas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total de Leads"
              value={metrics?.totalLeads ?? 0}
              description="leads ativos"
              icon={<Users className="h-4 w-4" />}
              trend={{ value: 12, isPositive: true }}
              testId="metric-total-leads"
            />
            <MetricCard
              title="Reuniões Agendadas"
              value={metrics?.meetingsScheduled ?? 0}
              description="esta semana"
              icon={<Calendar className="h-4 w-4" />}
              trend={{ value: 8, isPositive: true }}
              testId="metric-meetings"
            />
            <MetricCard
              title="Taxa de Conversão"
              value={`${metrics?.conversionRate ?? 0}%`}
              description="do mês"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: 5, isPositive: true }}
              testId="metric-conversion"
            />
            <MetricCard
              title="Novos Leads"
              value={metrics?.newLeadsThisWeek ?? 0}
              description="últimos 7 dias"
              icon={<Plus className="h-4 w-4" />}
              testId="metric-new-leads"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Leads Recentes</CardTitle>
              <CardDescription>Últimas organizações adicionadas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leads" data-testid="link-view-all-leads">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[340px]">
              {leadsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-md bg-muted/50 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentLeads && recentLeads.length > 0 ? (
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 rounded-md border hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`card-lead-${lead.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{lead.organization?.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {lead.organization?.sportType && (
                              <SportTypeBadge type={lead.organization.sportType} />
                            )}
                            {lead.organization?.orgType && (
                              <OrgTypeBadge type={lead.organization.orgType} />
                            )}
                          </div>
                          {lead.organization?.contactInfo?.city && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {lead.organization.contactInfo.city}, {lead.organization.contactInfo.state}
                            </p>
                          )}
                        </div>
                        <LeadStatusBadge status={lead.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum lead cadastrado</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/search" data-testid="link-add-first-lead">
                      <Search className="h-4 w-4 mr-2" />
                      Buscar organizações
                    </Link>
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Próximas Reuniões</CardTitle>
              <CardDescription>Agenda da semana</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meetings" data-testid="link-view-all-meetings">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[340px]">
              {meetingsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <MeetingCardSkeleton key={i} />
                  ))}
                </div>
              ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-3 rounded-md border hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`card-meeting-${meeting.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary text-sm font-medium">
                          <span className="text-xs">
                            {meeting.scheduledFor && format(new Date(meeting.scheduledFor), "MMM", { locale: ptBR })}
                          </span>
                          <span className="text-lg font-bold">
                            {meeting.scheduledFor && format(new Date(meeting.scheduledFor), "dd")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {meeting.lead?.organization?.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {meeting.scheduledFor && format(new Date(meeting.scheduledFor), "HH:mm")}
                            <span className="mx-1">-</span>
                            {meeting.duration} min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">Nenhuma reunião agendada</p>
                  <Button size="sm" className="mt-4" asChild>
                    <Link href="/meetings" data-testid="link-schedule-first-meeting">
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar reunião
                    </Link>
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
              <Link href="/search" data-testid="button-quick-search">
                <Search className="h-5 w-5" />
                <span>Nova Busca</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
              <Link href="/meetings?new=true" data-testid="button-quick-meeting">
                <Calendar className="h-5 w-5" />
                <span>Agendar Reunião</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
              <Link href="/leads?new=true" data-testid="button-quick-lead">
                <Plus className="h-5 w-5" />
                <span>Novo Lead</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2 justify-start" asChild>
              <Link href="/reports" data-testid="button-quick-reports">
                <TrendingUp className="h-5 w-5" />
                <span>Ver Relatórios</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
