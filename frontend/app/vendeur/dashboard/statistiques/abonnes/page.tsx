'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerStatGrid, PeriodSelector, notifySoon } from '../../_components/ui';

export default function Page() {
  const [period, setPeriod] = useState('30 jours');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Abonnés" description="Pilotage de votre performance." action={
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Comparer')}>Comparer</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Télécharger le rapport')}>Télécharger le rapport</SellerActionButton>
        </SellerHeaderActions>
      } />
      <PeriodSelector value={period} onChange={setPeriod} />
      <SellerStatGrid items={[{ label: 'Abonnés', value: '1 284' },
        { label: 'Nouveaux', value: '—' },
        { label: 'Désabonnements', value: '—' },
        { label: 'Croissance', value: '—' }]} />
      <SellerCard title="Abonnés">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon("Voir les abonnés")}>Voir les abonnés</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/marketing/campagnes">Créer une campagne</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/marketing/coupons">Envoyer une offre</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon("Voir l’évolution")}>Voir l’évolution</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
