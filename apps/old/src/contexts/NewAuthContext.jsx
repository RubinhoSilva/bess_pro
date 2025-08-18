
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; 
import { useToast } from '@/components/ui/use-toast';
import { add } from 'date-fns';

const NewAuthContext = createContext(undefined);

export const NewAuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOutAndClear = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error("Critical error fetching profile:", e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        if (event === 'SIGNED_OUT') {
          signOutAndClear();
        } else if (session) {
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          signOutAndClear();
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
            setSession(session);
            setUser(session.user);
            await fetchProfile(session.user.id);
        }
        setLoading(false);
    }).catch(() => {
        signOutAndClear();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, signOutAndClear]);
  
  const signUp = useCallback(async (email, password, metadata = {}) => {
    const trialEndsAt = add(new Date(), { days: 7 });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          is_first_login: true,
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no Cadastro",
        description: error.message || "Algo deu errado",
      });
    }
    return { user: data.user, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Falha no Login",
        description: error.message || "Algo deu errado",
      });
    }
    return { session: data.session, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const isSessionError = errorMessage.includes('session not found') || errorMessage.includes('Invalid Refresh Token');
        if (!isSessionError) {
            toast({
                variant: "destructive",
                title: "Falha ao Sair",
                description: errorMessage || "Algo deu errado",
            });
        }
    }
    // The onAuthStateChange listener will handle clearing state.
    return { error: null };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    supabase,
    refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
  }), [user, session, profile, loading, signUp, signIn, signOut, fetchProfile]);

  return <NewAuthContext.Provider value={value}>{children}</NewAuthContext.Provider>;
};

export const useNewAuth = () => {
  const context = useContext(NewAuthContext);
  if (context === undefined) {
    throw new Error('useNewAuth must be used within a NewAuthProvider');
  }
  return context;
};
