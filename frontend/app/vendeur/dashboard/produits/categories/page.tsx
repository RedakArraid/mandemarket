'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CategoryService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, SellerEmptyState } from '../../_components/ui';

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    CategoryService.getAll()
      .then(c => setCategories(Array.isArray(c) ? c.filter((x: any) => x.status !== 'inactive') : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <SellerPageHeader
        title="Catégories du catalogue"
        description="Consultez les catégories officielles de MandeMarket disponibles pour vos produits."
        action={
          <SellerHeaderActions>
            <SellerActionButton variant="secondary" href="/vendeur/dashboard/produits/ajouter">
              + Ajouter un produit
            </SellerActionButton>
            <Link
              href="/vendeur/dashboard/communication/support"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm transition"
            >
              Demander une nouvelle catégorie
            </Link>
          </SellerHeaderActions>
        }
      />
      <SellerCard>
        {categories.length === 0 ? (
          <SellerEmptyState title="Aucune catégorie" description="Les catégories sont gérées par MandeMarket." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(c => (
              <div key={c.id} className="rounded-xl border border-gray-100 bg-orange-50/20 px-4 py-3">
                <p className="font-semibold text-brand-navy">{c.name}</p>
                {c.slug && <p className="text-xs text-gray-400">/{c.slug}</p>}
                {c.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
