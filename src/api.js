// ──────────────────────────────────────────────────────────────
// API client — gestiona token JWT y todas las llamadas al backend
// ──────────────────────────────────────────────────────────────

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001/api'
  : '/api';
const TOKEN_KEY = 'clubpoli_token';

const api = {
  // ── Token ──────────────────────────────────────────────────
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  setToken(t) { localStorage.setItem(TOKEN_KEY, t); },
  clearToken() { localStorage.removeItem(TOKEN_KEY); },

  // ── Fetch base ─────────────────────────────────────────────
  async request(path, options = {}) {
    const token = this.getToken();
    const res = await fetch(API_BASE + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.error || 'Error del servidor'), { status: res.status, data });
    return data;
  },

  get(path)           { return this.request(path); },
  post(path, body)    { return this.request(path, { method: 'POST',   body: JSON.stringify(body) }); },
  put(path, body)     { return this.request(path, { method: 'PUT',    body: JSON.stringify(body) }); },
  delete(path)        { return this.request(path, { method: 'DELETE' }); },

  // ── Auth ───────────────────────────────────────────────────
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    this.setToken(data.token);
    return data.user;
  },

  async requestMagicLink(email) {
    return this.post('/auth/magic-link', { email });
  },

  async validateMagicToken(token) {
    const data = await this.get(`/auth/magic-link/${token}`);
    this.setToken(data.token);
    return data.user;
  },

  async me() {
    return this.get('/auth/me');
  },

  logout() {
    this.clearToken();
  },

  // ── Talleres ───────────────────────────────────────────────
  getWorkshops()      { return this.get('/workshops'); },
  getWorkshop(id)     { return this.get(`/workshops/${id}`); },
  enrollParticipant(workshopId, participante_id) {
    return this.post(`/workshops/${workshopId}/enroll`, { participante_id });
  },

  // ── Asistencia ─────────────────────────────────────────────
  getAttendance(workshopId, fecha) {
    const q = fecha ? `?fecha=${fecha}` : '';
    return this.get(`/attendance/${workshopId}${q}`);
  },
  saveAttendance(workshopId, fecha, attendance) {
    return this.post('/attendance', { workshopId, fecha, attendance });
  },
  getAttendanceHistory(workshopId) {
    return this.get(`/attendance/${workshopId}/history`);
  },
  getParticipantAttendance(workshopId) {
    return this.get(`/attendance/${workshopId}/participants`);
  },

  // ── Participantes ──────────────────────────────────────────
  getParticipants(workshopId) {
    return this.get(`/participants?workshopId=${workshopId}`);
  },
  searchParticipants(q) {
    return this.get(`/participants?q=${encodeURIComponent(q)}`);
  },
  getAvailableParticipants(workshopId) {
    return this.get(`/participants/available?workshopId=${workshopId}`);
  },
  createParticipant(data) {
    return this.post('/participants', data);
  },

  // ── Admin ──────────────────────────────────────────────────
  // Profesores
  getProfessors()          { return this.get('/admin/professors'); },
  createProfessor(data)    { return this.post('/admin/professors', data); },
  updateProfessor(id, d)   { return this.put(`/admin/professors/${id}`, d); },
  deleteProfessor(id)      { return this.delete(`/admin/professors/${id}`); },
  generateMagicLink(id, opts) { return this.post(`/admin/professors/${id}/magic-link`, opts || {}); },
  sendMagicLinkEmail(id)   { return this.post(`/admin/professors/${id}/magic-link/email`, {}); },
  revokeMagicLink(id)      { return this.delete(`/admin/professors/${id}/magic-link`); },

  // Admin Talleres
  adminGetWorkshops()                    { return this.get('/admin/workshops'); },
  adminCreateWorkshop(data)              { return this.post('/admin/workshops', data); },
  adminUpdateWorkshop(id, data)          { return this.put(`/admin/workshops/${id}`, data); },
  adminDeleteWorkshop(id)                { return this.delete(`/admin/workshops/${id}`); },
  adminGetTallerInscriptions(id)         { return this.get(`/admin/workshops/${id}/inscriptions`); },
  adminCreateTallerInscription(id, data) { return this.post(`/admin/workshops/${id}/inscriptions`, data); },
  adminDeleteTallerInscription(tid, iid) { return this.delete(`/admin/workshops/${tid}/inscriptions/${iid}`); },
  adminGetTallerAvailable(id)            { return this.get(`/admin/workshops/${id}/available`); },
  adminGetTallerPayments(id)             { return this.get(`/admin/workshops/${id}/payments`); },

  // Pagos por taller (profesor)
  getWorkshopPayments(id)               { return this.get(`/workshops/${id}/payments`); },

  // Admin Participantes (socios)
  getParticipant(id)       { return this.get(`/participants/${id}`); },
  updateParticipant(id, d) { return this.put(`/participants/${id}`, d); },
  deleteParticipant(id)    { return this.delete(`/participants/${id}`); },

  // Inscripciones
  getInscriptions(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get('/admin/inscriptions' + (q ? `?${q}` : ''));
  },
  getPendingInscriptions()        { return this.get('/admin/inscriptions?estado=pendiente'); },
  createInscription(data)         { return this.post('/admin/inscriptions', data); },
  updateInscription(id, data)     { return this.put(`/admin/inscriptions/${id}`, data); },
  approveInscription(id)          { return this.put(`/admin/inscriptions/${id}/approve`, {}); },
  rejectInscription(id)           { return this.put(`/admin/inscriptions/${id}/reject`, {}); },
  deleteInscription(id)           { return this.delete(`/admin/inscriptions/${id}`); },

  // Pagos
  getPayments(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get('/admin/payments' + (q ? `?${q}` : ''));
  },
  registerPayment(data)       { return this.post('/admin/payments', data); },
  getMonthlyPayments(periodo) { return this.get(`/admin/payments/monthly${periodo ? `?periodo=${periodo}` : ''}`); },
  updatePayment(id, data)     { return this.put(`/admin/payments/${id}`, data); },

  // Reportes
  getDashboardReport() { return this.get('/admin/reports/dashboard'); },
  getAttendanceReport(){ return this.get('/admin/reports/attendance'); },
  getRevenueReport(months) {
    return this.get(`/admin/reports/revenue${months ? `?months=${months}` : ''}`);
  },

  // Empresa
  getCompany()        { return this.get('/admin/company'); },
  updateCompany(data) { return this.put('/admin/company', data); },
  updateSede(id, d)   { return this.put(`/admin/company/sedes/${id}`, d); },
};

// Verificar magic link en URL hash al cargar
(function checkMagicHash() {
  const hash = window.location.hash;
  const match = hash.match(/magic=([^&]+)/);
  if (match) {
    api.setToken(match[1]);
    window.history.replaceState(null, '', window.location.pathname);
  }
})();

Object.assign(window, { api });
