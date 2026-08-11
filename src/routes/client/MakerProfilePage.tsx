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
  Package
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

              {/* Bouton désactivé (placeholder) */}
              <div className="flex flex-col items-stretch sm:items-end gap-1 w-full sm:w-auto">
                <button
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-400 border border-slate-700/60 rounded-xl text-xs font-bold opacity-60 cursor-not-allowed w-full sm:w-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Demander un devis</span>
                </button>
                <span className="text-[10px] text-amber-400/90 font-mono text-center sm:text-right">
                  ⚡ Fonctionnalité bientôt disponible
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
