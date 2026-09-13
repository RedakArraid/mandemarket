'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SellerService } from '../../../config/api';
import { Spinner } from '../_components/sections';
import { SellerPageHeader, SellerCard, SellerStatGrid, PeriodSelector } from '../_components/ui';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

export default function StatistiquesVentesPage() {
  const [period, setPeriod] = useState('30 jours');
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      SellerService.getMyEarnings(),
      SellerService.getMyOrders(1, 100),
    ]).then((results) => {
      if (results[0].status === 'fulfilled') setEarnings(results[0].value);
      if (results[1].status === 'fulfilled') setOrders(results[1].value?.orders || []);
      setLoading(false);
    });
  }, []);

  const handleExportCsv = () => {
    const headers = ['Métrique', 'Valeur'];
    const totalSales = earnings?.totalSales || 0;
    const netEarnings = earnings?.totalEarnings || 0;
    const count = orders.length;
    const avgBasket = count > 0 ? Math.round(totalSales / count) : 0;

    const rows = [
      ['Chiffre d’affaires total (FCFA)', Math.round(totalSales / 100)],
      ['Revenus nets vendeur (FCFA)', Math.round(netEarnings / 100)],
      ['Nombre total de commandes', count],
      ['Panier moyen (FCFA)', Math.round(avgBasket / 100)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `statistiques-ventes-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalSales = earnings?.totalSales || 0;
  const netEarnings = earnings?.totalEarnings || 0;
  const count = orders.length;
  const avgBasket = count > 0 ? Math.round(totalSales / count) : 0;
  const totalItemsSold = orders.reduce((sum, o) => {
    return sum + (o.items || []).reduce((s: number, it: any) => s + (it.quantity || 1), 0);
  }, 0);

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Statistiques des ventes"
        description="Analysez les performances financières et le volume d'affaires de votre boutique."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition"
            >
              📥 Exporter CSV
            </button>
            <Link
              href="/vendeur/dashboard/paiements"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm transition"
            >
              Voir mon solde
            </Link>
          </div>
        }
      />

      <PeriodSelector value={period} onChange={setPeriod} />

      <SellerStatGrid
        items={[
          { label: 'Chiffre d’affaires', value: fmt(totalSales), hint: 'Volume brut généré' },
          { label: 'Gains nets', value: fmt(netEarnings), hint: 'Après commission' },
          { label: 'Commandes', value: String(count), hint: 'Toutes périodes' },
          { label: 'Panier moyen', value: fmt(avgBasket), hint: 'Par commande' },
          { label: 'Articles vendus', value: String(totalItemsSold), hint: 'Unités expédiées' },
        ]}
      />

      <SellerCard title="Navigation analytique">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/vendeur/dashboard/statistiques/produits"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-navy text-white hover:bg-brand-navy/90 transition"
          >
            Performance par produit →
          </Link>
          <Link
            href="/vendeur/dashboard/statistiques/marketing"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            Impact marketing →
          </Link>
          <Link
            href="/vendeur/dashboard/commandes"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            Voir le détail des commandes →
          </Link>
        </div>
      </SellerCard>
    </div>
  );
}
