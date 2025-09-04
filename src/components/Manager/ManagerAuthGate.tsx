import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from './AuthForm';
import { Button } from '@/components/ui/button';

export function ManagerAuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isApproved, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('ManagerAuthGate:', { user, profile, isApproved, loading, pathname: location.pathname });

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Timeout na verificação de autenticação');
        navigate('/dashboard', { replace: true });
      }
    }, 10000); // 10 segundos de timeout

    if (user && profile && !isApproved && !['/dashboard', '/dashboard/'].includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }

    return () => clearTimeout(timeout);
  }, [user, profile, isApproved, loading, navigate]);

  if (loading) {
    console.log('ManagerAuthGate: Loading state is true');
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>;
  }

  if (!user) {
    return <AuthForm />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Acesso negado
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Seu perfil não foi encontrado. Contate o administrador.
            </p>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={signOut} variant="outline">
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Aguardando Aprovação
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Sua conta está pendente de aprovação pelo administrador. Por favor, aguarde.
            </p>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={signOut} variant="outline">
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}