import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useRoleStore } from '@/store/roleStore';
import { Package, LayoutDashboard, Plus, List, Users, LogOut, Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/deliveries', icon: List, label: 'Livraisons' },
  { to: '/deliveries/new', icon: Plus, label: 'Nouvelle', requiresCreatePermission: true },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/permissions', icon: Shield, label: 'Droits', superAdminOnly: true },
];

export default function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const isSuperAdmin = useRoleStore((s) => s.isSuperAdmin);
  const canCreateDeliveries = useRoleStore((s) => s.canCreateDeliveries);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = allNavItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    if (item.requiresCreatePermission && !canCreateDeliveries) return false;
    return true;
  });

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-64 flex-col gradient-primary text-primary-foreground">
        <div className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center">
            <Package className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-bold text-lg">DelivTrack</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}>
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-primary-foreground/50 mb-1">{profile?.name || user?.email}</p>
          <p className="text-xs text-primary-foreground/40 mb-2">{user?.email}</p>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-sidebar-accent/50 gap-2">
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Package className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-bold">DelivTrack</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {mobileOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 z-50 bg-card border-b shadow-lg p-3 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-accent/15 text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
                )}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-destructive gap-2 mt-2">
              <LogOut className="h-4 w-4" /> Déconnexion
            </Button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}