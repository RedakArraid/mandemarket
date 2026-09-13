'use client';

import { useEffect, useState } from 'react';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerEmptyState, RowActions, notifySoon } from '../../_components/ui';

export default function StockPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    SellerService.getMyProducts(1).then(r => setProducts(r?.products || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Stock" description="Suivi des quantités disponibles et réservées." action={
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Mettre à jour les stocks')}>Mettre à jour les stocks</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/produits/ajouter">+ Ajouter un produit</SellerActionButton>
        </SellerHeaderActions>
      } />
      <SellerCard>
        {products.length === 0 ? <SellerEmptyState title="Aucun stock" description="Ajoutez des produits." actionLabel="Ajouter" actionHref="/vendeur/dashboard/produits/ajouter" /> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr className="text-xs uppercase text-gray-400 border-b"><th className="pb-2 text-left">Produit</th><th className="pb-2 text-left">SKU</th><th className="pb-2 text-left">Disponible</th><th className="pb-2 text-left">Réservé</th><th className="pb-2 text-left">Stock</th><th className="pb-2 text-left">Actions</th></tr></thead>
              <tbody className="divide-y">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 font-medium">{p.name}</td>
                    <td className="py-3 text-gray-500">{p.sku || '—'}</td>
                    <td className="py-3">{p.stock ?? 0}</td>
                    <td className="py-3">0</td>
                    <td className="py-3 font-semibold">{p.stock ?? 0}</td>
                    <td className="py-3">
                      <RowActions>
                        <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Ajouter du stock')}>+ Ajouter</SellerActionButton>
                        <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Retirer du stock')}>- Retirer</SellerActionButton>
                        <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Modifier')}>Modifier</SellerActionButton>
                        <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Historique')}>Historique</SellerActionButton>
                        <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Alerte stock')}>Activer une alerte</SellerActionButton>
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SellerCard>
    </div>
  );
}
