const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ACCESS_TOKEN_KEY = 'depannage_express_access';
const REFRESH_TOKEN_KEY = 'depannage_express_refresh';
const REQUEST_TIMEOUT_MS = 60000;

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY); // TODO: migrer vers httpOnly cookie en production
}

export function setAuthTokens({ access, refresh }) {
  if (access) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access); // TODO: migrer vers httpOnly cookie en production
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
}

export function clearAuthTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY); // TODO: migrer vers httpOnly cookie en production
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function pingBackend() {
  fetch(`${API_BASE_URL}/health/`).catch(() => {});
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
    const error = new Error(message);
    error.status = response.status;
    throw error;
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
      throw new Error("Le serveur est en cours de démarrage. Patientez 30 secondes puis réessayez.");
    }
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion internet.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function tryRefreshAndRetry(path, options) {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refresh) {
    clearAuthTokens();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  let refreshResponse;
  try {
    refreshResponse = await fetchWithTimeout(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    clearAuthTokens();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!refreshResponse.ok) {
    clearAuthTokens();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const tokens = await refreshResponse.json();
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access); // TODO: migrer vers httpOnly cookie en production
  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }

  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set('Authorization', `Bearer ${tokens.access}`);
  const retryResponse = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers: retryHeaders,
  });
  return parseResponse(retryResponse);
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
    return tryRefreshAndRetry(path, options);
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

export function createMechanicProfile(formData) {
  return apiRequest('/mechanics/profile/create/', {
    method: 'POST',
    body: formData,
  });
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

export function fetchAdminUsers(role) {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiRequest(`/auth/users/${query}`);
}

export function blockAdminUser(userId, reason = '') {
  return apiRequest(`/auth/users/${userId}/block/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

export function unblockAdminUser(userId) {
  return apiRequest(`/auth/users/${userId}/unblock/`, {
    method: 'POST',
  });
}

export function suspendAdminUser(userId) {
  return apiRequest(`/auth/users/${userId}/suspend/`, {
    method: 'POST',
  });
}

export function deleteAdminUser(userId) {
  return apiRequest(`/auth/users/${userId}/delete/`, {
    method: 'DELETE',
  });
}

export function fetchAdminBreakdowns(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/breakdowns/admin/${query}`);
}

export function fetchAdminMechanics(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/mechanics/admin/list/${query}`);
}

export function validateAdminMechanic(profileId, action, rejectionReason = '') {
  return apiRequest(`/mechanics/admin/${profileId}/validate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, rejection_reason: rejectionReason }),
  });
}

export function fetchSpecialties() {
  return apiRequest('/mechanics/specialties/');
}

export function adminCompleteAndApproveMechanic(userId, formData) {
  return apiRequest(`/mechanics/admin/complete-approve/${userId}/`, {
    method: 'POST',
    body: formData,
  });
}

export function fetchAdminMechanicProfileDetail(profileId) {
  return apiRequest(`/mechanics/admin/${profileId}/detail/`);
}

export function fetchMyInterventions(statusFilter) {
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  return apiRequest(`/interventions/my/${qs}`);
}

export function acceptIntervention(id) {
  return apiRequest(`/interventions/${id}/accept/`, { method: 'POST' });
}

export function startIntervention(id) {
  return apiRequest(`/interventions/${id}/start/`, { method: 'POST' });
}

export function completeIntervention(id) {
  return apiRequest(`/interventions/${id}/complete/`, { method: 'POST' });
}

export function refuseIntervention(id, reason = '') {
  return apiRequest(`/interventions/${id}/refuse/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}

export async function fetchBreakdownStatus(id, driverToken) {
  const qs = driverToken ? `?driver_token=${encodeURIComponent(driverToken)}` : '';
  const response = await fetchWithTimeout(`${API_BASE_URL}/breakdowns/status/${id}/${qs}`);
  return parseResponse(response);
}

export async function fetchBreakdownByPhone(phone) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/breakdowns/recover/?phone=${encodeURIComponent(phone)}`
  );
  return parseResponse(response);
}

export async function fetchPublicMechanics(query = '') {
  const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
  const response = await fetchWithTimeout(`${API_BASE_URL}/mechanics/public/${qs}`);
  return parseResponse(response);
}

export async function fetchPremiumMechanics() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/mechanics/public/?is_premium=true`);
  return parseResponse(response);
}

export async function fetchMechanicDetails(id) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/mechanics/profile/${id}/`);
  return parseResponse(response);
}

export async function fetchMechanicReviews(id) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/mechanics/profile/${id}/reviews/`);
  return parseResponse(response);
}

export async function postMechanicReview(id, { reviewer_name, rating, comment }) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/mechanics/profile/${id}/reviews/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer_name, rating, comment }),
  });
  return parseResponse(response);
}

export async function fetchPlatformStats() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/breakdowns/stats/`);
  return parseResponse(response);
}

export function fetchAdminStats() {
  return apiRequest('/breakdowns/admin/stats/');
}

export async function fetchMessages(breakdownRequestId) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/breakdowns/${breakdownRequestId}/messages/`);
  return parseResponse(response);
}

export function sendMessage(breakdownRequestId, payload) {
  return apiRequest(`/breakdowns/${breakdownRequestId}/messages/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Messagerie mécanicien ↔ admin
