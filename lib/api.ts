// lib/api.ts
import axios, { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  [key: string]: any;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Asegúrate de que esta URL sea correcta
  timeout: 15000, // 15 segundos de timeout (aumentado para manejar lentitud)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Importante para enviar cookies
});

// Interceptor para manejar el token de autenticación
api.interceptors.request.use((config) => {
  // Solo ejecutar en el cliente
  if (typeof window === 'undefined') return config;
  
  // No requerir token para rutas públicas
  const publicRoutes = ['/auth/login', '/auth/register'];
  if (config.url && publicRoutes.some(route => config.url?.includes(route))) {
    return config;
  }
  
  // Obtener el token de localStorage
  const token = localStorage.getItem('token');
  
  // Verificar si el token existe
  if (!token) {
    redirectToLogin();
    return Promise.reject(new Error('No autenticado'));
  }
  
  // Verificar si el token está vencido (solo verificar expiración, no logs detallados)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    
    if (isExpired) {
      redirectToLogin();
      return Promise.reject(new Error('La sesión ha expirado'));
    }
    
    // Agregar el token a los headers
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
  } catch (error) {
    console.error('Error al verificar el token:', error);
    redirectToLogin();
    return Promise.reject(new Error('Error en la autenticación'));
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Función para redirigir al login
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    // Evitar redirección múltiple
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?session_expired=true';
    }
  }
}

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    if (error.response) {
      // El servidor respondió con un código de error
      const errorData = error.response.data || {};
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : errorData.message || 'Error en la solicitud';
      
      const errorMsg = error.response.data?.message || 
                      error.response.data?.error || 
                      `Error en la solicitud (${error.response.status})`;
      
      // Manejar específicamente el error 401 (No autorizado)
      if (error.response.status === 401) {
        redirectToLogin();
      }
      
      return Promise.reject({
        message: errorMsg,
        response: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        config: error.config
      });
      
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      return Promise.reject({
        message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.',
        isNetworkError: true,
        originalError: error
      });
    }
    
    // Algo más causó el error
    return Promise.reject({
      message: error.message || 'Error desconocido al procesar la solicitud',
      originalError: error
    });
  }
);

export { api, type ErrorResponse };