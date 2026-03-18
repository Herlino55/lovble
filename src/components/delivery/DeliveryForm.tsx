import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Delivery } from '@/store/deliveryStore';

interface DeliveryFormValues {
  reference: string;
  description: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  price: string;
  expectedDate: string;
  notes: string;
}

interface DeliveryFormSubmitValues {
  reference: string;
  description: string;
  photos: string[];
  recipientName: string;
  recipientPhone: string;
  address: string;
  price: number;
  expectedDate: string;
  notes: string;
}

interface DeliveryFormProps {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  initialDelivery?: Delivery;
  onSubmit: (values: DeliveryFormSubmitValues) => Promise<boolean>;
}

export function DeliveryForm({
  title,
  submitLabel,
  submittingLabel,
  initialDelivery,
  onSubmit,
}: DeliveryFormProps) {
  const navigate = useNavigate();
  const initialForm = useMemo<DeliveryFormValues>(() => ({
    reference: initialDelivery?.reference ?? '',
    description: initialDelivery?.description ?? '',
    recipientName: initialDelivery?.recipient_name ?? '',
    recipientPhone: initialDelivery?.recipient_phone ?? '',
    address: initialDelivery?.address ?? '',
    price: initialDelivery ? String(Number(initialDelivery.price)) : '',
    expectedDate: initialDelivery?.expected_date ? toDateTimeLocal(initialDelivery.expected_date) : '',
    notes: initialDelivery?.notes ?? '',
  }), [initialDelivery]);

  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState<string[]>(initialDelivery?.photos ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof DeliveryFormValues, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos');
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos((p) => [...p, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.reference.trim()) errs.reference = 'Requis';
    if (!form.recipientName.trim()) errs.recipientName = 'Requis';
    if (!form.recipientPhone.trim()) errs.recipientPhone = 'Requis';
    if (!form.address.trim()) errs.address = 'Requis';
    if (!form.price || isNaN(Number(form.price))) errs.price = 'Prix invalide';
    if (!form.expectedDate) errs.expectedDate = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const ok = await onSubmit({
      reference: form.reference.trim(),
      description: form.description.trim(),
      photos,
      recipientName: form.recipientName.trim(),
      recipientPhone: form.recipientPhone.trim(),
      address: form.address.trim(),
      price: Number(form.price),
      expectedDate: form.expectedDate,
      notes: form.notes.trim(),
    });
    setSubmitting(false);

    if (ok) navigate('/deliveries');
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Informations du colis</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Référence colis" error={errors.reference}>
                <Input value={form.reference} onChange={(e) => set('reference', e.target.value)} placeholder="COL-2026-XXX" />
              </Field>
              <Field label="Prix transport (FCFA)" error={errors.price}>
                <Input value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0" type="number" step="1" />
              </Field>
            </div>

            <Field label="Description produit">
              <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Description du produit" />
            </Field>

            <div>
              <Label className="mb-2 block">Photos produit (max 5)</Label>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={`${p}-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={p} alt={`Photo produit ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                      className="absolute top-0.5 right-0.5 rounded-full bg-foreground/70 p-0.5"
                    >
                      <X className="h-3 w-3 text-background" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhoto} />
                  </label>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="font-medium text-sm mb-3">Destinataire</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nom" error={errors.recipientName}>
                  <Input value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} placeholder="Nom complet" />
                </Field>
                <Field label="Téléphone" error={errors.recipientPhone}>
                  <Input value={form.recipientPhone} onChange={(e) => set('recipientPhone', e.target.value)} placeholder="+237 6XX XX XX XX" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Adresse de livraison" error={errors.address}>
                  <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Adresse complète" />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date et heure de livraison prévue" error={errors.expectedDate}>
                <Input type="datetime-local" value={form.expectedDate} onChange={(e) => set('expectedDate', e.target.value)} />
              </Field>
            </div>

            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Instructions spéciales..." rows={3} />
            </Field>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Annuler</Button>
              <Button type="submit" className="flex-1 gradient-accent text-accent-foreground font-semibold" disabled={submitting}>
                {submitting ? submittingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