export function fetchMechanicAdminMessages(mechanicId) {
  const qs = mechanicId ? `?mechanic_id=${mechanicId}` : '';
  return apiRequest(`/mechanics/messages/admin/${qs}`);
}

export function sendMechanicAdminMessage(content, mechanicId) {
  const body = mechanicId
    ? { content, mechanic_id: mechanicId }
    : { content };
  return apiRequest('/mechanics/messages/admin/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function fetchMechanicAdminConversations() {
  return apiRequest('/mechanics/messages/admin/conversations/');
}

export async function submitReview(mechanicProfileId, payload) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/mechanics/profile/${mechanicProfileId}/reviews/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return parseResponse(response);
}

export async function createPayment(payload) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/payments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
}

export async function confirmPayment(paymentId, breakdownRequestId, driverToken) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/payments/${paymentId}/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ breakdown_request_id: breakdownRequestId, driver_token: driverToken }),
  });
  return parseResponse(response);
}

export function fetchAdminPayments(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return apiRequest(`/payments/admin/${qs ? '?' + qs : ''}`);
}

export function fetchAdminPaymentStats() {
  return apiRequest('/payments/admin/stats/');
}

export async function fetchInterventionForBreakdown(breakdownId) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/breakdowns/${breakdownId}/intervention/`);
  return parseResponse(response);
}

export async function driverConfirmIntervention(interventionId, driverToken) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/interventions/${interventionId}/driver-confirm/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_token: driverToken }),
    }
  );
  return parseResponse(response);
}

export async function submitReviewForIntervention(interventionId, payload) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/interventions/${interventionId}/review/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return parseResponse(response);
}

export function createSubscriptionPayment(payload) {
  return apiRequest('/payments/subscription/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function confirmSubscriptionPayment(paymentId) {
  return apiRequest(`/payments/subscription/${paymentId}/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export function fetchAdminReviews({ rating, mechanic } = {}) {
  const params = new URLSearchParams();
  if (rating) params.set('rating', rating);
  if (mechanic) params.set('mechanic', mechanic);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/mechanics/admin/reviews/${qs}`);
}

export function deleteAdminReview(reviewId) {
  return apiRequest(`/mechanics/admin/reviews/${reviewId}/`, { method: 'DELETE' });
}

export async function requestOTP(phone) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/otp/request/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return parseResponse(response);
}

export async function verifyOTP(phone, code) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/otp/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  return parseResponse(response);
}

export async function requestPhoneOtp(phone) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/otp/phone/request/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return parseResponse(response);
}

export async function verifyPhoneOtp(phone, code) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/otp/phone/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  return parseResponse(response);
}

export function adminCancelBreakdown(id) {
  return apiRequest(`/breakdowns/admin/${id}/cancel/`, { method: 'POST' });
}

export function fetchMechanicWallet() {
  return apiRequest('/payments/wallet/');
}

export function createWithdrawalRequest(payload) {
  return apiRequest('/payments/withdraw/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function fetchAdminWithdrawals(status = '') {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/payments/admin/withdrawals/${qs}`);
}

export function processWithdrawal(id, action, adminNote = '') {
  return apiRequest(`/payments/admin/withdrawals/${id}/process/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, admin_note: adminNote }),
  });
}

export function fetchMyMomoChangeRequests() {
  return apiRequest('/mechanics/momo-change/');
}

export function createMomoChangeRequest(newNumber) {
  return apiRequest('/mechanics/momo-change/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_number: newNumber }),
  });
}

export function fetchAdminMomoChanges(status = '') {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/mechanics/admin/momo-changes/${qs}`);
}

export function processAdminMomoChange(id, action, adminNote = '') {
  return apiRequest(`/mechanics/admin/momo-changes/${id}/process/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, admin_note: adminNote }),
  });
}

export function adminFixMechanicLocation(profileId, latitude, longitude) {
  return apiRequest(`/mechanics/admin/${profileId}/fix-location/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
}

export function updateMyMechanicLocation(latitude, longitude) {
  return apiRequest('/mechanics/profile/me/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
}

const _geoCache = new Map();

export async function reverseGeocode(lat, lon) {
  // TODO production: proxifier via GET /api/geolocation/reverse/
  // pour respecter la politique Nominatim
  if (!lat || !lon) return null;
  const key = `${lat},${lon}`;
  if (_geoCache.has(key)) return _geoCache.get(key);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=fr`,
      { headers: { 'User-Agent': 'DepannageExpress/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const city = a.city || a.town || a.village || a.county || '';
    const neighbourhood = a.neighbourhood || a.suburb || a.quarter || a.hamlet || '';
    const result = { city, neighbourhood };
    _geoCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

// ─── Incidents / Signalements (admin) ─────────────────────────────────────────

export function fetchAdminIncidents(params = {}) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return apiRequest(`/incidents/${q ? '?' + q : ''}`);
}

export function fetchAdminIncidentStats() {
  return apiRequest('/incidents/stats/');
}

export function resolveIncident(id) {
  return apiRequest(`/incidents/${id}/resolve/`, { method: 'PATCH' });
}

export function rejectIncident(id) {
  return apiRequest(`/incidents/${id}/reject/`, { method: 'PATCH' });
}

export function suspendIncident(id) {
  return apiRequest(`/incidents/${id}/suspend/`, { method: 'PATCH' });
}
