/**
 * @file src/routes/client/BecomeMakerPage.tsx
 * @description Page de formulaire pour permettre à un client de créer son profil Maker 
 * et de faire passer son rôle à 'maker'.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Printer, 
  Building2, 
  FileText, 
  MapPin, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';
import { useUserRole } from '../../hooks/useUserRole';

export default function BecomeMakerPage() {
  const { user } = useUserRole();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedBusinessName = businessName.trim();
    if (!trimmedBusinessName) {
      setErrorMsg("Le nom de l'activité est obligatoire.");
      return;
    }

    if (!user) {
      setErrorMsg("Vous devez être connecté pour devenir Maker.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insertion dans la table maker_profiles
      const { error: profileError } = await (supabaseClient
        .from('maker_profiles' as any) as any)
        .upsert({
          id: user.id,
          business_name: trimmedBusinessName,
          bio: bio.trim() || null,
          city: city.trim() || null,
        });

      if (profileError) {
        throw new Error(`Erreur lors de la création du profil Maker : ${profileError.message}`);
      }

      // 2. Mise à jour du rôle utilisateur dans public.users vers 'maker'
      const { error: userError } = await (supabaseClient
        .from('users' as any) as any)
        .update({ role: 'maker' })
        .eq('id', user.id);

      if (userError) {
        throw new Error(`Le profil a été créé, mais la mise à jour du rôle a échoué : ${userError.message}`);
      }

      // Succès - Redirection vers l'espace Maker
      navigate('/maker');
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erreur Devenir Maker:', error);
      setErrorMsg(error?.message || "Une erreur inattendue s'est produite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Navigation de retour */}
      <div>
        <Link
          to="/client"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'Espace Client</span>
        </Link>
      </div>

      {/* En-tête */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Devenir Maker
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                Étape Client ➔ Maker
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Remplissez les informations ci-dessous pour proposer vos services d'impression 3D sur P2Print.
            </p>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {errorMsg && (
        <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">Échec de la soumission</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        {/* Nom de l'activité */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Nom de l'activité / Atelier</span>
            <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Atelier 3D Print, PrintLab Pro..."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={submitting}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <p className="text-[11px] text-slate-400">Ce nom sera visible par les clients recherchant des makers.</p>
        </div>

        {/* Ville */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Ville</span>
            <span className="text-slate-400 font-normal">(Optionnel)</span>
          </label>
          <input
            type="text"
            placeholder="Ex: Nantes, Paris, Lyon..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={submitting}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Bio / Présentation */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Présentation de l'activité</span>
            <span className="text-slate-400 font-normal">(Optionnel)</span>
          </label>
          <textarea
            rows={4}
            placeholder="Présentez vos compétences, vos équipements (FDM, Résine, matériaux supportés) et vos délais habituels..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={submitting}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-y"
          />
        </div>

        {/* Note d'information */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            En validant, votre compte basculera en statut <strong className="text-slate-200">Maker</strong>. Vous aurez immédiatement accès à l'Espace Maker.
          </span>
        </div>

        {/* Bouton de validation */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            to="/client"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Création en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Valider et Devenir Maker</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
