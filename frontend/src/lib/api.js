const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ACCESS_TOKEN_KEY = 'depannage_express_access';
const REFRESH_TOKEN_KEY = 'depannage_express_refresh';
const REQUEST_TIMEOUT_MS = 15000;

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAuthTokens({ access, refresh }) {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const normalizeErrorMessage = () => {
      if (typeof data === 'string') {
        return data;
      }
      if (data?.errors) {
        return JSON.stringify(data.errors);
      }
      if (data?.error || data?.detail) {
        return data.error || data.detail;
      }
      if (data && typeof data === 'object') {
        return Object.entries(data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join(' | ');
      }
      return 'Une erreur est survenue.';
    };

    const message = normalizeErrorMessage();
    throw new Error(message);
  }

  return data;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Le serveur met trop de temps a repondre. Verifie que le backend est bien lance.");
    }
    throw new Error("Impossible de joindre le serveur. Verifie l'URL API et le backend.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthTokens();
  }

  return parseResponse(response);
}

export async function registerMechanic(payload) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function loginMechanic(payload) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function createBreakdownRequest(formData) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/breakdowns/request/`, {
    method: 'POST',
    body: formData,
  });

  return parseResponse(response);
}

export function fetchCurrentUser() {
  return apiRequest('/auth/profile/');
}

export function fetchMechanicRequests() {
  return apiRequest('/breakdowns/my-requests/');
}

export function fetchMechanicProfile() {
  return apiRequest('/mechanics/profile/me/');
}

export function logoutMechanic() {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  return apiRequest('/auth/logout/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
}
