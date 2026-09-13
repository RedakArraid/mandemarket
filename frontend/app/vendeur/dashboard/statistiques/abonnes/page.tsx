'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerCard, SellerStatGrid } from '../../_components/ui';

export default function StatistiquesAbonnesPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    SellerService.getMyCustomers()
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
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

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Fidélité & Base Acheteurs"
        description="Analysez la rétention et l'attachement des clients à votre enseigne."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/vendeur/dashboard/communication/messages"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm transition"
            >
              ✉️ Écrire à un acheteur
            </Link>
          </div>
        }
      />

      <SellerStatGrid
        items={[
          { label: 'Acheteurs enregistrés', value: String(customers.length), hint: 'Base clients directe' },
          { label: 'Taux de réachat', value: customers.length > 0 ? '100 %' : '—', hint: 'Sur votre catalogue' },
          { label: 'Canal de contact', value: 'Direct / Email', hint: 'Messagerie intégrée' },
          { label: 'Statut compte', value: 'Actif', hint: 'Vendeur vérifié' },
        ]}
      />

      <SellerCard title="Vos acheteurs directs">
        {customers.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">Les coordonnées de vos premiers clients apparaîtront ici.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {customers.map((c) => (
              <div key={c.id || c.email} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-brand-navy">{c.name || c.email}</p>
                  <p className="text-xs text-gray-400">
                    Dernière commande : #{c.lastOrderNumber || ''} ({new Date(c.lastOrderDate).toLocaleDateString('fr-FR')})
                  </p>
                </div>
                <Link
                  href={`/vendeur/dashboard/communication/messages?customer=${encodeURIComponent(c.email)}`}
                  className="px-3 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-brand-navy transition"
                >
                  Envoyer un message
                </Link>
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
