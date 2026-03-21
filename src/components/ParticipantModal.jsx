import { useState } from 'react';
import { X, User, Euro, ArrowRight, Smartphone, Copy, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { useCagnotteStore } from '../store/useCagnotteStore';
import { sanitizeString } from '../utils/security';

const STEPS = { FORM: 'form', WERO: 'wero' };

export default function ParticipantModal({ onClose, phone }) {
    const { addParticipant } = useCagnotteStore();
    const [step, setStep] = useState(STEPS.FORM);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [errors, setErrors] = useState({});
    const [copied, setCopied] = useState(false);
    const [participant, setParticipant] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [isAnonymous, setIsAnonymous] = useState(false);
    const [hideAmount, setHideAmount] = useState(false);

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Ton prénom est requis';
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
            errs.amount = 'Montant invalide';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            const p = await addParticipant(sanitizeString(name), parseFloat(amount), isAnonymous, hideAmount);
            if (p) {
                setParticipant(p);
                setStep(STEPS.WERO);
            } else {
                setErrors({ name: 'Erreur lors de l\'enregistrement, réessayez.' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(phone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-[210] animate-slideUp">
                <div className="glass-dark rounded-t-3xl max-w-lg mx-auto p-6 pb-10">

                    {/* Handle */}
                    <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                    >
                        <X size={16} />
                    </button>

                    {step === STEPS.FORM && (
                        <>
                            <h2 className="text-xl font-bold text-white mb-1">Participer 🎉</h2>
                            <p className="text-white/50 text-sm mb-6">Tu seras redirigé vers Wero pour effectuer ton virement.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                        Ton prénom *
                                    </label>
                                    <div className="relative">
                                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => { setName(e.target.value); setErrors(er => ({ ...er, name: '' })); }}
                                            placeholder="Ex: Sophie"
                                            className="input-dark w-full rounded-xl pl-9 pr-4 py-3 text-sm"
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-[10px] text-white/30 mt-1 italic">
                                        L'administrateur verra ce nom pour valider ton paiement.
                                    </p>
                                    {errors.name && <p className="text-pink-400 text-xs mt-1">{errors.name}</p>}
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                        Montant (€) *
                                    </label>
                                    <div className="relative">
                                        <Euro size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                                        <input
                                            type="number"
                                            value={amount}
                                            min="1"
                                            step="0.5"
                                            onChange={(e) => { setAmount(e.target.value); setErrors(er => ({ ...er, amount: '' })); }}
                                            placeholder="Ex: 20"
                                            className="input-dark w-full rounded-xl pl-9 pr-4 py-3 text-sm"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-pink-400 text-xs mt-1">{errors.amount}</p>}
                                </div>

                                {/* Quick amounts */}
                                <div className="flex gap-2 flex-wrap">
                                    {[10, 20, 30, 50].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => { setAmount(String(v)); setErrors(er => ({ ...er, amount: '' })); }}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${amount === String(v)
                                                ? 'text-white'
                                                : 'glass text-white/60 hover:text-white'
                                                }`}
                                            style={amount === String(v) ? { background: 'linear-gradient(135deg, #6c63ff, #8b5cf6)' } : {}}
                                        >
                                            {v}€
                                        </button>
                                    ))}
                                </div>

                                {/* Options */}
                                <div className="space-y-2 pt-2">
                                    <label className="flex items-center gap-3 glass p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                                        />
                                        <span className="text-sm text-white/80">Participer anonymement</span>
                                    </label>

                                    <label className="flex items-center gap-3 glass p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={hideAmount}
                                            onChange={(e) => setHideAmount(e.target.checked)}
                                            className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                                        />
                                        <span className="text-sm text-white/80">Masquer le montant (public)</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary w-full rounded-xl py-4 text-white font-bold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                                >
                                    {submitting
                                        ? <><Loader2 size={18} className="animate-spin" /> Enregistrement…</>
                                        : <>Continuer vers le paiement <ArrowRight size={18} /></>}
                                </button>
                            </form>
                        </>
                    )}

                    {step === STEPS.WERO && participant && (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                                    💸
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Payer avec Wero</h2>
                                <p className="text-white/50 text-sm">
                                    Ta participation de <span className="text-white font-bold">{participant.amount}€</span> a été enregistrée.
                                    <br />Effectue maintenant le virement Wero.
                                </p>
                            </div>

                            {/* Phone card */}
                            <div className="glass rounded-2xl p-4 mb-5">
                                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Numéro bénéficiaire</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-white font-bold text-lg tracking-wide">{phone}</p>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all glass text-white/60 hover:text-white"
                                    >
                                        {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                        {copied ? 'Copié !' : 'Copier'}
                                    </button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="glass rounded-2xl p-4 mb-5 space-y-3">
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Instructions</p>
                                {[
                                    'Ouvre ton application bancaire',
                                    'Va dans la section Wero / Paiement',
                                    `Envoie ${participant.amount}€ au numéro ci-dessus`,
                                    'Indique ton prénom en commentaire (optionnel)',
                                ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                            style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6b9d)', color: 'white' }}>
                                            {i + 1}
                                        </span>
                                        <p className="text-white/70 text-sm">{step}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-xl text-white font-bold bg-white/10 hover:bg-white/20 transition-all border border-white/10 shadow-lg"
                            >
                                J'ai effectué le virement ✓
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
