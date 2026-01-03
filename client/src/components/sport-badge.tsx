import { Badge } from "@/components/ui/badge";
import type { SportType, OrganizationType } from "@shared/schema";

const sportTypeLabels: Record<SportType, string> = {
  society: "Society",
  futsal: "Futsal",
  campo: "Campo",
};

const orgTypeLabels: Record<OrganizationType, string> = {
  empresa: "Empresa",
  escola: "Escola",
  gremio: "Grêmio",
  associacao: "Associação",
  clube: "Clube",
};

interface SportTypeBadgeProps {
  type: SportType;
}

export function SportTypeBadge({ type }: SportTypeBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs" data-testid={`badge-sport-${type}`}>
      {sportTypeLabels[type]}
    </Badge>
  );
}

interface OrgTypeBadgeProps {
  type: OrganizationType;
}

export function OrgTypeBadge({ type }: OrgTypeBadgeProps) {
  return (
    <Badge variant="secondary" className="text-xs" data-testid={`badge-org-${type}`}>
      {orgTypeLabels[type]}
    </Badge>
  );
}
