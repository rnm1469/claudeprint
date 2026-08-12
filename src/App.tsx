/**
 * @file src/App.tsx
 * @description Composant racine pour P2Print Marketplace (Vite + React SPA).
 * Contient la disposition globale (Navbar) et la déclaration des routes avec protection par rôle.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './routes/auth/LoginPage';
import SignupPage from './routes/auth/SignupPage';
import ClientPage from './routes/client/ClientPage';
import BecomeMakerPage from './routes/client/BecomeMakerPage';
import MakersDiscoveryPage from './routes/client/MakersDiscoveryPage';
import MakerProfilePage from './routes/client/MakerProfilePage';
import MakerPage from './routes/maker/MakerPage';
import MakerArticlesPage from './routes/maker/MakerArticlesPage';
import MakerQuoteRequestsPage from './routes/maker/MakerQuoteRequestsPage';
import AdminPage from './routes/admin/AdminPage';
import MakerValidationPage from './routes/admin/MakerValidationPage';
import DatabasePage from './routes/db/DatabasePage';
import StructurePage from './routes/structure/StructurePage';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Routes d'authentification (redirection si déjà connecté) */}
            <Route
              path="/login"
              element={
                <ProtectedRoute guestOnly>
                  <LoginPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <ProtectedRoute guestOnly>
                  <SignupPage />
                </ProtectedRoute>
              }
            />

            {/* Espace Client (accessible par 'client' et 'admin') */}
            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRoles={['client', 'admin']}>
                  <ClientPage />
                </ProtectedRoute>
              }
            />

            {/* Découverte des Makers (accessible à tout utilisateur connecté) */}
            <Route
              path="/makers"
              element={
                <ProtectedRoute allowedRoles={['client', 'maker', 'admin']}>
                  <MakersDiscoveryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/makers/:id"
              element={
                <ProtectedRoute allowedRoles={['client', 'maker', 'admin']}>
                  <MakerProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Parcours Devenir Maker (réservé aux 'client') */}
            <Route
              path="/client/devenir-maker"
              element={
                <ProtectedRoute allowedRoles={['client']}>
                  <BecomeMakerPage />
                </ProtectedRoute>
              }
            />

            {/* Espace Maker (accessible par 'maker' et 'admin') */}
            <Route
              path="/maker"
              element={
                <ProtectedRoute allowedRoles={['maker', 'admin']}>
                  <MakerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maker/articles"
              element={
                <ProtectedRoute allowedRoles={['maker', 'admin']}>
                  <MakerArticlesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maker/devis"
              element={
                <ProtectedRoute allowedRoles={['maker', 'admin']}>
                  <MakerQuoteRequestsPage />
                </ProtectedRoute>
              }
            />

            {/* Espace Administration (accessible uniquement par 'admin') */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/makers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MakerValidationPage />
                </ProtectedRoute>
              }
            />

            {/* Outils Système (accessible uniquement par 'admin') */}
            <Route
              path="/db"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DatabasePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/structure"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StructurePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        P2Print Marketplace • Protection des Routes par Rôle (Client • Maker • Admin)
      </footer>
    </div>
  );
}
