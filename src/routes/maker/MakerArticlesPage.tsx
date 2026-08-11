/**
 * @file src/routes/maker/MakerArticlesPage.tsx
 * @description Page de gestion du catalogue d'articles pour le Maker.
 * Permet de créer, modifier, supprimer et activer/désactiver les articles (figurines, pièces, etc.).
 * Supporte l'upload et l'affichage de la photo d'un article dans Supabase Storage.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  ArrowLeft,
  X,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Coins,
  Upload,
  Camera
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';
import { useUserRole } from '../../hooks/useUserRole';
import type { MakerArticle } from '../../lib/types';

export default function MakerArticlesPage() {
  const { user } = useUserRole();

  const [articles, setArticles] = useState<MakerArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de création / édition
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingArticle, setEditingArticle] = useState<MakerArticle | null>(null);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isActiveForm, setIsActiveForm] = useState<boolean>(true);

  // Fichier photo sélectionné et aperçu
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Supprimer modal / state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchArticles = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await (supabaseClient
        .from('maker_articles' as any) as any)
        .select('*')
        .eq('maker_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setArticles((data as MakerArticle[]) || []);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur lors du chargement des articles:', errorObj);
      setError(errorObj.message || 'Impossible de charger la liste de vos articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setIsActiveForm(true);
    setSelectedFile(null);
    setImagePreview(null);
    setEditingArticle(null);
    setFormError(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (article: MakerArticle) => {
    setEditingArticle(article);
    setTitle(article.title);
    setDescription(article.description || '');
    setPrice(String(article.price));
    setIsActiveForm(article.is_active);
    setSelectedFile(null);
    setImagePreview(article.photo_url || null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP...).');
      return;
    }

    // Limite de taille max : 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      setFormError('La taille de la photo ne doit pas dépasser 5 Mo.');
      return;
    }

    setFormError(null);
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormError(null);

    // Validation
    if (!title.trim()) {
      setFormError('Le titre de l\'article est obligatoire.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Le prix doit être un nombre supérieur à 0.');
      return;
    }

    setSubmitting(true);

    try {
      let photoUrlToSave: string | null = imagePreview;

      // Récupération directe de l'utilisateur authentifié depuis la session Supabase
      const { data: authData } = await supabaseClient.auth.getUser();
      const currentUserId = authData?.user?.id || user.id;

      // Upload de la photo vers Supabase Storage si un nouveau fichier est sélectionné
      if (selectedFile) {
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        // Le chemin DOIT impérativement commencer par l'UUID de l'utilisateur maker connecté ({currentUserId}) pour satisfaire la policy RLS
        const filePath = `${currentUserId}/${Date.now()}-${cleanFileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('maker-articles-photos')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erreur Supabase Storage upload:', uploadError);
          if (uploadError.message?.includes('row-level security')) {
            throw new Error(`Erreur RLS Storage : Veuillez exécuter la migration SQL dans Supabase (supabase/migrations/20260809_add_photo_url_to_maker_articles.sql) pour autoriser le bucket "maker-articles-photos".`);
          }
          throw new Error(`Erreur lors de l'envoi de la photo : ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabaseClient.storage
          .from('maker-articles-photos')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          photoUrlToSave = publicUrlData.publicUrl;
        }
      }

      if (editingArticle) {
        // Modification
        const { error: updateError } = await (supabaseClient
          .from('maker_articles' as any) as any)
          .update({
            title: title.trim(),
            description: description.trim() || null,
            price: numPrice,
            is_active: isActiveForm,
            photo_url: photoUrlToSave,
          })
          .eq('id', editingArticle.id)
          .eq('maker_id', user.id);

        if (updateError) throw updateError;

        setArticles((prev) =>
          prev.map((a) =>
            a.id === editingArticle.id
              ? {
                  ...a,
                  title: title.trim(),
                  description: description.trim() || null,
                  price: numPrice,
                  is_active: isActiveForm,
                  photo_url: photoUrlToSave,
                }
              : a
          )
        );

        setToastMsg({ type: 'success', message: 'Article mis à jour avec succès.' });
      } else {
        // Création
        const { data, error: insertError } = await (supabaseClient
          .from('maker_articles' as any) as any)
          .insert({
            maker_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            price: numPrice,
            is_active: isActiveForm,
            photo_url: photoUrlToSave,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          setArticles((prev) => [data as MakerArticle, ...prev]);
        }

        setToastMsg({ type: 'success', message: 'Nouvel article ajouté au catalogue.' });
      }

      resetForm();

      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur lors de l\'enregistrement de l\'article:', errorObj);
      setFormError(errorObj.message || 'Échec de l\'enregistrement de l\'article.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (article: MakerArticle) => {
    if (!user) return;
    setActionLoadingId(article.id);

    try {
      const newStatus = !article.is_active;
      const { error: updateError } = await (supabaseClient
        .from('maker_articles' as any) as any)
        .update({ is_active: newStatus })
        .eq('id', article.id)
        .eq('maker_id', user.id);

      if (updateError) throw updateError;

      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, is_active: newStatus } : a))
      );

      setToastMsg({
        type: 'info',
        message: newStatus
          ? `L'article "${article.title}" est maintenant actif.`
          : `L'article "${article.title}" a été désactivé.`,
      });

      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur toggle actif:', errorObj);
      setError(errorObj.message || 'Impossible de modifier la visibilité de l\'article.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setActionLoadingId(id);

    try {
      const { error: deleteError } = await (supabaseClient
        .from('maker_articles' as any) as any)
        .delete()
        .eq('id', id)
        .eq('maker_id', user.id);

      if (deleteError) throw deleteError;

      setArticles((prev) => prev.filter((a) => a.id !== id));
      setDeletingId(null);

      setToastMsg({ type: 'info', message: 'Article supprimé du catalogue.' });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur suppression article:', errorObj);
      setError(errorObj.message || 'Impossible de supprimer l\'article.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
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
            <Package className="w-6 h-6 text-emerald-400" />
            <span>Catalogue d'Articles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos objets et pièces 3D prêts à vendre (figurines, pièces de rechange, décorations...).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchArticles}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Rafraîchir</span>
          </button>

          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Message de Toast */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
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
            className="text-slate-400 hover:text-white text-xs font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message d'erreur global */}
      {error && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modal / Section Formulaire Création & Édition */}
      {isFormOpen && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-xl relative animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>{editingArticle ? 'Modifier l\'article' : 'Ajouter un article au catalogue'}</span>
            </h3>
            <button
              onClick={resetForm}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Titre */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-semibold text-slate-300">
                  Titre de l'article <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Figurine Dragon Articulé 20cm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              {/* Prix */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-xs font-semibold text-slate-300">
                  Prix (€) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Coins className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="15.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Description</label>
              <textarea
                rows={3}
                placeholder="Décrivez l'article (matériau, dimensions, finitions...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Champ Photo d'illustration (Storage Supabase) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Photo d'illustration <span className="text-slate-500 font-normal">(optionnel)</span></span>
                <span className="text-[10px] text-slate-500 font-mono">Max 5 Mo (JPG, PNG, WebP)</span>
              </label>

              {imagePreview ? (
                <div className="relative w-full max-w-xs h-40 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 group">
                  <img
                    src={imagePreview}
                    alt="Aperçu article"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Changer</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-rose-800/80 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/50 hover:bg-slate-950 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-slate-800/80 group-hover:bg-emerald-950/80 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mb-2 transition-colors">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-300">
                    Cliquez pour ajouter une photo
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Stockée de manière sécurisée dans votre espace Storage Supabase
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Toggle Visibilité */}
            <div className="flex items-center justify-between pt-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActiveForm}
                  onChange={(e) => setIsActiveForm(e.target.checked)}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => setIsActiveForm(!isActiveForm)}
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                >
                  {isActiveForm ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                  <span className={isActiveForm ? 'text-emerald-300' : 'text-slate-400'}>
                    {isActiveForm ? 'Article actif (visible)' : 'Article inactif (masqué)'}
                  </span>
                </button>
              </label>

              {/* Boutons formulaire */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingArticle ? 'Enregistrer' : 'Créer l\'article'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Chargement global */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Chargement de votre catalogue d'articles...</p>
        </div>
      )}

      {/* Liste d'articles vide */}
      {!loading && !error && articles.length === 0 && !isFormOpen && (
        <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-300">Aucun article dans votre catalogue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Ajoutez vos pièces 3D prédéfinies ou figurines pour les proposer à vos futurs clients.
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer votre premier article</span>
          </button>
        </div>
      )}

      {/* Grille / Liste des Articles */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => {
            const isLoadingThis = actionLoadingId === article.id;
            const isDeletingThis = deletingId === article.id;

            return (
              <div
                key={article.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all ${
                  article.is_active
                    ? 'border-slate-800 hover:border-emerald-500/50'
                    : 'border-slate-800/60 opacity-70 bg-slate-950/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Photo de l'article si elle existe */}
                  {article.photo_url ? (
                    <div className="w-full h-44 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative group/img">
                      <img
                        src={article.photo_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : null}

                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {!article.photo_url && (
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                          article.is_active 
                            ? 'bg-slate-800 border-slate-700 text-emerald-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}>
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm leading-snug line-clamp-1">
                          {article.title}
                        </h3>
                        <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          {article.price.toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    {/* Badge de statut */}
                    <button
                      onClick={() => handleToggleActive(article)}
                      disabled={isLoadingThis}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border cursor-pointer transition-all ${
                        article.is_active
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700/80'
                      }`}
                      title="Cliquer pour changer la visibilité"
                    >
                      {isLoadingThis ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : article.is_active ? (
                        <>
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>Actif</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 text-slate-500" />
                          <span>Inactif</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Description */}
                  {article.description ? (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 line-clamp-3 leading-relaxed">
                      {article.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/40">
                      Pas de description.
                    </p>
                  )}
                </div>

                {/* Actions : Editer / Supprimer */}
                {isDeletingThis ? (
                  <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl space-y-2">
                    <p className="text-[11px] text-red-200 font-medium">Confirmer la suppression ?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(article.id)}
                        disabled={isLoadingThis}
                        className="flex-1 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {isLoadingThis ? '...' : 'Oui, supprimer'}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(article.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditForm(article)}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                        title="Modifier l'article"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingId(article.id)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer l'article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
