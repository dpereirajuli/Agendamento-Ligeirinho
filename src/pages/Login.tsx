import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { toast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo credentials
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      localStorage.setItem('user', JSON.stringify({ role: 'admin', name: 'Administrador' }));
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo ao painel administrativo.'
      });
      window.location.href = '/admin';
    } else if (credentials.username === 'cliente' && credentials.password === 'cliente123') {
      localStorage.setItem('user', JSON.stringify({ role: 'client', name: 'João Silva' }));
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta!'
      });
      window.location.href = '/agendamento';
    } else {
      toast({
        title: 'Credenciais inválidas',
        description: 'Usuário ou senha incorretos.',
        variant: 'destructive'
      });
    }
  };

  const handleDemoLogin = (type: 'admin' | 'client') => {
    if (type === 'admin') {
      setCredentials({ username: 'admin', password: 'admin123' });
    } else {
      setCredentials({ username: 'cliente', password: 'cliente123' });
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
                      Nome de Usuário
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Seu nome de usuário"
                        value={credentials.username}
                        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
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

                  <Button type="submit" className="w-full btn-premium">
                    Entrar
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
                      Acesso Admin
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDemoLogin('client')}
                    >
                      Acesso Cliente
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