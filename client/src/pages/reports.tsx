import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { MetricCard } from "@/components/metric-card";
import { MetricCardSkeleton } from "@/components/loading-skeleton";
import type { DashboardMetrics, LeadWithOrganization } from "@shared/schema";

const COLORS = ["hsl(142, 76%, 36%)", "hsl(210, 92%, 45%)", "hsl(25, 95%, 53%)", "hsl(280, 87%, 47%)", "hsl(340, 82%, 52%)"];

export default function ReportsPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: leads } = useQuery<LeadWithOrganization[]>({
    queryKey: ["/api/leads"],
  });

  const leadsByStatus = leads?.reduce(
    (acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const pieChartData = Object.entries(leadsByStatus).map(([name, value]) => ({
    name: name === "novo" ? "Novo" :
          name === "contato" ? "Contato" :
          name === "reuniao_agendada" ? "Reunião" :
          name === "negociando" ? "Negociando" :
          name === "convertido" ? "Convertido" : "Arquivado",
    value,
  }));

  const leadsBySportType = leads?.reduce(
    (acc, lead) => {
      const type = lead.organization?.sportType || "outros";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const barChartData = Object.entries(leadsBySportType).map(([name, value]) => ({
    name: name === "society" ? "Society" :
          name === "futsal" ? "Futsal" :
          name === "campo" ? "Campo" : "Outros",
    leads: value,
  }));

  const leadsByOrgType = leads?.reduce(
    (acc, lead) => {
      const type = lead.organization?.orgType || "outros";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  const orgTypeData = Object.entries(leadsByOrgType).map(([name, value]) => ({
    name: name === "empresa" ? "Empresa" :
          name === "escola" ? "Escola" :
          name === "gremio" ? "Grêmio" :
          name === "associacao" ? "Associação" :
          name === "clube" ? "Clube" : "Outros",
    leads: value,
  }));

  const totalLeads = leads?.length || 0;
  const convertedLeads = leadsByStatus["convertido"] || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6" data-testid="page-reports">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho e métricas do pipeline</p>
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
              description="leads no pipeline"
              icon={<Users className="h-4 w-4" />}
              trend={{ value: 12, isPositive: true }}
              testId="metric-total-leads"
            />
            <MetricCard
              title="Reuniões Agendadas"
              value={metrics?.meetingsScheduled ?? 0}
              description="reuniões pendentes"
              icon={<Calendar className="h-4 w-4" />}
              trend={{ value: 8, isPositive: true }}
              testId="metric-meetings"
            />
            <MetricCard
              title="Taxa de Conversão"
              value={`${metrics?.conversionRate ?? 0}%`}
              description="leads convertidos"
              icon={<Target className="h-4 w-4" />}
              trend={{ value: 5, isPositive: true }}
              testId="metric-conversion"
            />
            <MetricCard
              title="Novos esta Semana"
              value={metrics?.newLeadsThisWeek ?? 0}
              description="novos leads"
              icon={<TrendingUp className="h-4 w-4" />}
              testId="metric-new-leads"
            />
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sports" data-testid="tab-sports">Por Esporte</TabsTrigger>
          <TabsTrigger value="organizations" data-testid="tab-organizations">Por Organização</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status do Pipeline</CardTitle>
                <CardDescription>Distribuição dos leads por status</CardDescription>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Progresso dos leads no pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Novos</span>
                      <span className="font-medium">{leadsByStatus["novo"] || 0}</span>
                    </div>
                    <Progress value={totalLeads > 0 ? ((leadsByStatus["novo"] || 0) / totalLeads) * 100 : 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Em Contato</span>
                      <span className="font-medium">{leadsByStatus["contato"] || 0}</span>
                    </div>
                    <Progress value={totalLeads > 0 ? ((leadsByStatus["contato"] || 0) / totalLeads) * 100 : 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Reunião Agendada</span>
                      <span className="font-medium">{leadsByStatus["reuniao_agendada"] || 0}</span>
                    </div>
                    <Progress value={totalLeads > 0 ? ((leadsByStatus["reuniao_agendada"] || 0) / totalLeads) * 100 : 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Negociando</span>
                      <span className="font-medium">{leadsByStatus["negociando"] || 0}</span>
                    </div>
                    <Progress value={totalLeads > 0 ? ((leadsByStatus["negociando"] || 0) / totalLeads) * 100 : 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400 font-medium">Convertidos</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{convertedLeads}</span>
                    </div>
                    <Progress value={conversionRate} className="bg-green-100 dark:bg-green-900" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taxa de Conversão Total</span>
                    <Badge variant="outline" className="text-lg font-bold">
                      {conversionRate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads por Tipo de Esporte</CardTitle>
              <CardDescription>Distribuição dos leads por modalidade esportiva</CardDescription>
            </CardHeader>
            <CardContent>
              {barChartData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-sm" />
                      <YAxis className="text-sm" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="leads" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads por Tipo de Organização</CardTitle>
              <CardDescription>Distribuição dos leads por tipo de organização</CardDescription>
            </CardHeader>
            <CardContent>
              {orgTypeData.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orgTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-sm" />
                      <YAxis dataKey="name" type="category" className="text-sm" width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="leads" fill="hsl(210, 92%, 45%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
