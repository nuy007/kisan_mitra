import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, mockProfiles, shouldUseMockData } from '../lib/supabase';
import type { AuthSession, Profile } from '../types/database';

interface AuthContextType {
  session: AuthSession;
  loading: boolean;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockSession: AuthSession = {
  user: {
    id: 'c9c15010-88a0-4b6d-8a90-2c7b3f85c155',
    email: 'demo@example.com'
  },
  error: null
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>(mockSession);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [useMockData, setUseMockData] = useState(shouldUseMockData());

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession({ user: session.user, error: null });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession({ user: session.user, error: null });
      } else {
        setSession({ user: null, error: null });
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  async function createProfile(userId: string, fullName: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        setSession({ user: data.user, error: null });
      }
    } catch (error) {
      throw error;
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned after signup');

      const profile = await createProfile(authData.user.id, fullName);
      setSession({ user: authData.user, error: null });
      setProfile(profile);
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession({ user: null, error: null });
      setProfile(null);
    } catch (error) {
      throw error;
    }
  }

  async function fetchProfile() {
    try {
      if (!session?.user?.id) return;

      if (useMockData) {
        setProfile(mockProfiles[session.user.id] || null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const newProfile = await createProfile(session.user.id, '');
          setProfile(newProfile);
          return;
        }
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      if (useMockData) {
        setProfile(mockProfiles[session.user.id] || null);
      } else {
        throw error;
      }
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      if (!session?.user?.id) throw new Error('No user logged in');

      if (useMockData) {
        const updatedProfile = {
          ...profile,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        setProfile(updatedProfile as Profile);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      // Immediately update the local profile state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      profile,
      signIn, 
      signUp, 
      signOut,
      updateProfile,
      fetchProfile
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