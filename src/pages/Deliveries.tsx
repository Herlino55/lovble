import { useState, useMemo, useEffect } from 'react';
import { useDeliveryStore } from '@/store/deliveryStore';
import { useRoleStore } from '@/store/roleStore';
import { DeliveryCard } from '@/components/DeliveryCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Download, Plus, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DateFilterPopOver } from '@/components/DateFilterPopOver';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' }, 
  { value: 'pending', label: 'En attente' },
  { value: 'picked_up', label: 'Récupéré' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'delivered', label: 'Livré' },
  { value: 'failed', label: 'Échoué' },
  { value: 'cancelled', label: 'Annulé' },
];

export default function Deliveries() {
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const fetchDeliveries = useDeliveryStore((s) => s.fetchDeliveries);
  const isSuperAdmin = useRoleStore((s) => s.isSuperAdmin);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<string | null>(
    new Date().toISOString().slice(0, 10)  // aujourd'hui par défaut
  );

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const filtered = useMemo(() => {
    let list = deliveries;

    if (dateFilter) {
      list = list.filter((d) => {
        const day = new Date(d.expected_date).toISOString().slice(0, 10);
        return day === dateFilter;
      });
    }

    if (statusFilter !== 'all') list = list.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.reference.toLowerCase().includes(q) ||
        d.recipient_name.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q)
      );
    }
    return list;
  }, [deliveries, statusFilter, search, dateFilter]);

  const exportCSV = () => {
    const headers = 'Référence,Destinataire,Adresse,Statut,Prix,Date\n';
    const rows = filtered.map((d) =>
      `"${d.reference}","${d.recipient_name}","${d.address}","${d.status}","${d.price}","${d.expected_date}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'livraisons.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Livraisons</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} livraison(s)</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => navigate('/deliveries/new')} className="gradient-accent text-accent-foreground gap-2">
            <Plus className="h-4 w-4" /> Nouvelle
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> CSV
        </Button>
        <DateFilterPopOver value={dateFilter} onChange={setDateFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>Aucune livraison trouvée</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => <DeliveryCard key={d.id} delivery={d} />)}
        </div>
      )}
    </div>
  );
}
