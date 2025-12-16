// lib/api.ts
import axios, { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  [key: string]: any;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Asegúrate de que esta URL sea correcta
  timeout: 10000, // 10 segundos de timeout
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
    console.log('Ruta pública, omitiendo verificación de token');
    return config;
  }
  
  console.log('Verificando autenticación para:', config.url);
  
  // Obtener el token de localStorage
  const token = localStorage.getItem('token');
  console.log('Token en localStorage:', token ? 'Encontrado' : 'No encontrado');
  
  // Verificar si el token existe
  if (!token) {
    console.error('No se encontró token de autenticación');
    redirectToLogin();
    return Promise.reject(new Error('No autenticado'));
  }
  
  // Verificar si el token está vencido
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationDate = new Date(payload.exp * 1000);
    const isExpired = payload.exp * 1000 < Date.now();
    
    console.log('Información del token JWT:', {
      usuario: payload.email || payload.sub || 'No identificado',
      expira: expirationDate.toLocaleString(),
      expirado: isExpired ? 'SÍ' : 'NO',
      tiempoRestante: isExpired 
        ? 'Expirado' 
        : `${Math.round((payload.exp * 1000 - Date.now()) / 1000 / 60)} minutos`
    });
    
    if (isExpired) {
      console.error('El token ha expirado');
      redirectToLogin();
      return Promise.reject(new Error('La sesión ha expirado'));
    }
    
    // Agregar el token a los headers
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token añadido a la solicitud:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        withCredentials: config.withCredentials
      });
    }
    
  } catch (error) {
    console.error('Error al verificar el token:', error);
    redirectToLogin();
    return Promise.reject(new Error('Error en la autenticación'));
  }
  
  return config;
}, (error) => {
  console.error('Error en el interceptor de solicitud:', error);
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
    // Registrar respuesta exitosa
    console.log('Respuesta exitosa:', {
      url: response.config.url,
      status: response.status,
      headers: response.headers,
      data: response.data
    });
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
      
      console.error('Error en la respuesta del servidor:', {
        url: error.config?.url,
        status: error.response.status,
        message: errorMsg,
        data: errorData
      });
      
      // Manejar específicamente el error 401 (No autorizado)
      if (error.response.status === 401) {
        console.error('Error de autenticación 401. Detalles:', {
          url: error.config?.url,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
          requestHeaders: error.config?.headers
        });
        console.error('Redirigiendo a login...');
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
      console.error('No se recibió respuesta del servidor:', error.request);
      return Promise.reject({
        message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.',
        isNetworkError: true,
        originalError: error
      });
    }
    
    // Algo más causó el error
    console.error('Error en la solicitud:', error);
    return Promise.reject({
      message: error.message || 'Error desconocido al procesar la solicitud',
      originalError: error
    });
  }
);

export { api, type ErrorResponse };