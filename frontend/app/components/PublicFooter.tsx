import Link from 'next/link';
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const CATEGORY_GROUPS = [
  {
    label: 'Électronique & High-Tech',
    slug: 'electronique',
    items: [
      { label: 'Smartphones', slug: 'smartphones' },
      { label: 'Laptops & Tablettes', slug: 'laptops-tablettes' },
      { label: 'TV · Son · Photo', slug: 'tv-son-photo' },
    ],
  },
  {
    label: 'Mode & Beauté',
    slug: 'mode-accessoires',
    items: [
      { label: 'Vêtements Femme', slug: 'vetements-femme' },
      { label: 'Vêtements Homme', slug: 'vetements-homme' },
      { label: 'Chaussures', slug: 'chaussures' },
      { label: 'Sacs & Maroquinerie', slug: 'sacs-maroquinerie' },
      { label: 'Beauté & Santé', slug: 'beaute-sante' },
    ],
  },
  {
    label: 'Maison & Cuisine',
    slug: 'maison-decoration',
    items: [
      { label: 'Maison & Décoration', slug: 'maison-decoration' },
      { label: 'Alimentation & Épicerie', slug: 'alimentation' },
      { label: 'Épices & Condiments', slug: 'epices-condiments' },
      { label: 'Boissons & Jus', slug: 'boissons-jus' },
    ],
  },
  {
    label: 'Artisanat Africain',
    slug: 'artisanat-exotique',
    items: [
      { label: 'Art africain', slug: 'art-africain' },
      { label: 'Bijoux africains', slug: 'bijoux-accessoires' },
      { label: 'Artisanat local', slug: 'artisanat-exotique' },
    ],
  },
  {
    label: 'Sport & Services',
    slug: 'sport-loisirs',
    items: [
      { label: 'Sport & Loisirs', slug: 'sport-loisirs' },
      { label: 'Services', slug: 'services' },
    ],
  },
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
    >
      <span className="w-1 h-1 bg-orange-500 rounded-full group-hover:w-2 transition-all flex-shrink-0" />
      {children}
    </Link>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Newsletter */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Restez Informé
            </h3>
            <p className="text-gray-400 mb-6">
              Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl">
                S'inscrire
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Top row: About · Nav · Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              MandeMarket
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              La marketplace de référence en Afrique de l&apos;Ouest. Électronique, mode, alimentation, artisanat et bien plus.
            </p>
            <div className="flex items-center gap-2 text-gray-400">
              <HeartIcon className="w-5 h-5 text-orange-500" />
              <span className="text-sm">Afrique de l&apos;Ouest &amp; France</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4 text-orange-400 text-lg">Navigation</h4>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Accueil' },
                { href: '/boutique', label: 'Boutique' },
                { href: '/blog', label: 'Blog' },
                { href: '/contact', label: 'Contact' },
                { href: '/devenir-vendeur', label: 'Devenir vendeur' },
              ].map(({ href, label }) => (
                <li key={href}><FooterLink href={href}>{label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-orange-400 text-lg">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPinIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Abidjan, Côte d&apos;Ivoire</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <EnvelopeIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <a href="mailto:contact@mandemarket.com" className="hover:text-white transition-colors">
                  contact@mandemarket.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <PhoneIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>+225 XX XX XX XX XX</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Category groups */}
        <div className="border-t border-gray-800 pt-10">
          <h4 className="font-semibold mb-6 text-orange-400 text-lg">Nos catégories</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.slug}>
                <Link
                  href={`/boutique?category=${group.slug}`}
                  className="block text-sm font-semibold text-white mb-3 hover:text-orange-400 transition-colors"
                >
                  {group.label}
                </Link>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/boutique?category=${item.slug}`}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} MandeMarket. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/cgv" className="hover:text-white transition-colors">CGV</Link>
              <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

