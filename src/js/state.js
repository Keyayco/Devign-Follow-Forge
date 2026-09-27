import { api, supabase } from "./api.js";

export const state = {
  session: null,
  user: null,
  businesses: [],
  business: null,
  data: {
    dashboard: null,
    customers: [],
    leads: [],
    quotes: [],
    followUps: [],
    jobs: [],
    payments: [],
    templates: [],
  },
};

export async function initSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  state.user = data.session?.user || null;
  return state.session;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  state.session = data.session;
  state.user = data.user;
}

export async function signUp(email, password) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  state.session = data.session;
  state.user = data.user;
}

export async function resetPassword(email) {
  if (!supabase) throw new Error("Supabase environment variables are missing.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
  if (error) throw error;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  state.session = null;
  state.user = null;
  state.businesses = [];
  state.business = null;
}

export async function loadBusinesses() {
  const businesses = await api.get("/api/businesses");
  state.businesses = businesses;
  const saved = localStorage.getItem("active_business_id");
  state.business = businesses.find(b => b.id === saved) || businesses[0] || null;
  if (state.business) localStorage.setItem("active_business_id", state.business.id);
  return businesses;
}

export async function setBusiness(id) {
  state.business = state.businesses.find(b => b.id === id) || null;
  if (state.business) localStorage.setItem("active_business_id", state.business.id);
}

export async function loadAll() {
  if (!state.business) return;
  const id = state.business.id;
  const [dashboard, customers, leads, quotes, followUps, jobs, payments, templates] = await Promise.all([
    api.get(`/api/dashboard?business_id=${id}`),
    api.get(`/api/customers?business_id=${id}`),
    api.get(`/api/leads?business_id=${id}`),
    api.get(`/api/quotes?business_id=${id}`),
    api.get(`/api/follow-ups?business_id=${id}`),
    api.get(`/api/jobs?business_id=${id}`),
    api.get(`/api/payments?business_id=${id}`),
    api.get(`/api/message-templates?business_id=${id}`),
  ]);
  state.data = { dashboard, customers, leads, quotes, followUps, jobs, payments, templates };
}
