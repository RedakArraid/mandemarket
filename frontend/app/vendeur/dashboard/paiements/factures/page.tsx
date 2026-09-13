'use client';

import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

export default function FacturesPage() {
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Factures" description="Documents de facturation MandinMarket." action={
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Télécharger toutes')}>Télécharger toutes</SellerActionButton>
        </SellerHeaderActions>
      } />
      <SellerCard>
        {['FAC-2026-001','FAC-2026-002'].map(id => (
          <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
            <p className="font-semibold">{id}</p>
            <RowActions>
              <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Voir')}>Voir</SellerActionButton>
              <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Télécharger PDF')}>Télécharger PDF</SellerActionButton>
              <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Imprimer')}>Imprimer</SellerActionButton>
            </RowActions>
          </div>
        ))}
      </SellerCard>
    </div>
  );
}
