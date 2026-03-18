import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DeliveryForm } from '@/components/delivery/DeliveryForm';
import { useDeliveryStore } from '@/store/deliveryStore';

export default function EditDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const delivery = useDeliveryStore((s) => (id ? s.getDelivery(id) : undefined));
  const fetchDeliveries = useDeliveryStore((s) => s.fetchDeliveries);
  const updateDelivery = useDeliveryStore((s) => s.updateDelivery);

  useEffect(() => {
    if (!delivery) fetchDeliveries();
  }, [delivery, fetchDeliveries]);

  if (!id) {
    navigate('/deliveries');
    return null;
  }

  if (!delivery) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Chargement de la livraison...</p>
      </div>
    );
  }

  return (
    <DeliveryForm
      title="Modifier la livraison"
      submitLabel="Mettre à jour la livraison"
      submittingLabel="Mise à jour..."
      initialDelivery={delivery}
      onSubmit={async (values) => {
        const ok = await updateDelivery(id, values);
        if (ok) {
          toast.success('Livraison mise à jour avec succès');
          return true;
        }

        toast.error('Erreur lors de la mise à jour');
        return false;
      }}
    />
  );
}
