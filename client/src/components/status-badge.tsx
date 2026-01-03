import { Badge } from "@/components/ui/badge";
import type { LeadStatus, MeetingStatus } from "@shared/schema";

const leadStatusConfig: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  novo: { label: "Novo", variant: "default" },
  contato: { label: "Contato", variant: "secondary" },
  reuniao_agendada: { label: "Reunião Agendada", variant: "outline" },
  negociando: { label: "Negociando", variant: "secondary" },
  convertido: { label: "Convertido", variant: "default" },
  arquivado: { label: "Arquivado", variant: "destructive" },
};

const meetingStatusConfig: Record<MeetingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  agendada: { label: "Agendada", variant: "outline" },
  concluida: { label: "Concluída", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = leadStatusConfig[status];
  return (
    <Badge variant={config.variant} data-testid={`badge-lead-status-${status}`}>
      {config.label}
    </Badge>
  );
}

interface MeetingStatusBadgeProps {
  status: MeetingStatus;
}

export function MeetingStatusBadge({ status }: MeetingStatusBadgeProps) {
  const config = meetingStatusConfig[status];
  return (
    <Badge variant={config.variant} data-testid={`badge-meeting-status-${status}`}>
      {config.label}
    </Badge>
  );
}
