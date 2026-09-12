/**
 * @file src/routes/client/ClientQuoteRequestsPage.tsx
 * @description Page de consultation des demandes de devis envoyées par un Client.
 * Affichage en lecture seule de l'état des demandes, des détails de l'atelier, et téléchargement du fichier 3D joint.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  PackageCheck,
  Calendar,
  Paperclip,
  Tag,
  Store,
  ExternalLink
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';

export interface ClientQuoteRequest {
  id: string;
  client_id: string;
  maker_id: string;
  maker_article_id?: string | null;
  message?: string | null;
  file_path?: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  maker_name?: string;
  article_title?: string | null;
}

export default function ClientQuoteRequestsPage() {
  const [quotes, setQuotes] = useState<ClientQuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'info'; message: string } | null>(null);

  const fetchClientQuotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const currentUser = authData?.user;

      if (!currentUser) {
        throw new Error('Vous devez être connecté pour consulter vos demandes de devis.');
      }

      // 1. Récupération des demandes du client
      const { data, error: fetchErr } = await (supabaseClient
        .from('quote_requests' as any) as any)
        .select('*')
        .eq('client_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        throw fetchErr;
      }

      const fetchedQuotes = (data as ClientQuoteRequest[]) || [];

      // 2. Récupération des noms des makers via requête séparée
      const makerIds = Array.from(new Set(fetchedQuotes.map((q) => q.maker_id))).filter(Boolean);
      let makerNameMap: Record<string, string> = {};

      if (makerIds.length > 0) {
        const { data: makersData, error: makersErr } = await (supabaseClient
          .from('maker_profiles' as any) as any)
          .select('id, business_name')
          .in('id', makerIds);

        if (!makersErr && makersData) {
          makersData.forEach((m: { id: string; business_name: string }) => {
            if (m.id && m.business_name) {
              makerNameMap[m.id] = m.business_name;
            }
          });
        }
      }

      // 3. Récupération des titres des articles non-nuls via requête séparée
      const articleIds = Array.from(
        new Set(
          fetchedQuotes
            .map((q) => q.maker_article_id)
            .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        )
      );
      let articleTitleMap: Record<string, string> = {};

      if (articleIds.length > 0) {
        const { data: articlesData, error: articlesErr } = await (supabaseClient
          .from('maker_articles' as any) as any)
          .select('id, title')
          .in('id', articleIds);

        if (!articlesErr && articlesData) {
          articlesData.forEach((a: { id: string; title: string }) => {
            if (a.id && a.title) {
              articleTitleMap[a.id] = a.title;
            }
          });
        }
      }

      // 4. Assemblage des données côté client
      const quotesWithDetails = fetchedQuotes.map((q) => {
        let articleTitle: string | null = null;
        if (q.maker_article_id) {
          articleTitle = articleTitleMap[q.maker_article_id] || 'Article du catalogue (supprimé)';
        }

        return {
          ...q,
          maker_name: makerNameMap[q.maker_id] || 'Atelier inconnu',
          article_title: articleTitle
        };
      });

      setQuotes(quotesWithDetails);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur lors de la récupération des devis client:', errorObj);
      setError(errorObj.message || 'Impossible de charger vos demandes de devis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientQuotes();
  }, []);

  const handleDownloadFile = async (requestId: string, filePath: string) => {
    setDownloadLoadingId(requestId);
    try {
      const { data, error: urlError } = await supabaseClient.storage
        .from('devis-fichiers-3d')
        .createSignedUrl(filePath, 60);

      if (urlError) {
        throw urlError;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        throw new Error("Impossible d'obtenir le lien de téléchargement.");
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur téléchargement fichier 3D client:', errorObj);
      setToastMsg({
        type: 'info',
        message: `Erreur de téléchargement : ${errorObj.message || 'Lien introuvable'}`
      });
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const renderStatusBadge = (status: ClientQuoteRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>En attente</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acceptée</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/80">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Refusée</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <PackageCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Terminée</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/client"
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Espace Client</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Mes Demandes de Devis</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Suivez l'avancement de vos demandes de devis et projets 3D envoyés aux ateliers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/makers"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Trouver un atelier</span>
          </Link>

          <button
            onClick={fetchClientQuotes}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Toast message */}
      {toastMsg && (
        <div className="p-4 rounded-xl border bg-blue-950/80 border-blue-800 text-blue-200 flex items-center justify-between text-xs font-medium shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
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

      {/* Erreur globale */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Chargement de vos demandes de devis...</p>
        </div>
      )}

      {/* Liste vide */}
      {!loading && !error && quotes.length === 0 && (
        <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-300">
              Vous n'avez pas encore fait de demande de devis.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Parcourez les ateliers certifiés pour envoyer votre projet sur mesure ou commander un article du catalogue.
            </p>
          </div>
          <Link
            to="/makers"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Parcourir les makers</span>
          </Link>
        </div>
      )}

      {/* Liste des demandes du client */}
      {!loading && !error && quotes.length > 0 && (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const isDownloadLoading = downloadLoadingId === quote.id;

            return (
              <div
                key={quote.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700/80 transition-all"
              >
                {/* En-tête : Nom de l'atelier, Date & Statut */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                      <Link
                        to={`/makers/${quote.maker_id}`}
                        className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>{quote.maker_name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(quote.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(quote.status)}</div>
                </div>

                {/* Article concerné (si lié à un article du catalogue) */}
                {quote.maker_article_id && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Devis pour l'article : <strong className="text-white font-semibold">{quote.article_title || 'Article du catalogue (supprimé)'}</strong>
                      </span>
                    </span>
                  </div>
                )}

                {/* Contenu : Message envoyé par le client */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                    Mon message envoyé
                  </span>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/60 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {quote.message ? (
                      quote.message
                    ) : (
                      <span className="italic text-slate-500">Aucun message</span>
                    )}
                  </div>
                </div>

                {/* Fichier 3D joint */}
                {quote.file_path && (
                  <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Paperclip className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                        {quote.file_path.split('/').pop() || 'Fichier 3D'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadFile(quote.id, quote.file_path!)}
                      disabled={isDownloadLoading}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700/80 rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isDownloadLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{isDownloadLoading ? 'Génération du lien...' : 'Télécharger mon fichier 3D'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
