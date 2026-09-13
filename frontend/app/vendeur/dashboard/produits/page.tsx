'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductService, SellerService } from '../../../config/api';
import { Spinner } from '../_components/sections';
import {
  SellerPageHeader,
  SellerHeaderActions,
  SellerActionButton,
  SellerCard,
  SellerEmptyState,
  FilterChips,
  RowActions,
  notifySoon,
} from '../_components/ui';

function fmt(cents: number) {
  return `${Math.round((cents || 0) / 100).toLocaleString('fr-FR')} FCFA`;
}

const FILTERS = ['Tous', 'Actifs', 'Brouillons', 'En attente', 'Refusés', 'Rupture de stock', 'Promotions'];

export default function TousLesProduitsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [filter, setFilter] = useState('Tous');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const r = await SellerService.getMyProducts(1).catch(() => null);
    setProducts(r?.products || []);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const name = String(p.name || '').toLowerCase();
      if (q && !name.includes(q.toLowerCase())) return false;
      if (filter === 'Actifs') return p.status === 'active';
      if (filter === 'Brouillons') return p.status !== 'active';
      if (filter === 'Rupture de stock') return (p.stock ?? 0) === 0;
      if (filter === 'En attente' || filter === 'Refusés' || filter === 'Promotions') return false;
      return true;
    });
  }, [products, filter, q]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await ProductService.delete(String(id)).catch((e) => alert(e.message));
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <SellerPageHeader
        title="Tous les produits"
        description="Gérez votre catalogue MandinMarket."
        action={
          <SellerHeaderActions>
            <SellerActionButton href="/vendeur/dashboard/produits/ajouter" variant="primary">+ Ajouter un produit</SellerActionButton>
            <SellerActionButton variant="secondary" onClick={() => notifySoon('Importer des produits')}>Importer des produits</SellerActionButton>
            <SellerActionButton variant="outline" onClick={() => notifySoon('Exporter')}>Exporter</SellerActionButton>
          </SellerHeaderActions>
        }
      />

      <SellerCard>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full lg:max-w-md px-4 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-brand-orange"
            />
            <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-brand-soft">
              <span className="text-sm font-semibold text-brand-navy mr-2">{selected.size} sélectionné(s)</span>
              <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Activer')}>Activer</SellerActionButton>
              <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Désactiver')}>Désactiver</SellerActionButton>
              <SellerActionButton size="sm" variant="outline" href="/vendeur/dashboard/produits/stock">Modifier le stock</SellerActionButton>
              <SellerActionButton size="sm" variant="danger" onClick={() => notifySoon('Suppression multiple')}>Supprimer</SellerActionButton>
            </div>
          )}

          {filtered.length === 0 ? (
            <SellerEmptyState title="Aucun produit" description="Ajoutez votre premier produit." actionLabel="+ Ajouter un produit" actionHref="/vendeur/dashboard/produits/ajouter" />
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-4 flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <input type="checkbox" checked={selected.has(String(p.id))} onChange={() => toggle(String(p.id))} className="mt-2" />
                    {p.image ? <img src={p.image} alt="" className="w-14 h-14 rounded-lg object-cover" /> : <div className="w-14 h-14 rounded-lg bg-gray-100" />}
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-navy truncate">{p.name}</p>
                      <p className="text-sm text-gray-500">{fmt(p.price)} · Stock {p.stock ?? 0} · {p.status === 'active' ? 'Actif' : 'Brouillon'}</p>
                    </div>
                  </div>
                  <RowActions>
                    <SellerActionButton size="sm" variant="secondary" href={`/boutique/${p.id}`}>Voir</SellerActionButton>
                    <SellerActionButton size="sm" variant="primary" href="/vendeur/dashboard/produits/ajouter">Modifier</SellerActionButton>
                    <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Dupliquer')}>Dupliquer</SellerActionButton>
                    <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/statistiques/produits">Statistiques</SellerActionButton>
                    <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/marketing/booster">Booster</SellerActionButton>
                    <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Désactiver')}>Désactiver</SellerActionButton>
                    <SellerActionButton size="sm" variant="danger" onClick={() => handleDelete(String(p.id))}>Supprimer</SellerActionButton>
                  </RowActions>
                </div>
              ))}
            </div>
          )}
        </div>
      </SellerCard>
    </div>
  );
}
