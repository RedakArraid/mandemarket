'use client';

import { useState, useEffect } from 'react';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import {
  SellerPageHeader,
  SellerActionButton,
  SellerCard,
  SellerEmptyState,
} from '../../_components/ui';
import { ArrowDownTrayIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

function fmtDate(dStr: string) {
  if (!dStr) return '—';
  return new Date(dStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function FacturesPage() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    SellerService.getMyPayouts()
      .then((res) => {
        const list = res?.payouts || res || [];
        setPayouts(list.filter((p: any) => p.status === 'completed'));
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = async () => {
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

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Factures & Justificatifs"
        description="Reçus officiels de versements et relevés de commission MandeMarket."
        action={
          <SellerActionButton
            variant="primary"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            <span className="flex items-center gap-1.5">
              <ArrowDownTrayIcon className="w-4 h-4" />
              {exporting ? 'Téléchargement...' : 'Télécharger le relevé comptable (CSV)'}
            </span>
          </SellerActionButton>
        }
      />

      <SellerCard title="Justificatifs de versements effectués">
        {payouts.length === 0 ? (
          <SellerEmptyState message="Aucun versement complété pour le moment. Les reçus apparaîtront ici dès que vos retraits seront validés." />
        ) : (
          <div className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <DocumentCheckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Reçu de versement #{p.reference || p.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Émis le {fmtDate(p.processedAt || p.createdAt)} · Montant : {fmt(p.amount)} · {p.method?.replace('_', ' ') || 'Mobile Money'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Acquitté
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
