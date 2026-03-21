import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Shield, CheckCircle, Clock, ArrowLeft, Trash2, RefreshCw, Database, Wifi, Edit2, Save, X
} from 'lucide-react';
import { useCagnotteStore } from '../store/useCagnotteStore';
import { USE_SUPABASE } from '../services/dataService';
import { isSafeUrl } from '../utils/security';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

function formatAmount(n) {
    return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        cagnotte, participants, validatedAmount, pendingAmount, progress,
        validateParticipant, invalidateParticipant, deleteCagnotte,
        checkAdminPin, refreshParticipants, updateCagnotte,
    } = useCagnotteStore();

    const [pin, setPin] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [pinError, setPinError] = useState('');
    const [checkingPin, setCheckingPin] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        photo: '',
        target: '',
        phone: '',
    });
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        if (cagnotte) {
            setEditForm({
                title: cagnotte.title || '',
                description: cagnotte.description || '',
                photo: cagnotte.photo || '',
                target: cagnotte.target || 0,
                phone: cagnotte.phone || '',
            });
        }
    }, [cagnotte]);

    const handleUpdate = async () => {
        if (!editForm.title.trim()) return;
        if (editForm.photo && !isSafeUrl(editForm.photo)) return;
        
        setEditSubmitting(true);
        try {
            await updateCagnotte({
                ...editForm,
                target: parseFloat(editForm.target) || 0,
            });
            setIsEditing(false);
        } finally {
            setEditSubmitting(false);
        }
    };

    // ── URL secret token auto-login ────────────────────────────────────────────
    useEffect(() => {
        const urlSecret = searchParams.get('secret');
        if (urlSecret && ADMIN_SECRET && urlSecret === ADMIN_SECRET) {
            setAuthenticated(true);
        }
    }, [searchParams]);

    // ── Refresh participants when admin logs in ────────────────────────────────
    useEffect(() => {
        if (authenticated && USE_SUPABASE) {
            refreshParticipants();
        }
    }, [authenticated, refreshParticipants]);

    if (!cagnotte) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-white/50 mb-4">Aucune cagnotte active.</p>
                    <button onClick={() => navigate('/')} className="btn-primary px-6 py-3 rounded-xl text-white text-sm font-semibold">
                        Créer une cagnotte
                    </button>
                </div>
            </div>
        );
    }

    const handleLogin = async () => {
        setCheckingPin(true);
        setPinError('');
        try {
            const ok = await checkAdminPin(pin);
            if (ok) {
                setAuthenticated(true);
            } else {
                setPinError('Code PIN incorrect');
                setPin('');
            }
        } catch {
            setPinError('Erreur de vérification, réessayez.');
        } finally {
            setCheckingPin(false);
        }
    };

    const handleDelete = async () => {
        await deleteCagnotte();
        navigate('/');
    };

    // ── PIN Screen ─────────────────────────────────────────────────────────────
    if (!authenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4">
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-20 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
                </div>
                <div className="w-full max-sm animate-fadeIn relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
                            style={{ background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)' }}>
                            <Shield size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Espace Admin</h1>
                        <p className="text-white/50 text-sm">Entrez votre code PIN pour continuer</p>

                        {/* Backend mode badge */}
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full glass text-xs">
                            {USE_SUPABASE
                                ? <><Database size={11} className="text-emerald-400" /><span className="text-emerald-400">Supabase</span></>
                                : <><Wifi size={11} className="text-amber-400" /><span className="text-amber-400">Mode local</span></>
                            }
                        </div>
                    </div>

                    <div className="glass rounded-3xl p-8">
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                Code PIN
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => { setPin(e.target.value); setPinError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && !checkingPin && handleLogin()}
                                placeholder="••••"
                                className="input-dark w-full rounded-xl px-4 py-3 text-center text-xl tracking-widest"
                                maxLength={10}
                                autoFocus
                                disabled={checkingPin}
                            />
                            {pinError && <p className="text-pink-400 text-xs mt-2 text-center">{pinError}</p>}
                        </div>
                        <button
                            onClick={handleLogin}
                            disabled={checkingPin || !pin}
                            className="btn-primary w-full rounded-xl py-3.5 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {checkingPin && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {checkingPin ? 'Vérification…' : 'Connexion'}
                        </button>
                        <button onClick={() => navigate('/cagnotte')}
                            className="w-full mt-3 py-3 text-white/40 text-sm hover:text-white/70 transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft size={14} /> Retour à la cagnotte
                        </button>

                        {ADMIN_SECRET && (
                            <p className="text-white/20 text-xs text-center mt-4">
                                Accès rapide possible via <code className="text-white/30">?secret=…</code>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const targetVal = parseFloat(cagnotte.target) || 0;
    const validatedPercent = targetVal > 0 ? (validatedAmount / targetVal) * 100 : 0;
    const pendingPercent = targetVal > 0 ? (pendingAmount / targetVal) * 100 : 0;
    const totalPercent = Math.min(validatedPercent + pendingPercent, 100);

    // ── Admin Dashboard ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen pb-12">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-20 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
            </div>

            <div className="max-w-lg mx-auto px-4 pt-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate('/cagnotte')}
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
                        <ArrowLeft size={16} /> Cagnotte
                    </button>
                    <div className="flex items-center gap-2">
                        <Shield size={14} className="text-purple-400" />
                        <span className="text-white/60 text-sm font-medium">Admin</span>
                        {USE_SUPABASE
                            ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1"><Database size={10} /> Supabase</span>
                            : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1"><Wifi size={10} /> Local</span>
                        }
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                    {isEditing ? (
                        <input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white font-bold text-2xl w-full"
                        />
                    ) : (
                        <h1 className="text-2xl font-bold text-white">{cagnotte.title}</h1>
                    )}
                    <button
                        onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                        className="p-2 rounded-lg glass text-white/50 hover:text-white transition-colors"
                    >
                        {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                    </button>
                </div>

                {isEditing ? (
                    <div className="space-y-4 mb-6 animate-fadeIn">
                        <div>
                            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Description</label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="input-dark w-full rounded-xl p-3 text-sm resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Objectif (€)</label>
                                <input
                                    type="number"
                                    value={editForm.target}
                                    onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                                    className="input-dark w-full rounded-xl px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Téléphone Wero</label>
                                <input
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="input-dark w-full rounded-xl px-3 py-2 text-sm font-mono"
                                    placeholder="06 12 34 56 78"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Photo (URL)</label>
                            <input
                                value={editForm.photo}
                                onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })}
                                className="input-dark w-full rounded-xl px-3 py-2 text-sm"
                                placeholder="https://..."
                            />
                        </div>
                        <button
                            onClick={handleUpdate}
                            disabled={editSubmitting}
                            className="btn-primary w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                        >
                            {editSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                            Enregistrer les modifications
                        </button>
                    </div>
                ) : (
                    <p className="text-white/40 text-sm mb-6">Gérez les participations</p>
                )}

                {/* Summary */}
                <div className="glass rounded-2xl p-6 mb-6 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 relative z-10">
                        <div className="flex gap-8">
                            <div>
                                <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-2">Validé (Reçu)</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-emerald-400 leading-none">
                                        {formatAmount(validatedAmount).split(',')[0]}
                                    </span>
                                    <span className="text-xl font-bold text-emerald-400/80">
                                        ,{formatAmount(validatedAmount).split(',')[1]}€
                                    </span>
                                </div>
                            </div>
                            {pendingAmount > 0 && (
                                <div>
                                    <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] mb-2">En attente</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-amber-400 leading-none">
                                            {formatAmount(pendingAmount).split(',')[0]}
                                        </span>
                                        <span className="text-sm font-bold text-amber-400/80">
                                            ,{formatAmount(pendingAmount).split(',')[1]}€
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {targetVal > 0 && (
                            <div className="text-right">
                                {pendingAmount > 0 ? (
                                    <p className="text-white/30 text-[10px] uppercase tracking-wider font-bold mb-1">
                                        Total: <span className="text-white/60">{Math.round(totalPercent)}%</span>
                                    </p>
                                ) : null}
                                <p className="text-5xl font-black gradient-text leading-none">{Math.round(validatedPercent)}%</p>
                                <p className="text-white/30 text-[10px] uppercase tracking-wider font-bold mt-1 text-emerald-400/50">Confirmé</p>
                            </div>
                        )}
                    </div>

                    {targetVal > 0 && (
                        <div className="space-y-3 relative z-10">
                            <div className="h-5 bg-black/40 backdrop-blur-md rounded-full overflow-hidden border border-white/5 p-1 shadow-inner flex">
                                {/* Validated Bar */}
                                <div
                                    className="h-full rounded-l-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                    style={{
                                        width: `${Math.min(validatedPercent, 100)}%`,
                                        background: 'linear-gradient(90deg, #10b981, #059669)',
                                        borderRight: validatedPercent < totalPercent ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                    }}
                                />
                                {/* Pending Bar */}
                                <div
                                    className={`h-full transition-all duration-1000 ease-out relative ${validatedPercent === 0 ? 'rounded-l-full' : ''} ${totalPercent >= 100 ? 'rounded-r-full' : ''}`}
                                    style={{
                                        width: `${Math.min(pendingPercent, 100 - validatedPercent)}%`,
                                        background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                        opacity: 0.8
                                    }}
                                />
                            </div>
                            
                            {/* Legend */}
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmé
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-500">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" /> En attente
                                </div>
                                <div className="ml-auto text-white/30">
                                    Objectif: {formatAmount(targetVal)}€
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Participants */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-white/80">Participations à valider</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">{participants.filter(p => p.status === 'pending').length} en attente</span>
                        {USE_SUPABASE && (
                            <button onClick={refreshParticipants}
                                className="glass p-1.5 rounded-lg text-white/40 hover:text-white transition-colors">
                                <RefreshCw size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {participants.length === 0 ? (
                    <div className="glass rounded-2xl p-8 text-center">
                        <p className="text-white/40 text-sm">Aucune participation pour l'instant.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {[...participants].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)).map((p) => (
                            <div key={p.id} className={`glass rounded-2xl p-4 transition-all duration-300 ${p.status === 'validated' ? 'opacity-70' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6b9d)' }}>
                                        {p.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-white flex items-center gap-2">
                                                {p.name}
                                                {p.is_anonymous && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/5 font-normal uppercase tracking-tighter">Anonyme</span>
                                                )}
                                                {p.hide_amount && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50 border border-white/5 font-normal uppercase tracking-tighter">Montant Masqué</span>
                                                )}
                                            </p>
                                            <p className="font-bold text-white text-lg">{formatAmount(p.amount)}€</p>
                                        </div>
                                        <p className="text-white/40 text-xs mt-0.5">{formatDate(p.created_at || p.date)}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            {p.status === 'validated' ? (
                                                <>
                                                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                                                        <CheckCircle size={11} /> Paiement reçu
                                                    </span>
                                                    <button onClick={() => invalidateParticipant(p.id)}
                                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 text-white/40 hover:text-white/70 transition-colors">
                                                        <RefreshCw size={10} /> Annuler
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                                                        <Clock size={11} /> En attente
                                                    </span>
                                                    <button onClick={() => validateParticipant(p.id)}
                                                        className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold transition-all hover:scale-105"
                                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
                                                        <CheckCircle size={11} /> Marquer reçu
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Danger zone */}
                <div className="mt-8 glass rounded-2xl p-5 border border-red-500/20">
                    <h3 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2">
                        <Trash2 size={14} /> Zone de danger
                    </h3>
                    {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-2.5 rounded-xl text-red-400 border border-red-400/30 text-sm hover:bg-red-500/10 transition-colors">
                            Supprimer la cagnotte
                        </button>
                    ) : (
                        <div>
                            <p className="text-white/60 text-xs mb-3">Êtes-vous sûr ? Cette action est irréversible.</p>
                            <div className="flex gap-2">
                                <button onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl text-white/50 border border-white/10 text-sm hover:bg-white/5 transition-colors">
                                    Annuler
                                </button>
                                <button onClick={handleDelete}
                                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm bg-red-500/80 hover:bg-red-500 transition-colors">
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
