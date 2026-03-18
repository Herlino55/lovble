/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Shield, Truck, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ManagedUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
  roles: string[];
  parent_id: string | null;
}

const TOGGLEABLE_ROLES = [
  { role: 'delivery_creator', label: 'Créer', icon: Truck, description: 'Créer des livraisons' },
  { role: 'delivery_updater', label: 'Modifier', icon: Pencil, description: 'Modifier des livraisons' },
  { role: 'delivery_deleter', label: 'Supprimer', icon: Trash2, description: 'Supprimer des livraisons' },
] as const;

export default function UserPermissions() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  // Create user dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);

    const [profilesResponse, rolesResponse] = await Promise.all([
      supabase.from('profiles').select('user_id, name, avatar_url, parent_id').order('created_at', { ascending: true }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    if (profilesResponse.error || rolesResponse.error) {
      toast.error('Impossible de charger les droits utilisateurs');
      setLoading(false);
      return;
    }

    const profiles = profilesResponse.data || [];
    const roles = (rolesResponse.data || []) as Array<{ user_id: string; role: string }>;
    const rolesByUser = new Map<string, string[]>();

    roles.forEach((item) => {
      rolesByUser.set(item.user_id, [...(rolesByUser.get(item.user_id) || []), item.role]);
    });

    setUsers(
      profiles.map((profile: any) => ({
        user_id: profile.user_id,
        name: profile.name || 'Utilisateur sans nom',
        avatar_url: profile.avatar_url,
        parent_id: profile.parent_id,
        roles: rolesByUser.get(profile.user_id) || [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      user.name.toLowerCase().includes(query) || user.user_id.toLowerCase().includes(query)
    );
  }, [search, users]);

  const handleToggleRole = async (user: ManagedUser, role: string, enabled: boolean) => {
    if (user.roles.includes('superadmin')) return;

    setBusyUserId(user.user_id);

    const { error } = enabled
      ? await supabase.from('user_roles').insert({ user_id: user.user_id, role: role as any })
      : await supabase.from('user_roles').delete().eq('user_id', user.user_id).eq('role', role as any);

    setBusyUserId(null);

    if (error && error.code !== '23505') {
      toast.error('Mise à jour des droits impossible');
      return;
    }

    setUsers((current) => current.map((item) => {
      if (item.user_id !== user.user_id) return item;
      const nextRoles = enabled
        ? Array.from(new Set([...item.roles, role]))
        : item.roles.filter((r) => r !== role);
      return { ...item, roles: nextRoles };
    }));

    toast.success(enabled ? 'Droit accordé' : 'Droit retiré');
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast.error('Email et mot de passe requis');
      return;
    }
    setCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expirée');
      setCreating(false);
      return;
    }

    const res = await supabase.functions.invoke('create-user', {
      body: { email: newEmail, password: newPassword, name: newName || undefined },
    });

    setCreating(false);

    if (res.error || res.data?.error) {
      toast.error(res.data?.error || 'Erreur lors de la création');
      return;
    }

    toast.success(`Utilisateur ${newEmail} créé`);
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setDialogOpen(false);
    fetchUsers();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Droits utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Gérez les accès CRUD de vos utilisateurs sur vos livraisons.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> Créer un utilisateur</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="jean@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe *</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" onClick={handleCreateUser} disabled={creating}>
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou identifiant..."
        />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Gestion des accès</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement des utilisateurs...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
          ) : (
            filteredUsers.map((user) => {
              const isSuperAdmin = user.roles.includes('superadmin');

              return (
                <div key={user.user_id} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.user_id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 font-medium text-accent-foreground">
                          <Shield className="h-3 w-3" /> SuperAdmin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
                          {user.parent_id ? 'Sous-utilisateur' : 'Lecture seule'}
                        </span>
                      )}
                      {!isSuperAdmin && TOGGLEABLE_ROLES.filter((r) => user.roles.includes(r.role)).map((r) => (
                        <span key={r.role} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                          <r.icon className="h-3 w-3" /> {r.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {!isSuperAdmin && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {TOGGLEABLE_ROLES.map((r) => (
                        <div key={r.role} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{r.description}</p>
                          </div>
                          <Switch
                            checked={user.roles.includes(r.role)}
                            disabled={busyUserId === user.user_id}
                            onCheckedChange={(checked) => handleToggleRole(user, r.role, checked)}
                            aria-label={`${r.description} pour ${user.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {isSuperAdmin && (
                    <p className="text-xs text-muted-foreground italic">Tous les droits sont accordés au SuperAdmin.</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}