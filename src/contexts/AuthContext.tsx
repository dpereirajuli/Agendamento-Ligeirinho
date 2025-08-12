import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (session: Session | null) => {
    try {
      console.log('loadProfile called with session:', session);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        setTimeout(async () => {
          console.log('Fetching profile for user ID:', session.user.id);
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log('Profile fetch result:', { profileData, error });

          if (error) {
            console.error('Erro ao buscar perfil:', error.message);
            setProfile(null);
          } else if (profileData) {
            const typedProfile: Profile = {
              id: profileData.id,
              name: profileData.name,
              email: profileData.email,
              role: profileData.role as 'admin' | 'user',
              approval_status: profileData.approval_status as 'pending' | 'approved' | 'rejected',
            };
            setProfile(typedProfile);
            console.log('Profile set in context:', typedProfile);
          } else {
            console.warn('Nenhum perfil encontrado para o usuário');
            setProfile(null);
          }
          setLoading(false);
          console.log('setLoading(false) called (dentro do setTimeout)');
        }, 0);
      } else {
        console.log('No session user, profile set to null');
        setProfile(null);
        setLoading(false);
        console.log('setLoading(false) called (no session user)');
      }
    } catch (error) {
      console.error('Erro inesperado no loadProfile:', error);
      setProfile(null);
      setLoading(false);
      console.log('setLoading(false) called (erro inesperado)');
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect mounted');
    const initializeAuth = async () => {
      try {
        console.log('Iniciando getSession');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao obter sessão:', error.message);
        }
        console.log('getSession result:', session);
        await loadProfile(session);
      } catch (error) {
        console.error('Erro inesperado na inicialização:', error);
        setLoading(false);
        console.log('setLoading(false) called devido a erro na inicialização');
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('onAuthStateChange event:', _event, session);
        await loadProfile(session);
      }
    );

    return () => {
      console.log('Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Erro no signIn:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name }
        }
      });
      return { error };
    } catch (error) {
      console.error('Erro no signUp:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Erro no signOut:', error);
    }
  };

  const isApproved = profile?.approval_status?.trim().toLowerCase() === 'approved';

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isApproved
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}