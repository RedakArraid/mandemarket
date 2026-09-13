'use client';

import { useEffect, useState } from 'react';
import { CategoryService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerEmptyState, notifySoon } from '../../_components/ui';

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    CategoryService.getAll().then(c => setCategories(Array.isArray(c) ? c.filter((x: any) => x.status !== 'inactive') : [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Catégories" description="Catégories MandinMarket disponibles pour vos produits." action={
        <SellerHeaderActions>
          <SellerActionButton variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Voir les catégories</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Demande de nouvelle catégorie')}>Demander une nouvelle catégorie</SellerActionButton>
        </SellerHeaderActions>
      } />
      <SellerCard>
        {categories.length === 0 ? <SellerEmptyState title="Aucune catégorie" description="Les catégories sont gérées par MandinMarket." /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.id} className="rounded-xl border border-gray-100 bg-brand-cream/40 px-4 py-3">
                <p className="font-semibold text-brand-navy">{c.name}</p>
                {c.slug && <p className="text-xs text-gray-500">/{c.slug}</p>}
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
