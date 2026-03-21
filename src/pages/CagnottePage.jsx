import { useState } from 'react';
import { Users, TrendingUp, Clock, CheckCircle, Share2, Settings, ChevronRight, Euro, FileText } from 'lucide-react';
import { useCagnotteStore } from '../store/useCagnotteStore';
import ParticipantModal from '../components/ParticipantModal';

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatAmount(n) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CagnottePage() {
    const { cagnotte, participants, validatedAmount, pendingAmount, progress } = useCagnotteStore();
    const [showModal, setShowModal] = useState(false);

    if (!cagnotte) return null;

    const totalWithPending = validatedAmount + pendingAmount;
    const progressTotal = cagnotte.target > 0 ? Math.min((totalWithPending / cagnotte.target) * 100, 100) : 0;

    return (
        <div className="min-h-screen pb-24">
            {/* Fixed background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-20 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-pink-600 rounded-full opacity-8 blur-3xl" />
            </div>

            {/* Hero */}
            <div className="relative h-64 overflow-hidden">
                {cagnotte.photo ? (
                    <img
                        src={cagnotte.photo}
                        alt={cagnotte.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95, #831843)' }}>
                        <div className="text-6xl">🎁</div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/50 to-transparent" />

                {/* Admin badge */}
                <a href="/admin"
                    className="absolute top-4 right-4 glass rounded-full px-3 py-1.5 text-xs text-white/70 flex items-center gap-1 hover:text-white transition-colors">
                    <Settings size={12} /> Admin
                </a>

                {/* Title */}
                <div className="absolute bottom-6 left-4 right-4 text-center">
                    <h1 className="text-3xl font-black text-white drop-shadow-lg">{cagnotte.title}</h1>
                </div>
            </div>

            <div className="px-4 max-w-lg mx-auto relative z-10">

                {/* Progress Card */}
                <div className="glass rounded-3xl p-6 mt-4 animate-fadeIn">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Collecté</p>
                            <p className="text-3xl font-bold text-white">
                                {formatAmount(totalWithPending)}<span className="text-lg text-white/40">€</span>
                            </p>
                            <p className="text-white/40 text-xs mt-0.5">
                                sur{' '}
                                <span className="text-white/70 font-semibold">
                                    {formatAmount(cagnotte.target)}€
                                </span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black gradient-text">{Math.round(progressTotal)}%</p>
                            <p className="text-white/40 text-xs">atteint</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                            style={{
                                width: `${progressTotal}%`,
                                background: 'linear-gradient(90deg, #6c63ff, #ff6b9d)',
                            }}
                        />
                    </div>

                </div>

                {/* Description */}
                {cagnotte.description && (
                    <div className="glass rounded-3xl p-6 mt-3 animate-fadeIn">
                        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText size={14} className="text-purple-400" />
                            À propos
                        </h2>
                        <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {cagnotte.description}
                        </div>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                    {[
                        { icon: Users, label: 'Participants', value: participants.length },
                        { icon: Euro, label: 'Objectif', value: `${formatAmount(cagnotte.target)}€`, color: 'text-pink-400' },
                    ].map(({ icon: StatIcon, label, value, color }) => (
                        <div key={label} className="glass rounded-2xl p-4 text-center">
                            <StatIcon size={18} className={`mx-auto mb-1 ${color || 'text-purple-400'}`} />
                            <p className="text-xl font-bold text-white">{value}</p>
                            <p className="text-white/40 text-xs">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Participants list */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-white/80 flex items-center gap-2">
                            <TrendingUp size={16} className="text-purple-400" />
                            Participations
                        </h2>
                        <span className="text-xs text-white/40">{participants.length} au total</span>
                    </div>

                    {participants.length === 0 ? (
                        <div className="glass rounded-2xl p-8 text-center">
                            <div className="text-4xl mb-3">🎉</div>
                            <p className="text-white/50 text-sm">Soyez le premier à participer !</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {[...participants].sort((a, b) => b.date - a.date).map((p) => (
                                <div key={p.id}
                                    className="glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-fadeIn">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6b9d)' }}>
                                        {p.name[0]?.toUpperCase()}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-white text-sm truncate">{p.name}</p>
                                        <p className="text-white/40 text-xs">{formatDate(p.date)}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-white text-sm">{formatAmount(p.amount)}€</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating CTA */}
            <div className="fixed bottom-0 left-0 right-0 p-4 glass-dark">
                <div className="max-w-lg mx-auto flex gap-3">
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: cagnotte.title, url: window.location.href });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                            }
                        }}
                        className="glass rounded-xl px-4 py-3.5 text-white/60 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <Share2 size={18} />
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex-1 rounded-xl py-3.5 text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <Euro size={18} />
                        Participer à la cagnotte
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {showModal && (
                <ParticipantModal onClose={() => setShowModal(false)} phone={cagnotte.phone} />
            )}
        </div>
    );
}
