/**
 * @file src/routes/admin/AdminPage.tsx
 * @description Espace Administration P2Print.
 * Affiche l'interface de modération et validation des profils Makers.
 */

import React from 'react';
import MakerValidationPage from './MakerValidationPage';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <MakerValidationPage />
    </div>
  );
}

