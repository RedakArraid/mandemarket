'use client';

import { useEffect, useState } from 'react';
import { SellerService } from '../../../config/api';
import { Spinner } from '../_components/sections';
import { SellerPageHeader, SellerActionButton, SellerCard, SellerStatGrid, SellerHeaderActions } from '../_components/ui';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

export default function SoldePage() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  useEffect(() => {
    SellerService.getMyEarnings().then(setEarnings).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Solde" description="Votre trésorerie vendeur MandinMarket." action={
        <SellerActionButton href="/vendeur/dashboard/paiements/retraits" variant="primary">Demander un retrait</SellerActionButton>
      } />
      <SellerStatGrid items={[
        { label: 'Solde disponible', value: fmt(earnings?.availableBalance ?? earnings?.totalEarnings ?? 0) },
        { label: 'En attente', value: fmt(earnings?.pendingPayoutAmount ?? 0) },
        { label: 'Total des ventes', value: fmt(earnings?.totalSales ?? 0) },
        { label: 'Commission MandinMarket', value: `${earnings?.commissionRate ?? 0}%` },
      ]} />
      <SellerCard title="Actions">
        <SellerHeaderActions>
          <SellerActionButton href="/vendeur/dashboard/paiements/retraits" variant="primary">Demander un retrait</SellerActionButton>
          <SellerActionButton href="/vendeur/dashboard/paiements/transactions" variant="secondary">Voir les transactions</SellerActionButton>
          <SellerActionButton href="/vendeur/dashboard/paiements/factures" variant="outline">Factures</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
