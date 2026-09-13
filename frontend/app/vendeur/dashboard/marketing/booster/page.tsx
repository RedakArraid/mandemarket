'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard, SellerHeaderActions, RowActions, notifySoon } from '../../_components/ui';

export default function BoosterPage() {
  const [mode, setMode] = useState<'produit' | 'boutique'>('produit');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Booster ma boutique" description="Augmentez la visibilité de vos produits ou de votre boutique." />
      <div className="grid md:grid-cols-2 gap-4">
        <button type="button" onClick={() => setMode('produit')} className={`text-left p-5 rounded-xl border ${mode==='produit'?'border-brand-orange bg-brand-soft':'border-gray-200 bg-white'}`}>
          <p className="font-bold text-brand-navy">Booster un produit</p>
          <p className="text-sm text-gray-500 mt-1">Accueil, recherche, recommandations, Bons Plans</p>
        </button>
        <button type="button" onClick={() => setMode('boutique')} className={`text-left p-5 rounded-xl border ${mode==='boutique'?'border-brand-orange bg-brand-soft':'border-gray-200 bg-white'}`}>
          <p className="font-bold text-brand-navy">Booster la boutique</p>
          <p className="text-sm text-gray-500 mt-1">Boutiques recommandées, accueil, top boutiques</p>
        </button>
      </div>
      <SellerCard title={mode === 'produit' ? 'Configurer le boost produit' : 'Configurer le boost boutique'}>
        <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
          {mode==='produit' ? <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Choisir un produit" /> : <input className="w-full px-3 py-2 border rounded-lg text-sm" value="Ma boutique" readOnly />}
          <select className="w-full px-3 py-2 border rounded-lg text-sm">
            {mode==='produit' ? (<>
              <option>Accueil</option><option>Résultats de recherche</option><option>Produits recommandés</option><option>Bons Plans</option>
            </>) : (<>
              <option>Boutiques recommandées</option><option>Page d’accueil</option><option>Top boutiques</option><option>Résultats de recherche</option>
            </>)}
          </select>
          <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Durée (jours)" />
          <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Budget (FCFA)" defaultValue="10000" />
          <input className="md:col-span-2 w-full px-3 py-2 border rounded-lg text-sm" placeholder="Audience" />
        </div>
        <div className="mt-4 p-4 rounded-xl bg-brand-cream">
          <p className="text-sm font-semibold text-brand-navy">Estimation</p>
          <p className="text-sm text-gray-600 mt-1">Budget : 10 000 FCFA</p>
          <p className="text-sm text-gray-600">Portée estimée : 5 000 – 8 000 personnes</p>
          <div className="mt-2">
            <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Voir l’estimation')}>Voir l’estimation</SellerActionButton>
          </div>
        </div>
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Prévisualiser')}>Prévisualiser</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Enregistrer')}>Enregistrer</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Payer et lancer')}>Payer et lancer</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
      <SellerCard title="Boosts existants">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div><p className="font-semibold">Boost boutique — Accueil</p><p className="text-xs text-gray-500">En cours</p></div>
          <RowActions>
            <SellerActionButton size="sm" variant="secondary" href="/vendeur/dashboard/statistiques/marketing">Voir les performances</SellerActionButton>
            <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Prolonger')}>Prolonger</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Augmenter le budget')}>Augmenter le budget</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Suspendre')}>Suspendre</SellerActionButton>
            <SellerActionButton size="sm" variant="danger" onClick={() => notifySoon('Arrêter')}>Arrêter</SellerActionButton>
          </RowActions>
        </div>
      </SellerCard>
    </div>
  );
}
