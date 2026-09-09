import Link from 'next/link';
import BrandLogo from './BrandLogo';

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-gray-400 hover:text-white transition-colors text-sm">
      {children}
    </Link>
  );
}

export default function PublicFooter() {
  return (
    <footer className="bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <BrandLogo variant="dark" href="/" />
            <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-xs">
              La marketplace qui connecte l&apos;Afrique au monde.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Navigation</h4>
            <ul className="space-y-2.5">
              <li><FooterLink href="/">Accueil</FooterLink></li>
              <li><FooterLink href="/boutique">Boutique</FooterLink></li>
              <li><FooterLink href="/bons-plans">Bons plans</FooterLink></li>
              <li><FooterLink href="/a-propos">À propos</FooterLink></li>
              <li><FooterLink href="/contact">Contact</FooterLink></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Marketplace</h4>
            <ul className="space-y-2.5">
              <li><FooterLink href="/devenir-vendeur">Devenir vendeur</FooterLink></li>
              <li><FooterLink href="/contact">Centre d&apos;aide</FooterLink></li>
              <li><FooterLink href="/cgv">Livraison</FooterLink></li>
              <li><FooterLink href="/cgv">Paiements</FooterLink></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Suivez-nous</h4>
            <div className="flex gap-3">
              {['Facebook', 'X', 'Instagram', 'LinkedIn'].map((name) => (
                <a
                  key={name}
                  href="#"
                  aria-label={name}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-orange flex items-center justify-center text-sm font-bold transition-colors"
                >
                  {name[0]}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-gray-400">
          <p>© {new Date().getFullYear()} MandinMarket. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-4">
            <FooterLink href="/cgv">Conditions générales</FooterLink>
            <FooterLink href="/confidentialite">Confidentialité</FooterLink>
            <FooterLink href="/mentions-legales">Mentions légales</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
