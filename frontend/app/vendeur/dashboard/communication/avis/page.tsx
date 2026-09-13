'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard, FilterChips, RowActions, notifySoon } from '../../_components/ui';

const FILTERS = ['Tous', '5 étoiles', '4 étoiles', '3 étoiles et moins', 'Sans réponse'];

export default function AvisPage() {
  const [f, setF] = useState('Tous');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Avis clients" description="Répondez aux retours de vos clients." />
      <FilterChips options={FILTERS} value={f} onChange={setF} />
      <SellerCard>
        <div className="space-y-3">
          {[{n:'Fatou',s:5,t:'Excellent produit'},{n:'Ibrahim',s:3,t:'Livraison lente'}].map((a,i)=>(
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <p className="font-semibold">{a.n} · {'★'.repeat(a.s)}</p>
              <p className="text-sm text-gray-600 mb-3">{a.t}</p>
              <RowActions>
                <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Répondre')}>Répondre</SellerActionButton>
                <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Signaler')}>Signaler</SellerActionButton>
                <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/produits">Voir le produit</SellerActionButton>
              </RowActions>
            </div>
          ))}
        </div>
      </SellerCard>
    </div>
  );
}
