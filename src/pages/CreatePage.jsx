import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Image, Phone, Target, Type, FileText, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useCagnotteStore } from '../store/useCagnotteStore';
import { sanitizeString, isSafeUrl } from '../utils/security';

export default function CreatePage() {
    const navigate = useNavigate();
    const { createCagnotte } = useCagnotteStore();

    const [form, setForm] = useState({
        title: '',
        description: '',
        photo: '',
        target: '',
        phone: '',
        adminPin: '1234',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setErrors((er) => ({ ...er, [e.target.name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Le titre est requis';
        if (form.photo && !isSafeUrl(form.photo)) errs.photo = 'L\'URL doit commencer par http:// ou https://';
        if (form.target && (isNaN(form.target) || parseFloat(form.target) < 0))
            errs.target = 'Montant invalide';
        if (!form.phone.trim()) errs.phone = 'Le numéro Wero est requis';
        if (!form.adminPin || form.adminPin.length < 4)
            errs.adminPin = 'PIN min. 4 caractères';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSubmitting(true);
        try {
            await createCagnotte({
                title: sanitizeString(form.title),
                description: sanitizeString(form.description),
                photo: form.photo.trim(),
                target: form.target ? parseFloat(form.target) : 0,
                phone: sanitizeString(form.phone),
                adminPin: sanitizeString(form.adminPin),
            });
            navigate('/cagnotte');
        } finally {
            setSubmitting(false);
        }
    };

    const fields = [
        { name: 'title', label: 'Titre de la cagnotte', placeholder: 'Ex: Cadeau anniversaire de Marie', icon: Type, required: true },
        { name: 'description', label: 'Description', placeholder: 'Décrivez le cadeau…', icon: FileText, textarea: true },
        { name: 'photo', label: 'URL de la photo', placeholder: 'https://example.com/photo.jpg', icon: Image },
        { name: 'target', label: 'Montant cible (€)', placeholder: 'Optionnel (ex: 150)', icon: Target, type: 'number', required: false },
        { name: 'phone', label: 'Numéro Wero (bénéficiaire)', placeholder: 'Ex: 06 12 34 56 78', icon: Phone, required: true },
        { name: 'adminPin', label: 'Code PIN admin', placeholder: '4+ chiffres', icon: Sparkles, type: 'password', required: true },
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600 rounded-full opacity-10 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600 rounded-full opacity-10 blur-3xl" />
            </div>

            <div className="w-full max-w-lg animate-fadeIn relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
                        style={{ background: 'linear-gradient(135deg, #6c63ff, #ff6b9d)' }}>
                        <Gift size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">Créer une cagnotte</h1>
                    <p className="text-white/50 text-sm">Remplissez les informations pour partager avec vos amis</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-5">
                    {fields.map(({ name, label, placeholder, icon: FieldIcon, textarea, type = 'text', required }) => (
                        <div key={name}>
                            <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                                {label}{required && <span className="text-pink-400 ml-1">*</span>}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" style={textarea ? { top: '16px', transform: 'none' } : {}}>
                                    <FieldIcon size={16} />
                                </div>
                                {textarea ? (
                                    <textarea
                                        name={name}
                                        value={form[name]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                        rows={3}
                                        className="input-dark w-full rounded-xl pl-9 pr-4 pt-3 pb-3 text-sm resize-none"
                                    />
                                ) : (
                                    <input
                                        name={name}
                                        type={type}
                                        value={form[name]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                        className="input-dark w-full rounded-xl pl-9 pr-4 py-3 text-sm"
                                    />
                                )}
                            </div>
                            {errors[name] && (
                                <p className="text-pink-400 text-xs mt-1">{errors[name]}</p>
                            )}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-primary w-full rounded-xl py-4 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                        {submitting ? 'Création en cours…' : 'Créer la cagnotte'}
                 