'use client';

import { useEffect, useState } from 'react';
import { ProductService, SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerEmptyState, RowActions, notifySoon } from '../../_components/ui';

export default function BrouillonsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const load = () => SellerService.getMyProducts(1).then(r => setProducts((r?.products || []).filter((p: any) => p.status !== 'active')));
  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Brouillons" description="Produits non publiés." action={
        <SellerActionButton href="/vendeur/dashboard/produits/ajouter" variant="primary">+ Nouveau brouillon</SellerActionButton>
      } />
      <SellerCard>
        {products.length === 0 ? <SellerEmptyState title="Aucun brouillon" description="Créez un produit et enregistrez-le comme brouillon." actionLabel="Ajouter" actionHref="/vendeur/dashboard/produits/ajouter" /> : (
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border border-gray-100 rounded-xl p-4">
                <div><p className="font-semibold text-brand-navy">{p.name}</p><p className="text-xs text-gray-500">Statut : {p.status}</p></div>
                <RowActions>
                  <SellerActionButton size="sm" variant="primary" href="/vendeur/dashboard/produits/ajouter">Continuer</SellerActionButton>
                  <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Prévisualiser')}>Prévisualiser</SellerActionButton>
                  <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Dupliquer')}>Dupliquer</SellerActionButton>
                  <SellerActionButton size="sm" variant="danger" onClick={async () => { if (confirm('Supprimer ?')) { await ProductService.delete(String(p.id)); await load(); } }}>Supprimer</SellerActionButton>
                </RowActions>
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
