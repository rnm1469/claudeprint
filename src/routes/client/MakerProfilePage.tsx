/**
 * @file src/routes/client/MakerProfilePage.tsx
 * @description Page de profil détaillée d'un Maker approuvé.
 * Affiche l'ensemble des informations de l'atelier pour les clients.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Send, 
  RefreshCw, 
  AlertCircle,
  FileQuestion,
  Sparkles,
  Printer,
  Package,
  X,
  Upload,
  Paperclip,
  Clock
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';
import type { MakerProfile, MakerArticle } from '../../lib/types';

export default function MakerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [maker, setMaker] = useState<MakerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [articles, setArticles] = useState<MakerArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState<boolean>(true);

  // Devis state
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [quoteMessage, setQuoteMessage] = useState<string>('');
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    async function fetchMakerProfile() {
      if (!id) {
        setLoading(false);
        setError('Identifiant de Maker manquant.');
        return;
      }

      setLoading(true);
      setError(null);
      setArticlesLoading(true);

      try {
        const { data, error: queryError } = await (supabaseClient
          .from('maker_profiles' as any) as any)
          .select('*')
          .eq('id', id)
          .eq('status', 'approved')
          .single();

        if (queryError || !data) {
          console.warn('⚡ [MakerProfilePage] Profil introuvable ou non approuvé:', queryError);
          setMaker(null);
        } else {
          setMaker(data as MakerProfile);

          // Récupération des articles actifs du maker
          try {
            const { data: articlesData, error: articlesError } = await (supabaseClient
              .from('maker_articles' as any) as any)
              .select('*')
              .eq('maker_id', id)
              .eq('is_active', true)
              .order('created_at', { ascending: false });

            if (articlesError) {
              console.error('Erreur lors du chargement des articles du Maker:', articlesError);
            } else {
              setArticles((articlesData as MakerArticle[]) || []);
            }
          } catch (artErr) {
            console.error('Erreur lors de la récupération des articles:', artErr);
          } finally {
            setArticlesLoading(false);
          }

          // Vérification si le client a déjà une demande en statut 'pending' pour ce maker
          try {
            const { data: authData } = await supabaseClient.auth.getUser();
            const currentUser = authData?.user;
            if (currentUser) {
              const { data: pendingReq } = await (supabaseClient
                .from('quote_requests' as any) as any)
                .select('id')
                .eq('client_id', currentUser.id)
                .eq('maker_id', id)
                .eq('status', 'pending')
                .maybeSingle();

              if (pendingReq) {
                setHasPendingRequest(true);
              }
            }
          } catch (pendingErr) {
            console.error('Erreur vérification demande en cours:', pendingErr);
          }
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        console.error('Erreur de chargement du profil Maker:', errorObj);
        setError(errorObj.message || 'Erreur lors du chargement du profil.');
      } finally {
        setLoading(false);
      }
    }

    fetchMakerProfile();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite 20 Mo
    if (file.size > 20 * 1024 * 1024) {
      setQuoteError('La taille du fichier 3D ne doit pas dépasser 20 Mo.');
      return;
    }

    setQuoteError(null);
    setQuoteFile(file);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setQuoteError(null);

    const messageTrimmed = quoteMessage.trim();
    if (!messageTrimmed && !quoteFile) {
      setQuoteError('Veuillez saisir un message explicatif ou joindre un fichier 3D.');
      return;
    }

    setSubmittingQuote(true);

    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const currentUser = authData?.user;

      if (!currentUser) {
        throw new Error('Vous devez être connecté pour envoyer une demande de devis.');
      }

      let filePath: string | null = null;

      if (quoteFile) {
        const cleanFileName = quoteFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        filePath = `${currentUser.id}/${Date.now()}-${cleanFileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('devis-fichiers-3d')
          .upload(filePath, quoteFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erreur Storage devis-fichiers-3d upload:', uploadError);
          throw new Error(`Erreur lors de l'envoi du fichier 3D : ${uploadError.message}`);
        }
      }

      const { error: insertError } = await (supabaseClient
        .from('quote_requests' as any) as any)
        .insert({
          client_id: currentUser.id,
          maker_id: id,
          message: messageTrimmed || null,
          file_path: filePath,
          status: 'pending'
        });

      if (insertError) {
        console.error('Erreur enregistrement demande devis:', insertError);
        throw new Error(`Erreur lors de la création de la demande : ${insertError.message}`);
      }

      setHasPendingRequest(true);
      setIsQuoteModalOpen(false);
      setQuoteMessage('');
      setQuoteFile(null);
      setToastMsg({
        type: 'success',
        message: 'Votre demande de devis a été envoyée avec succès à cet atelier !'
      });

      setTimeout(() => setToastMsg(null), 5000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Échec envoi devis:', errorObj);
      setQuoteError(errorObj.message || 'Impossible d\'envoyer votre demande de devis.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Bouton de retour */}
      <div>
        <Link
          to="/makers"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Retour aux Makers</span>
        </Link>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Chargement des informations de l'atelier Maker...</p>
        </div>
      )}

      {/* Introuvable ou non approuvé / Erreur */}
      {!loading && (!maker || error) && (
        <div className="py-16 px-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-4">
          <FileQuestion className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-200">
              Profil introuvable ou non disponible
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Le profil Maker demandé n'existe pas ou n'a pas encore été validé par la modération.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/makers"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorer la liste des Makers</span>
            </Link>
          </div>
        </div>
      )}

      {/* Toast message de confirmation */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg animate-in fade-in duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : 'bg-blue-950/90 border-blue-800 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg.message}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal / Formulaire de Demande de Devis */}
      {isQuoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Demande de devis sur mesure
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsQuoteModalOpen(false);
                  setQuoteError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Envoyez les détails de votre projet ou votre fichier 3D à l'atelier <span className="font-bold text-white">{maker?.business_name}</span>.
            </p>

            {quoteError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{quoteError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Message / Instructions pour le Maker</span>
                  <span className="text-[10px] text-slate-500 font-normal">Optionnel</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Décrivez votre besoin : dimensions souhaitées, quantité, matériau, couleur ou précision d'impression..."
                  value={quoteMessage}
                  onChange={(e) => setQuoteMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Fichier 3D */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Fichier 3D (.stl, .obj, .3mf)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Max 20 Mo</span>
                </label>

                {quoteFile ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-200 font-medium truncate">{quoteFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        ({(quoteFile.size / (1024 * 1024)).toFixed(2)} Mo)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuoteFile(null)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer le fichier"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/50 hover:bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    <Upload className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 mb-1 transition-colors" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-300">
                      Cliquez pour joindre votre fichier 3D
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Formats acceptés : STL, OBJ, 3MF
                    </span>
                    <input
                      type="file"
                      accept=".stl,.obj,.3mf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuoteModalOpen(false);
                    setQuoteError(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  {submittingQuote ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{submittingQuote ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profil trouvé */}
      {!loading && maker && (
        <div className="space-y-6">
          {/* Carte En-tête du Maker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{maker.business_name}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-mono font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Vérifié</span>
                    </span>
                  </div>

                  {maker.city && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{maker.city}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>
                      Membre depuis le {new Date(maker.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tag Statut / Atelier */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-emerald-400 self-start">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Atelier Partenaire P2Print</span>
              </div>
            </div>

            {/* Bio / Description complète */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                À propos de l'atelier
              </h3>
              {maker.bio ? (
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 whitespace-pre-line">
                  {maker.bio}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
                  Cet atelier n'a pas encore rédigé de description détaillée.
                </p>
              )}
            </div>

            {/* Catalogue d'articles */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Catalogue de l'atelier
              </h3>

              {articlesLoading ? (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/40 flex items-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Chargement des articles du catalogue...</span>
                </div>
              ) : articles.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
                  Cet atelier n'a pas encore d'articles en catalogue.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      {/* Zone photo */}
                      {article.photo_url ? (
                        <div className="w-full h-40 bg-slate-950 overflow-hidden relative">
                          <img
                            src={article.photo_url}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-slate-800/80 flex items-center justify-center text-slate-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}

                      {/* Détails de l'article */}
                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white line-clamp-1">
                            {article.title}
                          </h4>
                          {article.description ? (
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {article.description}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              Pas de description.
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Prix</span>
                          <span className="text-emerald-400 font-bold font-mono text-sm">
                            {article.price.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section Actions / Demande de devis */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Service d'impression sur mesure</span>
                </div>
                <p className="text-xs text-slate-400">
                  Demandez un devis directement auprès de cet atelier pour vos fichiers 3D.
                </p>
              </div>

              {/* Bouton de demande de devis */}
              <div className="flex flex-col items-stretch sm:items-end gap-1 w-full sm:w-auto">
                {hasPendingRequest ? (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-bold opacity-80 cursor-not-allowed w-full sm:w-auto"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Demande déjà envoyée, en attente de réponse</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsQuoteModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer w-full sm:w-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Demander un devis</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
