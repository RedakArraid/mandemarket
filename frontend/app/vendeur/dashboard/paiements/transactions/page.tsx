'use client';

import { useState, useEffect, useCallback } from 'react';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import {
  SellerPageHeader,
  SellerActionButton,
  SellerCard,
  FilterChips,
  SellerEmptyState,
} from '../../_components/ui';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

function fmtDate(dStr: string) {
  if (!dStr) return '—';
  return new Date(dStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const FILTERS = ['Toutes', 'Ventes', 'Remboursements', 'Retraits'];

const TYPE_CONFIG: Record<string, { label: string; cls: string; category: string }> = {
  SALE_PENDING: { label: 'Vente en attente', cls: 'bg-amber-100 text-amber-800', category: 'Ventes' },
  SALE_AVAILABLE: { label: 'Vente disponible', cls: 'bg-emerald-100 text-emerald-800', category: 'Ventes' },
  REFUND: { label: 'Remboursement', cls: 'bg-rose-100 text-rose-800', category: 'Remboursements' },
  PAYOUT_RESERVED: { label: 'Retrait réservé', cls: 'bg-indigo-100 text-indigo-800', category: 'Retraits' },
  PAYOUT_COMPLETED: { label: 'Retrait versé', cls: 'bg-blue-100 text-blue-800', category: 'Retraits' },
  PAYOUT_RELEASED: { label: 'Retrait annulé/libéré', cls: 'bg-amber-100 text-amber-800', category: 'Retraits' },
  ADJUSTMENT: { label: 'Ajustement', cls: 'bg-purple-100 text-purple-800', category: 'Toutes' },
};

export default function TransactionsPage() {
  const [filter, setFilter] = useState('Toutes');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await SellerService.getMyLedger(1, 50);
      setEntries(res?.entries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await SellerService.downloadLedgerCsv();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’export CSV');
    } finally {
      setExporting(false);
    }
  };

  const filtered = entries.filter((e) => {
    if (filter === 'Toutes') return true;
    const cat = TYPE_CONFIG[e.type]?.category;
    return cat === filter;
  });

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Journal des Transactions"
        description="Traçabilité complète et certifiée de l'ensemble de vos mouvements comptables."
        action={
          <SellerActionButton
            variant="outline"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <span className="flex items-center gap-1.5">
              <ArrowDownTrayIcon className="w-4 h-4" />
              {exporting ? 'Téléchargement...' : 'Exporter CSV'}
            </span>
          </SellerActionButton>
        }
      />

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <SellerCard>
        {filtered.length === 0 ? (
          <SellerEmptyState message={`Aucune transaction trouvée pour le filtre « ${filter} ».`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left">
              <thead className="bg-gray-50/75">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Libellé / Référence</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Brut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Vendeur</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((item) => {
                  const cfg = TYPE_CONFIG[item.type] || { label: item.type, cls: 'bg-gray-100 text-gray-700' };
                  const isNegative = item.type === 'REFUND' || item.type.startsWith('PAYOUT_');
                  const ref = item.order?.orderNumber ? `Commande #${item.order.orderNumber}` : item.payout?.reference ? `Retrait #${item.payout.reference}` : `Ref: ${item.id.slice(0, 8)}`;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(item.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm">{item.description || 'Écriture comptable'}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{ref}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-gray-700">
                        {fmt(item.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs text-rose-600">
                        {item.feeAmount ? `-${fmt(item.feeAmount)}` : '0 FCFA'}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-bold ${isNegative ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {isNegative ? `-${fmt(Math.abs(item.netAmount))}` : `+${fmt(item.netAmount)}`}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SellerCard>
    </div>
  );
}
