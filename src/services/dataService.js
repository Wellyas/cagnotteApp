/**
 * Hybrid Data Service
 * -------------------
 * Automatically uses Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
 * are set, otherwise falls back to localStorage (dev / demo mode).
 */
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (only created when env vars are present) ────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

let supabase = null;
if (USE_SUPABASE) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ─── LocalStorage service ─────────────────────────────────────────────────────
const STORAGE_KEY = 'cagnotte_data';
const defaultData = { cagnotte: null, participants: [] };

function lsLoad() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { ...defaultData };
    } catch {
        return { ...defaultData };
    }
}

function lsSave(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore localStorage errors */ }
}

const localService = {
    async getCagnotte() {
        return lsLoad().cagnotte;
    },
    async getParticipants() {
        return lsLoad().participants;
    },
    async createCagnotte(data) {
        const cagnotte = { ...data, id: `c_${Date.now()}`, createdAt: Date.now() };
        lsSave({ ...lsLoad(), cagnotte });
        return cagnotte;
    },
    async addParticipant(cagnotteId, name, amount) {
        const participant = {
            id: `p_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            cagnotte_id: cagnotteId,
            name,
            amount: parseFloat(amount),
            status: 'pending',
            date: Date.now(),
            created_at: new Date().toISOString(),
        };
        const current = lsLoad();
        lsSave({ ...current, participants: [...current.participants, participant] });
        return participant;
    },
    async validateParticipant(id) {
        const current = lsLoad();
        lsSave({
            ...current,
            participants: current.participants.map((p) =>
                p.id === id ? { ...p, status: 'validated' } : p
            ),
        });
    },
    async invalidateParticipant(id) {
        const current = lsLoad();
        lsSave({
            ...current,
            participants: current.participants.map((p) =>
                p.id === id ? { ...p, status: 'pending' } : p
            ),
        });
    },
    async deleteCagnotte() {
        lsSave({ ...defaultData });
    },
    /** Validate admin PIN locally (dev mode) */
    async checkAdminPin(cagnotteId, pin) {
        const cagnotte = lsLoad().cagnotte;
        return cagnotte?.adminPin === pin;
    },
};

// ─── Supabase service ─────────────────────────────────────────────────────────
const supabaseService = {
    async getCagnotte() {
        const { data, error } = await supabase
            .from('cagnottes')
            // admin_pin is intentionally omitted for security
            .select('id, title, description, photo, target, phone, created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        return data ?? null;
    },
    async getParticipants(cagnotteId) {
        if (!cagnotteId) return [];
        const { data, error } = await supabase
            .from('participations')
            .select('*')
            .eq('cagnotte_id', cagnotteId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },
    async createCagnotte(cagnotteData) {
        const { data, error } = await supabase
            .from('cagnottes')
            .insert({
                title: cagnotteData.title,
                description: cagnotteData.description,
                photo: cagnotteData.photo,
                target: parseFloat(cagnotteData.target),
                phone: cagnotteData.phone,
                admin_pin: cagnotteData.adminPin,
            })
            .select('id, title, description, photo, target, phone, created_at')
            .single();
        if (error) throw error;
        return data;
    },
    async addParticipant(cagnotteId, name, amount) {
        const { data, error } = await supabase
            .from('participations')
            .insert({ cagnotte_id: cagnotteId, name, amount: parseFloat(amount) })
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async validateParticipant(id) {
        const { error } = await supabase
            .from('participations')
            .update({ status: 'validated' })
            .eq('id', id);
        if (error) throw error;
    },
    async invalidateParticipant(id) {
        const { error } = await supabase
            .from('participations')
            .update({ status: 'pending' })
            .eq('id', id);
        if (error) throw error;
    },
    async deleteCagnotte(id) {
        // CASCADE will delete participations automatically
        const { error } = await supabase.from('cagnottes').delete().eq('id', id);
        if (error) throw error;
    },
    /** Validate admin PIN via secure Postgres RPC (pin never returned to client) */
    async checkAdminPin(cagnotteId, pin) {
        const { data, error } = await supabase.rpc('check_admin_pin', {
            cagnotte_id: cagnotteId,
            pin,
        });
        if (error) throw error;
        return data === true;
    },
};

// ─── Export the right service ─────────────────────────────────────────────────
export const dataService = USE_SUPABASE ? supabaseService : localService;
