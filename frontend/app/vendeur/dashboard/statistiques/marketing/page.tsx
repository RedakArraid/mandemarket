'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerStatGrid, PeriodSelector, notifySoon } from '../../_components/ui';

export default function Page() {
  const [period, setPeriod] = useState('30 jours');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Marketing" description="Pilotage de votre performance." action={
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Comparer')}>Comparer</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Télécharger le rapport')}>Télécharger le rapport</SellerActionButton>
        </SellerHeaderActions>
      } />
      <PeriodSelector value={period} onChange={setPeriod} />
      <SellerStatGrid items={[{ label: 'Coupons', value: '—' },
        { label: 'Promotions', value: '—' },
        { label: 'Campagnes', value: '—' },
        { label: 'Boosts', value: '—' }]} />
      <SellerCard title="Marketing">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" href="/vendeur/dashboard/marketing/campagnes">Voir la campagne</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/marketing/coupons">Voir le coupon</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/marketing/booster">Voir le boost</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon("Relancer")}>Relancer</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
