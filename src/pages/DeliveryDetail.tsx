import { useParams, useNavigate } from 'react-router-dom';
import { useDeliveryStore } from '@/store/deliveryStore';
import { useRoleStore } from '@/store/roleStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Phone, User, Calendar, DollarSign, Send, ImagePlus, Plus, Trash2, Receipt, Pencil, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { DeliveryStatus } from '@/types';

const STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'picked_up', label: 'Récupéré' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'delivered', label: 'Livré' },
  { value: 'failed', label: 'Échoué' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const delivery = useDeliveryStore((s) => s.getDelivery(id!));
  const fetchDeliveries = useDeliveryStore((s) => s.fetchDeliveries);
  const updateStatus = useDeliveryStore((s) => s.updateStatus);
  const addComment = useDeliveryStore((s) => s.addComment);
  const addProofPhoto = useDeliveryStore((s) => s.addProofPhoto);
  const addExpense = useDeliveryStore((s) => s.addExpense);
  const deleteExpense = useDeliveryStore((s) => s.deleteExpense);
  const deleteDelivery = useDeliveryStore((s) => s.deleteDelivery);
  const [comment, setComment] = useState('');
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const isSuperAdmin = useRoleStore((s) => s.isSuperAdmin);
  const canUpdate = useRoleStore((s) => s.canUpdateDeliveries);
  const canDelete = useRoleStore((s) => s.canDeleteDeliveries);

  useEffect(() => {
    if (!delivery) fetchDeliveries();
  }, [delivery, fetchDeliveries]);

  if (!delivery) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Livraison introuvable</p>
        <Button variant="outline" onClick={() => navigate('/deliveries')} className="mt-4">Retour</Button>
      </div>
    );
  }

  const handleStatusChange = async (status: string) => {
    await updateStatus(delivery.id, status as DeliveryStatus);
    toast.success('Statut mis à jour');
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await addComment(delivery.id, comment);
    setComment('');
    toast.success('Commentaire ajouté');
  };

  const handleProofPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await addProofPhoto(delivery.id, ev.target?.result as string);
      toast.success('Photo preuve ajoutée');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{delivery.reference}</h1>
          <p className="text-sm text-muted-foreground">{delivery.description}</p>
        </div>
        {canUpdate && (
          <Button variant="outline" className="gap-2" onClick={() => navigate(`/deliveries/${delivery.id}/edit`)}>
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
        )}
        {canDelete && (
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="Supprimer cette livraison ?"
            description={`La livraison "${delivery.reference}" sera définitivement supprimée avec tous ses commentaires et dépenses.`}
            confirmLabel="Supprimer"
            destructive
            onConfirm={async () => {
              const ok = await deleteDelivery(delivery.id);
              if (ok) {
                toast.success('Livraison supprimée');
                navigate('/deliveries');
              } else {
                toast.error('Erreur lors de la suppression');
              }
            }}
          />
        )}
        <StatusBadge status={delivery.status} />
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow icon={User} label="Destinataire" value={delivery.recipient_name} />
          <InfoRow icon={Phone} label="Téléphone" value={delivery.recipient_phone} />
          <InfoRow icon={MapPin} label="Adresse" value={delivery.address} />
          <InfoRow icon={Calendar} label="Date prévue" value={delivery.expected_date ? format(new Date(delivery.expected_date), "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : 'Non définie'} />
          <InfoRow icon={DollarSign} label="Prix" value={`${Number(delivery.price).toLocaleString('fr-FR')} FCFA`} />
          {delivery.notes && <InfoRow icon={Send} label="Notes" value={delivery.notes} />}
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Changer le statut</CardTitle></CardHeader>
          <CardContent>
            <Select value={delivery.status} onValueChange={handleStatusChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Dépenses
            </CardTitle>
            <p className="text-sm font-semibold text-accent">
              {delivery.expenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {delivery.expenses.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucune dépense enregistrée</p>
          )}
          {delivery.expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <div>
                <p className="font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(e.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{Number(e.amount).toLocaleString('fr-FR')} FCFA</span>
                {isSuperAdmin && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={async () => { await deleteExpense(e.id, delivery.id); toast.success('Dépense supprimée'); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isSuperAdmin && (
            <div className="flex gap-2">
              <Input value={expenseLabel} onChange={(e) => setExpenseLabel(e.target.value)} placeholder="Libellé (ex: Carburant)" className="flex-1" />
              <Input value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="Montant" type="number" className="w-28" />
              <Button size="icon" className="gradient-accent text-accent-foreground shrink-0"
                onClick={async () => {
                  if (!expenseLabel.trim() || !expenseAmount) return;
                  await addExpense(delivery.id, expenseLabel.trim(), Number(expenseAmount));
                  setExpenseLabel(''); setExpenseAmount('');
                  toast.success('Dépense ajoutée');
                }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {(delivery.photos.length > 0 || delivery.proof_photos.length > 0) && (
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-base">Photos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[...delivery.photos, ...delivery.proof_photos].map((p, i) => (
                <img key={i} src={p} alt="" className="w-24 h-24 rounded-lg object-cover border" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isSuperAdmin && (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preuves de livraison</CardTitle>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <span><ImagePlus className="h-4 w-4" /> Photo</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleProofPhoto} />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {delivery.proof_photos.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune preuve ajoutée</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {delivery.proof_photos.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-24 h-24 rounded-lg object-cover border" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Commentaires</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {delivery.comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted p-3 text-sm">
              <p>{c.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(c.created_at), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            </div>
          ))}
          {isSuperAdmin && (
            <div className="flex gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire..."
                onKeyDown={(e) => e.key === 'Enter' && handleComment()} />
              <Button onClick={handleComment} size="icon" className="gradient-accent text-accent-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}