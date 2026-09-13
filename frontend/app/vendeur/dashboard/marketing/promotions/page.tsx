'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerEmptyState, RowActions, notifySoon } from '../../_components/ui';

const DEMO = [
  { id: 1, name: '-20% High-Tech', status: 'Active' },
  { id: 2, name: 'Vente flash week-end', status: 'Programmée' },
];

export default function PromotionsPage() {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Promotions" description="Réductions temporaires sur vos produits." action={
        <SellerActionButton variant="primary" onClick={() => setShowForm(true)}>+ Créer une promotion</SellerActionButton>
      } />
      {showForm && (
        <SellerCard title="Nouvelle promotion" action={<SellerActionButton size="sm" variant="ghost" onClick={() => setShowForm(false)}>Fermer</SellerActionButton>}>
          <form className="grid md:grid-cols-2 gap-3 max-w-3xl" onSubmit={(e) => { e.preventDefault(); notifySoon('Créer la promotion'); setShowForm(false); }}>
            <input required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Produit concerné" />
            <input required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Réduction (%)" />
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="md:col-span-2"><SellerActionButton type="submit" variant="primary">Créer</SellerActionButton></div>
          </form>
        </SellerCard>
      )}
      <SellerCard>
        {DEMO.map(p => (
          <div key={p.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-50 py-3 last:border-0">
            <div><p className="font-semibold text-brand-navy">{p.name}</p><p className="text-xs text-gray-500">{p.status}</p></div>
            <RowActions>
              <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Modifier')}>Modifier</SellerActionButton>
              <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Suspendre')}>Suspendre</SellerActionButton>
              <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Terminer')}>Terminer</SellerActionButton>
              <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Dupliquer')}>Dupliquer</SellerActionButton>
              <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/statistiques/marketing">Voir les résultats</SellerActionButton>
            </RowActions>
          </div>
        ))}
      </SellerCard>
    </div>
  );
}
