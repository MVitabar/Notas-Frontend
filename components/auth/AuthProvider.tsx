// components/auth/AuthProvider.tsx
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export type User = {
  _id?: string
  id?: string
  nombre: string
  email: string
  rol: Uppercase<"ADMIN" | "DOCENTE"> | Lowercase<"admin" | "docente">
  activo: boolean
  requiresPasswordChange?: boolean
  [key: string]: any
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    error?: string;
    user?: User;
    token?: string;
    requiresPasswordChange?: boolean;
  }>
  logout: () => void
  loading: boolean
  refreshUser: () => Promise<void>
  updateSession: (userData?: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => ({ success: false, error: 'No implementado' }),
  logout: () => {},
  loading: true,
  refreshUser: async () => {},
  updateSession: async () => {},
})

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 horas

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Actualizar la sesión con nuevos datos del usuario
  const updateSession = async (userData?: Partial<User>) => {
    if (userData && user) {
      setUser({ ...user, ...userData })
      // Actualizar localStorage si es necesario
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        localStorage.setItem("user", JSON.stringify({ ...parsedUser, ...userData }))
      }
    }
  }

  // Verificar la sesión al cargar
  useEffect(() => {
    const verifySession = async () => {
      try {
        setLoading(true);
        
        // Skip verification if we're on the login page
        if (window.location.pathname === '/login' || window.location.pathname === '/change-password') {
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const expiresAt = localStorage.getItem("expiresAt");

        // If no token or user data, redirect to login
        if (!storedToken || !storedUser) {
          console.log('No token or user data found, redirecting to login');
          router.push('/login');
          setLoading(false);
          return;
        }

        // Check if session is expired
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          console.log('Session expired, logging out');
          logout();
          setLoading(false);
          return;
        }

        try {
          // Verify token with backend
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          if (!response.data) {
            throw new Error('No data received from auth/me');
          }

          const data = response.data;
          console.log('Auth/me response:', data);

          // Normalize user data
          const userData: User = {
            id: data.data?.id || data.id || data.data?._id || data._id || '',
            _id: data.data?.id || data.id || data.data?._id || data._id || '',
            nombre: data.data?.nombre || data.nombre || data.data?.name || data.name || '',
            email: data.data?.email || data.email || '',
            rol: (data.data?.rol || data.rol || 'DOCENTE').toUpperCase() as 'ADMIN' | 'DOCENTE',
            activo: data.data?.activo !== false && data.activo !== false,
            requiresPasswordChange: data.data?.requiresPasswordChange || data.requiresPasswordChange || false,
          };

          console.log('Processed user data:', userData);

          // Update state and localStorage
          setUser(userData);
          setToken(storedToken);
          
          if (typeof window !== 'undefined') {
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("expiresAt", (Date.now() + SESSION_DURATION_MS).toString());
          }

          // Handle redirection based on role
          const currentPath = window.location.pathname;
          console.log('Current path:', currentPath, 'User role:', userData.rol);

          // If password change required (first-time login)
          if (userData.requiresPasswordChange) {
            if (currentPath !== '/change-password') {
              console.log('Password change required, redirecting to change-password');
              // Store the intended destination before redirecting
              const redirectPath = userData.rol === 'ADMIN' ? '/admin' : '/dashboard';
              localStorage.setItem('redirectAfterPasswordChange', redirectPath);
              router.push('/change-password');
              return;
            }
            return;
          }

          // Handle admin routes
          if (userData.rol === 'ADMIN') {
            if (!currentPath.startsWith('/admin') && currentPath !== '/') {
              console.log('Admin user, redirecting to /admin');
              router.push('/admin');
            }
            return;
          }

          // Handle teacher routes
          if (userData.rol === 'DOCENTE') {
            if (!currentPath.startsWith('/dashboard') && currentPath !== '/') {
              console.log('Teacher user, redirecting to /dashboard');
              router.push('/dashboard');
            }
            return;
          }

        } catch (error) {
          console.error('Error verifying session:', error);
          // Only logout if we're not already on the login page
          if (window.location.pathname !== '/login') {
            logout();
          }
        }
      } catch (error) {
        console.error('Unexpected error in verifySession:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [router]);

  const login = async (email: string, password: string): Promise<{ 
    success: boolean; 
    error?: string;
    user?: User;
    token?: string;
    requiresPasswordChange?: boolean;
  }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        return { 
          success: false, 
          error: data.message || `Error de autenticación (${response.status})`
        };
      }

      // Obtener el token de la respuesta
      const authToken = data.access_token || data.token || data.data?.token;
      if (!authToken) {
        console.error('No se recibió token en la respuesta:', data);
        return { 
          success: false, 
          error: "Error en la autenticación: token no recibido" 
        };
      }
      
      console.log('Token recibido:', authToken);

      // Obtener los datos del usuario
      let userData: User;
      
      // Si la respuesta ya incluye los datos del usuario, usarlos
      if (data.user) {
        userData = {
          id: data.user.id || data.user._id || '',
          _id: data.user.id || data.user._id || '',
          nombre: data.user.nombre || data.user.name || '',
          email: data.user.email || '',
          rol: (data.user.rol || 'DOCENTE').toUpperCase() as 'ADMIN' | 'DOCENTE',
          activo: data.user.activo !== false,
          requiresPasswordChange: data.user.requiresPasswordChange || false,
        };
      } else {
        // Si no, hacer una solicitud para obtener los datos del usuario
        try {
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/json',
            },
            credentials: 'include',
          });
          
          if (!userResponse.ok) {
            throw new Error('Error al obtener los datos del usuario');
          }
          
          const userInfo = await userResponse.json();
          userData = {
            id: userInfo.id || userInfo._id || '',
            _id: userInfo.id || userInfo._id || '',
            nombre: userInfo.nombre || userInfo.name || '',
            email: userInfo.email || '',
            rol: (userInfo.rol || 'DOCENTE').toUpperCase() as 'ADMIN' | 'DOCENTE',
            activo: userInfo.activo !== false,
            requiresPasswordChange: userInfo.requiresPasswordChange || false,
          };
        } catch (error) {
          console.error('Error al obtener los datos del usuario:', error);
          return {
            success: false,
            error: 'Error al obtener los datos del usuario. Por favor, recarga la página.'
          };
        }
      }
      
      console.log('Datos del usuario normalizados:', userData);

      // Guardar en el estado
      setUser(userData);
      setToken(authToken);
      
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("expiresAt", (Date.now() + SESSION_DURATION_MS).toString());
        console.log('Datos guardados en localStorage');
      }

      // Manejar redirección basada en el rol
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      
      if (userData.requiresPasswordChange) {
        if (currentPath !== '/change-password' && typeof window !== 'undefined') {
          router.push('/change-password');
        }
        return { 
          success: true, 
          user: userData,
          token: authToken,
          requiresPasswordChange: true
        };
      }

      // Redirigir según el rol
      if (userData.rol === 'ADMIN' && !currentPath.startsWith('/admin')) {
        router.push("/admin");
      } else if (userData.rol === 'DOCENTE' && currentPath !== '/dashboard') {
        router.push("/dashboard");
      }

      return { 
        success: true, 
        user: userData,
        token: authToken 
      };
    } catch (error) {
      console.error("Login error:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Error de conexión" 
      }
    }
  }

  const logout = () => {
    console.log('Logging out...');
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
    }
    
    // Only redirect if we're not already on the login page
    if (window.location.pathname !== '/login') {
      console.log('Redirecting to login');
      router.push('/login');
    }
  }

  const refreshUser = async () => {
    if (!token) return
    
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data) {
        setUser(response.data)
        localStorage.setItem('user', JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Error actualizando datos de usuario:', error)
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      loading,
      refreshUser,
      updateSession, 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)