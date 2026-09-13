'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, FilterChips, RowActions, notifySoon } from '../../_components/ui';

const FILTERS = ['Toutes', 'Ventes', 'Remboursements', 'Commissions', 'Retraits'];
const ROWS = [
  { id: 'TX-001', type: 'Vente', amount: '+25 000 FCFA' },
  { id: 'TX-002', type: 'Commission', amount: '-2 500 FCFA' },
];

export default function TransactionsPage() {
  const [f, setF] = useState('Toutes');
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Transactions" description="Historique détaillé de vos mouvements." action={
        <SellerActionButton variant="outline" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
      } />
      <FilterChips options={FILTERS} value={f} onChange={setF} />
      <SellerCard>
        <div className="space-y-3">
          {ROWS.map(r => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100 rounded-xl p-4">
              <div><p className="font-semibold">{r.id}</p><p className="text-sm text-gray-500">{r.type} · {r.amount}</p></div>
              <RowActions>
                <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Détails')}>Voir les détails</SellerActionButton>
                <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Télécharger le reçu')}>Télécharger le reçu</SellerActionButton>
              </RowActions>
            </div>
          ))}
        </div>
      </SellerCard>
    </div>
  );
}
