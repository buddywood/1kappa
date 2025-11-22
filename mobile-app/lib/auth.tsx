import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { API_URL } from './constants';

// Use actual AsyncStorage package
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id?: number;
  email?: string;
  role?: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER' | 'STEWARD';
  memberId?: number | null;
  sellerId?: number | null;
  promoterId?: number | null;
  stewardId?: number | null;
  is_fraternity_member?: boolean;
  is_seller?: boolean;
  is_promoter?: boolean;
  is_steward?: boolean;
  name?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@1kappa:token';
const USER_KEY = '@1kappa:user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession();
  }, []);

  const getSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error getting session:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Import Cognito service
      let cognitoModule;
      try {
        cognitoModule = await import('./cognito');
      } catch (importError: any) {
        console.error('Failed to import Cognito module:', importError);
        throw new Error('Cognito authentication not available. Please ensure amazon-cognito-identity-js is properly installed and configured.');
      }
      
      if (!cognitoModule || !cognitoModule.signIn) {
        throw new Error('Cognito signIn function not available. Please check your Cognito configuration.');
      }
      
      const { signIn } = cognitoModule;
      
      // Authenticate with Cognito directly
      const { tokens, user } = await signIn(email, password);
      
      // Store tokens and user info
      await AsyncStorage.setItem(TOKEN_KEY, tokens.idToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify({
        ...user,
        is_fraternity_member: !!user.memberId,
        is_seller: !!user.sellerId,
        is_promoter: !!user.promoterId,
        is_steward: !!user.stewardId,
      }));
      
      // Update state
      setToken(tokens.idToken);
      setUser({
        ...user,
        is_fraternity_member: !!user.memberId,
        is_seller: !!user.sellerId,
        is_promoter: !!user.promoterId,
        is_steward: !!user.stewardId,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      // If Cognito service is not available, fall back to error message
      if (error.message?.includes('not yet implemented') || error.message?.includes('Failed to fetch')) {
        throw new Error('Authentication not yet implemented. Please use the web app to login.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Cognito if user email exists
      if (user?.email) {
        try {
          const { signOut } = await import('./cognito');
          await signOut(user.email);
        } catch (error) {
          // Continue with local logout even if Cognito signout fails
          console.debug('Cognito signout error (continuing with local logout):', error);
        }
      }
      
      // Clear local storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!token,
    isLoading,
    isGuest: !user && !isLoading,
    token,
    login,
    logout,
    getSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

