import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Package, Mail, Lock, User } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Veuillez remplir tous les champs'); return; }
    if (isSignup && !name) { setError('Le nom est requis'); return; }
    setLoading(true);

    if (isSignup) {
      const { error } = await signup(email, password, name);
      setLoading(false);
      if (error) setError(error);
      else setSuccess('Compte créé ! Vérifiez votre email pour confirmer.');
    } else {
      const { error } = await login(email, password);
      setLoading(false);
      if (error) setError(error);
      else navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-accent mb-2">
            <Package className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DelivTrack</h1>
          <p className="text-sm text-muted-foreground">
            {isSignup ? 'Créez votre compte' : 'Connectez-vous pour gérer vos livraisons'}
          </p>
        </div>
        <Card className="shadow-card">
          <CardHeader className="pb-4" />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Votre nom" value={name}
                      onChange={(e) => setName(e.target.value)} className="pl-10" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="vous@exemple.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="pl-10" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-primary">{success}</p>}
              <Button type="submit" className="w-full gradient-accent text-accent-foreground font-semibold" disabled={loading}>
                {loading ? 'Chargement...' : isSignup ? 'Créer un compte' : 'Se connecter'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {isSignup ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
                <button type="button" onClick={() => { setIsSignup(!isSignup); setError(''); setSuccess(''); }}
                  className="text-primary font-medium hover:underline">
                  {isSignup ? 'Se connecter' : "S'inscrire"}
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
