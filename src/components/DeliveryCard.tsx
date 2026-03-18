import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './StatusBadge';
import { MapPin, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Delivery } from '@/store/deliveryStore';

export function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const navigate = useNavigate();

  return (
    <Card
      className="shadow-card hover:shadow-card-hover transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => navigate(`/deliveries/${delivery.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-sm">{delivery.reference}</p>
            <p className="text-xs text-muted-foreground">{delivery.description}</p>
          </div>
          <StatusBadge status={delivery.status} />
        </div>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{delivery.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{delivery.recipient_name} — {delivery.recipient_phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{delivery.expected_date ? format(new Date(delivery.expected_date), 'dd MMM yyyy HH:mm', { locale: fr }) : '—'}</span>
            </div>
            <span className="font-semibold text-foreground">{Number(delivery.price).toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
