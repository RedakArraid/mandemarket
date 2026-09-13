'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerStatGrid, PeriodSelector, notifySoon } from '../../_components/ui';

export default function Page() {
  const [period, setPeriod] = useState('30 jours');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Produits" description="Pilotage de votre performance." action={
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Comparer')}>Comparer</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Télécharger le rapport')}>Télécharger le rapport</SellerActionButton>
        </SellerHeaderActions>
      } />
      <PeriodSelector value={period} onChange={setPeriod} />
      <SellerStatGrid items={[{ label: 'Plus vendus', value: '—' },
        { label: 'Plus consultés', value: '—' },
        { label: 'Ajoutés au panier', value: '—' },
        { label: 'Sans vente', value: '—' }]} />
      <SellerCard title="Produits">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" href="/vendeur/dashboard/produits">Voir</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/produits">Modifier</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/marketing/booster">Booster</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/marketing/promotions">Créer une promotion</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
