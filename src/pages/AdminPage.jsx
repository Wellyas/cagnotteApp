import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Shield, CheckCircle, Clock, ArrowLeft, Trash2, RefreshCw, Database, Wifi
} from 'lucide-react';
import { useCagnotteStore } from '../store/useCagnotteStore';
import { USE_SUPABASE } from '../services/dataService';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

function formatAmount(n) {
    return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        cagnotte, participants, validatedAmount, progress,
        validateParticipant, invalidateParticipant, deleteCagnotte,
        checkAdminPin, refreshParticipants,
    } = useCagnotteStore();

    const [pin, setPin] = useState('');
    const [authenticated, setAuthenticated] = useState(false);
    const [pinError, setPinError] = useState('');
    const [checkingPin, setCheckingPin] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
                <div className="w-full max-w-sm animate-fadeIn relative z-10">
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

                <h1 className="text-2xl font-bold text-white mb-1">{cagnotte.title}</h1>
                <p className="text-white/40 text-sm mb-6">Gérez les participations</p>

                {/* Summary */}
                <div className="glass rounded-2xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-white/50 text-xs uppercase tracking-wider">Collecté / Objectif</p>
                            <p className="text-white font-bold text-xl mt-0.5">
                                {formatAmount(validatedAmount)}€
                                <span className="text-white/30 font-normal text-base"> / {formatAmount(cagnotte.target)}€</span>
                            </p>
                        </div>
                        <span className="text-3xl font-black gradient-text">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6c63ff, #ff6b9d)' }} />
                    </div>
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
