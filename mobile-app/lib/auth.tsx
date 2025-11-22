import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { API_URL } from './constants';

// AsyncStorage will be installed when needed: npm install @react-native-async-storage/async-storage
// For now, using a simple in-memory storage
let memoryStorage: { [key: string]: string | null } = {};

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStorage[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];
  },
};

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
      // For now, this is a placeholder - actual implementation will need Cognito
      // This should integrate with AWS Cognito for authentication
      // For initial implementation, we'll use a simple token-based approach
      
      // TODO: Replace with actual Cognito authentication
      // For now, return an error indicating auth is not yet implemented
      throw new Error('Authentication not yet implemented. Please use the web app to login.');
      
      // Once Cognito is integrated:
      // 1. Authenticate with Cognito
      // 2. Get tokens (idToken, accessToken)
      // 3. Call backend /api/users/upsert-on-login
      // 4. Store token and user info
      // 5. Update state
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
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

