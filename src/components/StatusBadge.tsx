import { Badge } from '@/components/ui/badge';
import type { DeliveryStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<DeliveryStatus, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-warning/15 text-warning border-warning/30' },
  picked_up: { label: 'Récupéré', className: 'bg-info/15 text-info border-info/30' },
  in_transit: { label: 'En transit', className: 'bg-primary/15 text-primary border-primary/30' },
  delivered: { label: 'Livré', className: 'bg-success/15 text-success border-success/30' },
  failed: { label: 'Échoué', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  cancelled: { label: 'Annulé', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium text-xs', config.className)}>
      {config.label}
    </Badge>
  );
}
