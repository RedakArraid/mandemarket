'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import { StarIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { SellerService } from '../../config/api';
import { useRegion } from '../../contexts/RegionContext';

export default function VendeurProfilPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useRegion();

  useEffect(() => {
    if (!slug) return;
    SellerService.getBySlug(slug)
      .then(data => {
        setSeller(data);
        if (data?.storeName) {
          document.title = `${data.storeName} | MandeMarket`;
        }
      })
      .catch(() => setSeller(null))
      .finally(() => setLoading(false));
    return () => { document.title = 'MandeMarket'; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicHeader />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Boutique introuvable</h1>
          <p className="text-gray-600 mb-6">Cette boutique n&apos;existe pas ou a été supprimée.</p>
          <Link href="/boutique" className="text-orange-600 hover:underline font-medium">
            Voir tous les produits →
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const products = seller.products || [];
  const productCount = seller.productCount ?? products.length;

  const memberSince = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Store header card — overlaps banner */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 mb-8 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="flex-shrink-0">
              {seller.logo ? (
                <img
                  src={seller.logo}
                  alt={seller.storeName}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center border-4 border-white shadow-md">
                  <BuildingStorefrontIcon className="w-10 h-10 text-orange-500" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{seller.storeName}</h1>
                {seller.status === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Vendeur vérifié
                  </span>
                )}
              </div>

              {seller.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{seller.description}</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-sm">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  {seller.rating > 0 ? (
                    <>
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <StarSolidIcon
                            key={i}
                            className={`w-4 h-4 ${i <= Math.round(seller.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-900">{seller.rating.toFixed(1)}</span>
                      <span className="text-gray-500">({seller.reviewCount} avis)</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Aucun avis pour l'instant</span>
                  )}
                </div>

                <span className="text-gray-300">·</span>

                {/* Product count */}
                <span className="text-gray-600">
                  <span className="font-semibold text-gray-900">{productCount}</span>{' '}
                  produit{productCount > 1 ? 's' : ''}
                </span>

                {memberSince && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">Membre depuis {memberSince}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Produits */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Produits de <span className="text-orange-600">{seller.storeName}</span>
          </h2>
          {products.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              <BuildingStorefrontIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p>Aucun produit pour le moment.</p>
              <Link href="/boutique" className="mt-4 inline-block text-orange-600 hover:underline">
                Voir tous les produits
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/boutique/${p.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow border border-gray-100 hover:shadow-lg hover:border-orange-200 transition-all group"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{p.name}</h3>
                    <p className="text-orange-600 font-bold mt-1 text-sm">
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
