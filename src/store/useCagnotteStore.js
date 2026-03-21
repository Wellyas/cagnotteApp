import { useState, useCallback, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';

// ── Module-level cache so all mounted components share one fetch ──────────────
let _cagnotte = null;
let _participants = [];
let _loading = true;
let _error = null;
let _initialized = false;
let _listeners = [];

function notifyListeners() {
    _listeners.forEach((fn) => fn());
}

async function initialize() {
    if (_initialized) return;
    _initialized = true;
    try {
        _cagnotte = await dataService.getCagnotte();
        _participants = _cagnotte
            ? await dataService.getParticipants(_cagnotte.id)
            : [];
    } catch (e) {
        _error = e?.message ?? 'Erreur de chargement';
    } finally {
        _loading = false;
        notifyListeners();
    }
}

// Kick off immediately
initialize();

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useCagnotteStore() {
    const [, forceUpdate] = useState(0);
    const unsubRef = useRef(null);

    useEffect(() => {
        const handler = () => forceUpdate((n) => n + 1);
        _listeners.push(handler);
        unsubRef.current = () => {
            _listeners = _listeners.filter((l) => l !== handler);
        };
        return unsubRef.current;
    }, []);

    // ── Actions ─────────────────────────────────────────────────────────────────

    const createCagnotte = useCallback(async (cagnotteData) => {
        _loading = true;
        notifyListeners();
        try {
            _cagnotte = await dataService.createCagnotte(cagnotteData);
            _participants = [];
            _error = null;
        } catch (e) {
            _error = e?.message ?? 'Erreur lors de la création';
        } finally {
            _loading = false;
            notifyListeners();
        }
        return _cagnotte;
    }, []);

    const addParticipant = useCallback(async (name, amount, isAnonymous = false, hideAmount = false) => {
        if (!_cagnotte) return null;
        try {
            const p = await dataService.addParticipant(_cagnotte.id, name, amount, isAnonymous, hideAmount);
            _participants = [p, ..._participants];
            notifyListeners();
            return p;
        } catch (e) {
            _error = e?.message ?? 'Erreur lors de l\'ajout';
            notifyListeners();
            return null;
        }
    }, []);

    const validateParticipant = useCallback(async (id) => {
        // Optimistic update
        _participants = _participants.map((p) =>
            p.id === id ? { ...p, status: 'validated' } : p
        );
        notifyListeners();
        try {
            await dataService.validateParticipant(id);
        } catch (e) {
            // Rollback on error
            _participants = _participants.map((p) =>
                p.id === id ? { ...p, status: 'pending' } : p
            );
            _error = e?.message ?? 'Erreur de mise à jour';
            notifyListeners();
        }
    }, []);

    const invalidateParticipant = useCallback(async (id) => {
        _participants = _participants.map((p) =>
            p.id === id ? { ...p, status: 'pending' } : p
        );
        notifyListeners();
        try {
            await dataService.invalidateParticipant(id);
        } catch (e) {
            _participants = _participants.map((p) =>
                p.id === id ? { ...p, status: 'validated' } : p
            );
            _error = e?.message ?? 'Erreur de mise à jour';
            notifyListeners();
        }
    }, []);

    const deleteCagnotte = useCallback(async () => {
        const id = _cagnotte?.id;
        _loading = true;
        notifyListeners();
        try {
            if (id) await dataService.deleteCagnotte(id);
            _cagnotte = null;
            _participants = [];
            _error = null;
        } catch (e) {
            _error = e?.message ?? 'Erreur de suppression';
        } finally {
            _loading = false;
            notifyListeners();
        }
    }, []);

    const checkAdminPin = useCallback(async (pin) => {
        if (!_cagnotte) return false;
        try {
            return await dataService.checkAdminPin(_cagnotte.id, pin);
        } catch {
            return false;
        }
    }, []);

    const refreshParticipants = useCallback(async () => {
        if (!_cagnotte) return;
        try {
            _participants = await dataService.getParticipants(_cagnotte.id);
            notifyListeners();
        } catch (e) {
            _error = e?.message ?? 'Erreur de rechargement';
            notifyListeners();
        }
    }, []);

    // ── Computed ────────────────────────────────────────────────────────────────
    const validatedAmount = _participants
        .filter((p) => p.status === 'validated')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingAmount = _participants
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    const progress =
        _cagnotte?.target > 0
            ? Math.min((validatedAmount / _cagnotte.target) * 100, 100)
            : 0;

    return {
        cagnotte: _cagnotte,
        participants: _participants,
        loading: _loading,
        error: _error,
        validatedAmount,
        pendingAmount,
        progress,
        createCagnotte,
        addParticipant,
        validateParticipant,
        invalidateParticipant,
        deleteCagnotte,
        checkAdminPin,
        refreshParticipants,
    };
}
