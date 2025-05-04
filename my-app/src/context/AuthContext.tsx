import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User, AuthError, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Define Profile type based on your DB schema
interface UserProfile {
  id: string;
  venue_id: string | null;
  role: 'admin' | 'manager' | 'bartender'; // Match your CHECK constraint
  full_name: string | null;
  updated_at: string;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(); // Expect only one profile per user ID

      if (error) {
        console.error('Error fetching profile:', error.message);
        // Maybe sign out if profile doesn't exist?
        await supabase.auth.signOut();
        return null;
      }
      return data as UserProfile;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  };

  useEffect(() => {
    const setupAuth = async () => {
      setLoading(true);
      // Fetch initial session
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error fetching initial session:', sessionError.message);
      } else if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        // Fetch profile for the existing session user
        const profile = await fetchUserProfile(initialSession.user.id);
        setUserProfile(profile);
      }
      setLoading(false);

      // Set up auth state listener
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          setLoading(true);
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          
          // Fetch profile only if there is a user
          let profile: UserProfile | null = null;
          if (currentUser) {
            profile = await fetchUserProfile(currentUser.id);
          }
          setUserProfile(profile);
          setLoading(false);
        }
      );

      // Cleanup function
      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
    
    setupAuth();

  }, []);

  // Sign in with email and password
  const signInWithPassword = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    setLoading(true);
    const response = await supabase.auth.signInWithPassword(credentials);
    // Profile fetching is handled by onAuthStateChange listener
    setLoading(false);
    return response;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
    // State updates (session, user, profile to null) handled by onAuthStateChange
    setLoading(false);
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    signInWithPassword,
    signOut,
  };

  // Don't render children until initial auth check + profile fetch is complete
  if (loading && !session) { 
     return <div className="flex justify-center items-center h-screen">Initializing...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 