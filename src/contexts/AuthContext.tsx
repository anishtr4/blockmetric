import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { RootState } from '../store/store';
import { login as loginAction, register as registerAction, logout as logoutAction, verifyToken } from '../store/slices/authSlice';

// Configure axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const verifyUserToken = async () => {
      if (token) {
        try {
          await dispatch(verifyToken(token));
        } catch (error) {
          dispatch(logoutAction());
        }
      }
    };
    verifyUserToken();
  }, [dispatch, token]);

  const login = async (email: string, password: string) => {
    await dispatch(loginAction({ email, password }));
  };

  const register = async (email: string, password: string, name: string) => {
    await dispatch(registerAction({ email, password, name }));
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};