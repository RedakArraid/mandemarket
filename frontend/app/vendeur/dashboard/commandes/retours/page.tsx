'use client';

import { useEffect, useState } from 'react';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerEmptyState, RowActions, notifySoon } from '../../_components/ui';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

const PRESET = 'REFUNDED';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const status = PRESET.includes(',') ? undefined : (PRESET || undefined);
    SellerService.getMyOrders(1, status).then(r => {
      let list = r?.orders || [];
      if (PRESET.includes(',')) {
        const allowed = new Set(PRESET.split(','));
        list = list.filter((o: any) => allowed.has(String(o.status || '').toUpperCase()));
      }
      setOrders(list);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    if (!q) return true;
    const s = q.toLowerCase();
    return String(o.id).toLowerCase().includes(s) || `${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase().includes(s);
  });

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <SellerPageHeader title="Retours & remboursements" description="Demandes de retour." action={<></>} />
      
      <SellerCard>
        {filtered.length === 0 ? (
          <SellerEmptyState title="Aucune commande" description="Rien à afficher pour le moment." />
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <div key={o.id} className="border border-gray-100 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-navy">#{String(o.id).slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">{o.customer?.firstName} {o.customer?.lastName} · {fmt(o.totalAmount)} · {o.status}</p>
                </div>
                <RowActions>
                      <SellerActionButton size="sm" variant="secondary" href="/vendeur/dashboard/commandes">Voir</SellerActionButton>
                      <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon("Accepter")}>Accepter</SellerActionButton>
                      <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon("Refuser")}>Refuser</SellerActionButton>
                      <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon("Demander plus d’informations")}>Demander plus d’informations</SellerActionButton>
                      <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/communication/messages">Contacter le client</SellerActionButton>
                      <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/communication/support">Contacter MandinMarket</SellerActionButton>
                      <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon("Produit reçu")}>Produit reçu</SellerActionButton>
                      <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon("Valider le remboursement")}>Valider le remboursement</SellerActionButton>
                </RowActions>
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
