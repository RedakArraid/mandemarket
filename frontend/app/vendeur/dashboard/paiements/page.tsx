'use client';

import { useEffect, useState } from 'react';
import { SellerService } from '../../../config/api';
import { Spinner } from '../_components/sections';
import { SellerPageHeader, SellerActionButton, SellerCard, SellerStatGrid, SellerHeaderActions } from '../_components/ui';
import { ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

export default function SoldePage() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      SellerService.getMyEarnings(),
      SellerService.getMyBalance(),
    ]).then(([eRes, bRes]) => {
      if (eRes.status === 'fulfilled') setEarnings(eRes.value);
      if (bRes.status === 'fulfilled') setBalance(bRes.value?.balances);
      setLoading(false);
    });
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      await SellerService.downloadLedgerCsv();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du téléchargement');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const available = balance?.available ?? (earnings?.availableBalance ?? earnings?.totalEarnings ?? 0);
  const pending = balance?.pending ?? (earnings?.pendingPayoutAmount ?? 0);
  const reserved = balance?.reserved ?? 0;
  const paid = balance?.paid ?? 0;

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Trésorerie & Soldes"
        description="Suivi certifié en temps réel de vos revenus et de vos 4 soldes comptables."
        action={
          <div className="flex items-center gap-2">
            <SellerActionButton variant="outline" onClick={handleExport} disabled={exporting}>
              <span className="flex items-center gap-1.5">
                <ArrowDownTrayIcon className="w-4 h-4" />
                {exporting ? 'Export...' : 'Exporter le journal (CSV)'}
              </span>
            </SellerActionButton>
            <SellerActionButton href="/vendeur/dashboard/paiements/retraits" variant="primary">
              Demander un retrait
            </SellerActionButton>
          </div>
        }
      />

      {/* Explication délai de disponibilité */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" />
          <div className="text-xs sm:text-sm text-blue-900 leading-relaxed">
            <span className="font-semibold block mb-1">Règle de sécurité et disponibilité des fonds</span>
            Les fonds des commandes réglées par les acheteurs restent sous le statut <strong>« En attente de livraison »</strong>. Dès confirmation de la réception du colis par le client ou le livreur (statut <em>LIVRÉE</em>), votre part nette est immédiatement transférée vers votre <strong>« Solde disponible »</strong>.
          </div>
        </div>
      </div>

      <SellerStatGrid items={[
        { label: 'Solde disponible', value: fmt(available) },
        { label: 'En attente de livraison', value: fmt(pending) },
        { label: 'En cours de virement', value: fmt(reserved) },
        { label: 'Total déjà versé', value: fmt(paid) },
      ]} />

      <SellerCard title="Actions & Navigation rapide">
        <SellerHeaderActions>
          <SellerActionButton href="/vendeur/dashboard/paiements/retraits" variant="primary">
            Demander un retrait
          </SellerActionButton>
          <SellerActionButton href="/vendeur/dashboard/paiements/transactions" variant="secondary">
            Voir le journal des transactions
          </SellerActionButton>
          <SellerActionButton href="/vendeur/dashboard/paiements/factures" variant="outline">
            Factures & Reçus
          </SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
