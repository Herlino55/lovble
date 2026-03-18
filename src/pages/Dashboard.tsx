import { useEffect, useMemo } from 'react';
import { useDeliveryStore } from '@/store/deliveryStore';
import { StatsCard } from '@/components/StatsCard';
import { DeliveryCard } from '@/components/DeliveryCard';
import { Package, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, isToday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Dashboard() {
  const deliveries = useDeliveryStore((s) => s.deliveries);
  const fetchDeliveries = useDeliveryStore((s) => s.fetchDeliveries);
  const loading = useDeliveryStore((s) => s.loading);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const stats = useMemo(() => {
    const today = deliveries.filter((d) => d.expected_date && isToday(new Date(d.expected_date)));
    const week = deliveries.filter((d) => d.expected_date && isThisWeek(new Date(d.expected_date), { weekStartsOn: 1 }));
    const delivered = deliveries.filter((d) => d.status === 'delivered');
    const totalDelivery = delivered.reduce((s, d) => {
      const expenses = d.expenses?.reduce((se, e) => se + Number(e.amount), 0) || 0;
      return s + Number(d.price) + expenses;
    }, 0);
    const successRate = deliveries.length > 0 ? Math.round((delivered.length / deliveries.length) * 100) : 0;
    return { todayCount: today.length, weekCount: week.length, totalDelivery, successRate };
  }, [deliveries]);

  const chartData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = deliveries.filter((d) => d.created_at.startsWith(dateStr)).length;
      return { date: format(date, 'dd/MM', { locale: fr }), count };
    });
  }, [deliveries]);

  console.log(deliveries)

  const activeDeliveries = useMemo(() =>
    deliveries.filter((d) => ['pending', 'picked_up', 'in_transit'].includes(d.status)),
    [deliveries]
  );

  if (loading && deliveries.length === 0) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de vos livraisons</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Aujourd'hui" value={stats.todayCount} icon={Package} />
        <StatsCard title="Cette semaine" value={stats.weekCount} icon={TrendingUp} />
        <StatsCard title="Total Livraison" value={`${stats.totalDelivery.toLocaleString('fr-FR')} FCFA`} icon={DollarSign} />
        <StatsCard title="Taux de réussite" value={`${stats.successRate}%`} icon={CheckCircle} />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Livraisons — 30 derniers jours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(220, 13%, 89%)', fontSize: '0.875rem' }} />
                <Bar dataKey="count" name="Livraisons" fill="hsl(36, 95%, 52%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Livraisons en cours</h2>
        {activeDeliveries.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune livraison en cours</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeDeliveries.map((d) => <DeliveryCard key={d.id} delivery={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
