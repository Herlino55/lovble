import { useState, useEffect } from 'react';
import { useClientStore } from '@/store/clientStore';
import { useRoleStore } from '@/store/roleStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Search, Phone, Mail, MapPin, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type DbClient = Tables<'clients'>;

export default function Clients() {
  const { clients, fetchClients, addClient, updateClient, deleteClient } = useClientStore();
  const isSuperAdmin = useRoleStore((s) => s.isSuperAdmin);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbClient | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '' }); setDialogOpen(true); };
  const openEdit = (c: DbClient) => { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error('Nom et téléphone requis'); return; }
    if (editing) {
      await updateClient(editing.id, form);
      toast.success('Client mis à jour');
    } else {
      await addClient(form);
      toast.success('Client ajouté');
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">{clients.length} client(s)</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openNew} className="gradient-accent text-accent-foreground gap-2">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucun client trouvé</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  {isSuperAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <ConfirmDialog
                        trigger={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                        title="Supprimer le client"
                        description={`Voulez-vous vraiment supprimer ${c.name} ?`}
                        onConfirm={async () => { await deleteClient(c.id); toast.success('Client supprimé'); }}
                        confirmLabel="Supprimer"
                        destructive
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{c.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{c.email}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /><span className="truncate">{c.address}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5"><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" /></div>
            <div className="space-y-1.5"><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleSave} className="flex-1 gradient-accent text-accent-foreground">Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
