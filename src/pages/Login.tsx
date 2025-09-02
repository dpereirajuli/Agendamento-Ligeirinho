import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(credentials.email, credentials.password);
      
      if (error) {
        toast({
          title: 'Erro no login',
          description: error.message || 'Credenciais inválidas.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao painel administrativo.'
        });
        navigate('/admin');
      }
    } catch (error) {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro durante o login.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (type: 'admin' | 'client') => {
    if (type === 'admin') {
      setCredentials({ email: 'admin@barbearia.com', password: 'admin123' });
    } else {
      setCredentials({ email: 'cliente@barbearia.com', password: 'cliente123' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Barbearia Premium São Paulo</title>
        <meta name="description" content="Acesse sua conta na Barbearia Premium em São Paulo para agendar cortes, barbas e gerenciar seus horários." />
        <meta name="keywords" content="login barbearia, acessar conta, agendamento online, barbearia São Paulo" />
        <link rel="canonical" href="https://www.seusite.com.br/login" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <div className="card-premium p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogIn className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Entrar na Conta</h1>
                  <p className="text-muted-foreground">
                    Acesse sua conta para gerenciar agendamentos
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Seu email"
                        value={credentials.email}
                        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Sua senha"
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-premium" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border/20">
                  <h3 className="text-sm font-medium mb-4 text-center">Credenciais de Demonstração</h3>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDemoLogin('admin')}
                    >
                      Acesso Admin (admin@barbearia.com)
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDemoLogin('client')}
                    >
                      Acesso Cliente (cliente@barbearia.com)
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Não tem uma conta?{' '}
                    <Link to="/" className="text-primary hover:underline">
                      Voltar ao início
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}