'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerCard, SellerStatGrid } from '../../_components/ui';

export default function StatistiquesMarketingPage() {
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    SellerService.getMyPromotions()
      .then((data) => setPromos(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeCount = promos.filter((p) => p.isActive).length;
  const totalUses = promos.reduce((sum, p) => sum + (p.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Performance Marketing"
        description="Mesurez l'efficacité de vos codes promotionnels et opérations spéciales."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/vendeur/dashboard/marketing/coupons"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm transition"
            >
              + Nouveau code promo
            </Link>
          </div>
        }
      />

      <SellerStatGrid
        items={[
          { label: 'Codes promo actifs', value: String(activeCount), hint: 'En circulation' },
          { label: 'Utilisations totales', value: String(totalUses), hint: 'Rédemptions en caisse' },
          { label: 'Campagnes créées', value: String(promos.length), hint: 'Historique boutique' },
          { label: 'Type dominant', value: 'Pourcentage (%)', hint: 'Mécanisme le plus utilisé' },
        ]}
      />

      <SellerCard title="Codes promotionnels actifs">
        {promos.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Aucune promotion active pour le moment.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {promos.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-brand-navy bg-orange-50 px-2 py-0.5 rounded border border-orange-100 text-xs">
                    {p.code}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{p.name} · Valeur : {p.value} {p.type === 'FIXED_AMOUNT' ? 'FCFA' : '%'}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-gray-800">{p.usedCount || 0} utilisation(s)</span>
                  <p className="text-gray-400">Max : {p.maxUses || 'Illimité'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
