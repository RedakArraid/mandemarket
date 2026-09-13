'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerStatGrid, PeriodSelector, notifySoon } from '../../_components/ui';

export default function Page() {
  const [period, setPeriod] = useState('30 jours');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Visiteurs" description="Pilotage de votre performance." action={
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Comparer')}>Comparer</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Télécharger le rapport')}>Télécharger le rapport</SellerActionButton>
        </SellerHeaderActions>
      } />
      <PeriodSelector value={period} onChange={setPeriod} />
      <SellerStatGrid items={[{ label: 'Visiteurs', value: '—' },
        { label: 'Pages vues', value: '—' },
        { label: 'Visiteurs uniques', value: '—' },
        { label: 'Sources du trafic', value: '—' }]} />
      <SellerCard title="Visiteurs">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon("Voir les sources")}>Voir les sources</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon("Voir les pages populaires")}>Voir les pages populaires</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon("Comparer")}>Comparer</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
