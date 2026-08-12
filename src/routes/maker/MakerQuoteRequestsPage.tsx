/**
 * @file src/routes/maker/MakerQuoteRequestsPage.tsx
 * @description Page de gestion des demandes de devis reçues par un Maker.
 * Permet de consulter les messages et fichiers 3D joints, puis d'accepter, refuser ou terminer chaque demande.
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
  Check, 
  X, 
  PackageCheck,
  Mail,
  Calendar,
  Paperclip
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';

export interface QuoteRequest {
  id: string;
  client_id: string;
  maker_id: string;
  maker_article_id?: string | null;
  message?: string | null;
  file_path?: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  client_email?: string;
}

export default function MakerQuoteRequestsPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const fetchQuoteRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      const currentUser = authData?.user;

      if (!currentUser) {
        throw new Error("Vous devez être connecté en tant que Maker pour consulter vos devis.");
      }

      // Fetch quote requests for this maker
      const { data, error: fetchErr } = await (supabaseClient
        .from('quote_requests' as any) as any)
        .select('*')
        .eq('maker_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (fetchErr) {
        throw fetchErr;
      }

      const fetchedQuotes = (data as QuoteRequest[]) || [];

      // Extract unique client_ids to fetch client emails
      const clientIds = Array.from(new Set(fetchedQuotes.map((q) => q.client_id))).filter(Boolean);

      let clientEmailMap: Record<string, string> = {};

      if (clientIds.length > 0) {
        const { data: usersData, error: usersErr } = await (supabaseClient
          .from('users' as any) as any)
          .select('id, email')
          .in('id', clientIds);

        if (!usersErr && usersData) {
          usersData.forEach((u: { id: string; email: string }) => {
            if (u.id && u.email) {
              clientEmailMap[u.id] = u.email;
            }
          });
        }
      }

      // Attach client email to quotes
      const quotesWithEmail = fetchedQuotes.map((q) => ({
        ...q,
        client_email: clientEmailMap[q.client_id] || 'Client Inconnu'
      }));

      setQuotes(quotesWithEmail);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Erreur lors de la récupération des demandes de devis:", errorObj);
      setError(errorObj.message || "Impossible de charger vos demandes de devis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuoteRequests();
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
      console.error("Erreur téléchargement fichier 3D:", errorObj);
      setToastMsg({
        type: 'info',
        message: `Erreur de téléchargement : ${errorObj.message || 'Lien introuvable'}`
      });
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'accepted' | 'rejected' | 'completed') => {
    setActionLoadingId(requestId);

    try {
      const { error: updateErr } = await (supabaseClient
        .from('quote_requests' as any) as any)
        .update({ status: newStatus })
        .eq('id', requestId);

      if (updateErr) {
        throw updateErr;
      }

      setQuotes((prev) =>
        prev.map((q) => (q.id === requestId ? { ...q, status: newStatus } : q))
      );

      const statusLabels: Record<string, string> = {
        accepted: 'Demande de devis acceptée.',
        rejected: 'Demande de devis refusée.',
        completed: 'Demande marquée comme terminée.'
      };

      setToastMsg({
        type: 'success',
        message: statusLabels[newStatus] || 'Statut mis à jour.'
      });

      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error("Erreur mise à jour statut devis:", errorObj);
      setToastMsg({
        type: 'info',
        message: `Erreur : ${errorObj.message || 'Échec de la mise à jour'}`
      });
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status: QuoteRequest['status']) => {
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
              to="/maker"
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Espace Maker</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Demandes de Devis Reçues</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consultez les demandes personnalisées des clients, téléchargez leurs fichiers 3D et gérez leur avancement.
          </p>
        </div>

        <button
          onClick={fetchQuoteRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Rafraîchir</span>
        </button>
      </div>

      {/* Notification Toast */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-blue-950/80 border-blue-800 text-blue-200'
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
        <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">Aucune demande de devis pour le moment</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Dès qu'un client vous envoie un projet ou un fichier 3D depuis votre profil maker, il apparaîtra ici.
          </p>
        </div>
      )}

      {/* Liste des demandes de devis */}
      {!loading && !error && quotes.length > 0 && (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const isActionLoading = actionLoadingId === quote.id;
            const isDownloadLoading = downloadLoadingId === quote.id;

            return (
              <div
                key={quote.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700/80 transition-all"
              >
                {/* En-tête : Email client, Date & Statut */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-200 font-semibold">
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{quote.client_email}</span>
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

                {/* Contenu : Message du client */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                    Message du client
                  </span>
                  <div className="p-3 bg-slate-950/70 border border-slate-800/60 rounded-xl text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {quote.message ? (
                      quote.message
                    ) : (
                      <span className="italic text-slate-500">Aucun message</span>
                    )}
                  </div>
                </div>

                {/* Pièce jointe / Fichier 3D */}
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
                      <span>{isDownloadLoading ? 'Génération du lien...' : 'Télécharger le fichier 3D'}</span>
                    </button>
                  </div>
                )}

                {/* Actions du Maker selon le statut */}
                <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800/60">
                  {quote.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(quote.id, 'rejected')}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>Refuser</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(quote.id, 'accepted')}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Accepter</span>
                      </button>
                    </>
                  )}

                  {quote.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(quote.id, 'completed')}
                      disabled={isActionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isActionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span>Marquer comme terminé</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
