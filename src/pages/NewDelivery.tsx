import { toast } from 'sonner';
import { DeliveryForm } from '@/components/delivery/DeliveryForm';
import { useDeliveryStore } from '@/store/deliveryStore';

export default function NewDelivery() {
  const addDelivery = useDeliveryStore((s) => s.addDelivery);

  return (
    <DeliveryForm
      title="Nouvelle livraison"
      submitLabel="Créer la livraison"
      submittingLabel="Création..."
      onSubmit={async (values) => {
        const id = await addDelivery(values);
        if (id) {
          toast.success('Livraison créée avec succès');
          return true;
        }

        toast.error('Erreur lors de la création');
        return false;
      }}
    />
  );
}
