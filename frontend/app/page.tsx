'use client';

import { useStore } from './contexts/StoreContext';
import PublicHeader from './components/PublicHeader';
import PublicFooter from './components/PublicFooter';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const { getActiveProducts, getActiveCategories, isHydrated } = useStore();
  const products = isHydrated ? getActiveProducts().slice(0, 6) : [];
  const categories = isHydrated ? getActiveCategories() : [];

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">MandeMarket</h2>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const categoryEmojis: Record<string, string> = {
    'electronique': '📱',
    'mode-accessoires': '👗',
    'alimentation': '🛒',
    'beaute-sante': '✨',
    'maison-decoration': '🏠',
    'sport-loisirs': '⚽',
    'artisanat-exotique': '🎨',
    'services': '🛠️',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24 md:py-32 overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-orange-400/30">
              <SparklesIcon className="w-5 h-5 text-orange-400" />
              <span className="text-orange-200 font-semibold">Marketplace N°1 en Afrique de l'Ouest</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Tout ce dont vous avez besoin,
              <span className="block mt-2 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                livré chez vous
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Découvrez des millions de produits : électronique, mode, alimentation, artisanat et bien plus. Vendeurs vérifiés, paiement sécurisé.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/boutique"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Découvrir la boutique
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl hover:bg-white/20 transition-all font-bold border border-white/20"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: TruckIcon, title: 'Livraison Rapide', desc: '48h à Abidjan, 5-7j partout en Côte d\'Ivoire' },
              { icon: ShieldCheckIcon, title: 'Vendeurs Vérifiés', desc: 'Tous nos vendeurs sont contrôlés et approuvés' },
              { icon: CreditCardIcon, title: 'Paiement Sécurisé', desc: 'Mobile Money, carte bancaire et paiement à la livraison' },
              { icon: SparklesIcon, title: 'Artisanat Africain', desc: 'Valorisons les créateurs et artisans locaux' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl mb-4 group-hover:from-orange-500 group-hover:to-orange-600 transition-all group-hover:scale-110 group-hover:shadow-xl">
                    <Icon className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-20 bg-gradient-to-br from-orange-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explorez nos univers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des milliers de produits dans toutes les catégories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/boutique?category=${category.slug}`}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 p-6"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-3">
                      {categoryEmojis[category.slug] ? `${categoryEmojis[category.slug]} ` : ''}{category.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:gap-2 transition-all mt-4 pt-4 border-t border-gray-100">
                    <span>Découvrir</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Produits en vedette */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Produits en vedette
              </h2>
              <p className="text-xl text-gray-600">
                Découvrez nos meilleures ventes
              </p>
            </div>
            <Link
              href="/boutique"
              className="hidden md:inline-flex items-center gap-2 text-orange-600 font-bold hover:gap-4 transition-all"
            >
              Voir tous les produits
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => {
              const category = categories.find(c => c.id === product.categoryId);
              const isNew = new Date().getTime() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group border border-gray-100 relative">
                  {isNew && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg">
                        <SparklesIcon className="w-3 h-3" />
                        Nouveau
                      </span>
                    </div>
                  )}

                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={product.image || `https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.src = `https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=500&fit=crop`; }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <Link
                          href="/boutique"
                          className="w-full block bg-white text-gray-900 py-2.5 px-4 rounded-lg font-bold hover:bg-orange-500 hover:text-white transition-all shadow-xl text-center"
                        >
                          Voir les détails
                        </Link>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
                        (product.stock || 0) > 10 ? 'bg-green-500 text-white' :
                        (product.stock || 0) > 5 ? 'bg-yellow-500 text-white' :
                        (product.stock || 0) > 0 ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {(product.stock || 0) > 0 ? `${product.stock}` : 'Rupture'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                        {category?.name}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {Math.round(product.price / 100).toLocaleString()} F
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          Prix TTC
                        </div>
                      </div>
                      <button
                        className={`p-3 rounded-xl transition-all ${
                          (product.stock || 0) === 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl hover:scale-110'
                        }`}
                        disabled={(product.stock || 0) === 0}
                      >
                        <ShoppingBagIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/boutique"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105"
            >
              Voir toute la collection
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Devenez vendeur */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-white grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-3 block">Pour les entrepreneurs</span>
              <h2 className="text-4xl font-bold mb-4">Vendez sur MandeMarket</h2>
              <p className="text-gray-300 text-lg mb-6">
                Rejoignez notre réseau de vendeurs certifiés. Créez votre boutique en ligne, touchez des milliers de clients en Côte d'Ivoire et en France.
              </p>
              <ul className="space-y-2 text-gray-300 mb-8">
                {['Commission réduite de 10%', 'Tableau de bord vendeur complet', 'Paiements Mobile Money & virement', 'Support dédié aux vendeurs'].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/vendeur" className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg">
                Ouvrir ma boutique
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
            <div className="hidden md:grid grid-cols-2 gap-4">
              {[
                { emoji: '📦', label: 'Tous types de produits' },
                { emoji: '💳', label: 'Paiements automatiques' },
                { emoji: '📊', label: 'Statistiques détaillées' },
                { emoji: '🌍', label: 'Afrique + Europe' },
              ].map(item => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <div className="text-sm font-semibold text-gray-200">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Rejoignez MandeMarket aujourd'hui
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Des milliers de vendeurs, des millions de produits. Afrique de l'Ouest et Europe.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 bg-white text-orange-600 px-10 py-5 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-2xl hover:scale-105 text-lg"
          >
            Commencer le shopping
            <ArrowRightIcon className="w-6 h-6" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
