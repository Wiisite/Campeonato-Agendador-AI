import { Search, Users, Calendar, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateType = "search" | "leads" | "meetings" | "reports";

const emptyStateConfig: Record<EmptyStateType, { icon: React.ElementType; title: string; description: string }> = {
  search: {
    icon: Search,
    title: "Nenhum resultado encontrado",
    description: "Tente ajustar os filtros ou termos de busca para encontrar organizações.",
  },
  leads: {
    icon: Users,
    title: "Nenhum lead cadastrado",
    description: "Comece adicionando organizações à sua lista de leads para gerenciá-los.",
  },
  meetings: {
    icon: Calendar,
    title: "Nenhuma reunião agendada",
    description: "Agende sua primeira reunião com um lead para começar.",
  },
  reports: {
    icon: FileText,
    title: "Sem dados para relatório",
    description: "Adicione leads e reuniões para gerar relatórios de desempenho.",
  },
};

interface EmptyStateProps {
  type: EmptyStateType;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

export function EmptyState({ type, actionLabel, onAction, testId }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4"
      data-testid={testId || `empty-state-${type}`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {config.description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid="button-empty-state-action">
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
