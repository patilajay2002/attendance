import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { AxiosError as AxiosErrorType } from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user data
      axios.get<User>('/api/user/')
        .then((response) => {
          setUser(response.data);
        })
        .catch((error: unknown) => {
          const axiosError = error as AxiosError;
          if (axiosError.response) {
            console.error('Error fetching user:', axiosError.response.data || axiosError.message);
            if (axiosError.response.status === 401) {
              // Token is invalid or expired
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              delete axios.defaults.headers.common['Authorization'];
            }
          } else if (error instanceof Error) {
            console.error('Error fetching user:', error.message);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post<{ access: string; refresh: string }>('/api/token/', {
        username,
        password,
      });
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Fetch user data
      const userResponse = await axios.get<User>('/api/user/');
      setUser(userResponse.data);
      return true;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Login error:', axiosError.response.data || axiosError.message);
        if (axiosError.response.status === 401) {
          // Invalid credentials
          return false;
        }
      } else if (error instanceof Error) {
        console.error('Login error:', error.message);
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 