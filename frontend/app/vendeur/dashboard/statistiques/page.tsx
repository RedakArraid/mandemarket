'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerStatGrid, PeriodSelector, notifySoon } from '../_components/ui';

export default function Page() {
  const [period, setPeriod] = useState('30 jours');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Ventes" description="Pilotage de votre performance." action={
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Comparer')}>Comparer</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Télécharger le rapport')}>Télécharger le rapport</SellerActionButton>
        </SellerHeaderActions>
      } />
      <PeriodSelector value={period} onChange={setPeriod} />
      <SellerStatGrid items={[{ label: 'CA', value: '—' },
        { label: 'Commandes', value: '—' },
        { label: 'Panier moyen', value: '—' },
        { label: 'Articles vendus', value: '—' },
        { label: 'Taux de conversion', value: '—' }]} />
      <SellerCard title="Ventes">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" href="/vendeur/dashboard/statistiques/produits">Voir par produit</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon("Voir par période")}>Voir par période</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon("Exporter")}>Exporter</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
