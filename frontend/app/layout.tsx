import type { Metadata, Viewport } from 'next'
import './styles.css'
import { StoreProvider } from './contexts/StoreContext'
import { CartProvider } from './contexts/CartContext'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import { RegionProvider } from './contexts/RegionContext'
import LangSync from './components/LangSync'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mandemarket.soubadigital.com';

// Locales couvertes : toute l'Afrique de l'Ouest francophone + Europe francophone + EN
const HREFLANG_LANGUAGES: Record<string, string> = {
  'fr':        SITE_URL,
  'en':        SITE_URL,
  // Afrique francophone
  'fr-CI':     SITE_URL,
  'fr-SN':     SITE_URL,
  'fr-ML':     SITE_URL,
  'fr-BF':     SITE_URL,
  'fr-TG':     SITE_URL,
  'fr-BJ':     SITE_URL,
  'fr-GN':     SITE_URL,
  'fr-CM':     SITE_URL,
  'fr-NE':     SITE_URL,
  'fr-MA':     SITE_URL,
  // Anglophone Afrique
  'en-GH':     SITE_URL,
  'en-NG':     SITE_URL,
  // Europe
  'fr-FR':     SITE_URL,
  'fr-BE':     SITE_URL,
  'fr-CH':     SITE_URL,
  'fr-LU':     SITE_URL,
  'en-GB':     SITE_URL,
  'en-IE':     SITE_URL,
  'x-default': SITE_URL,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MandeMarket — Marketplace Afrique & Europe',
    template: '%s | MandeMarket',
  },
  description: 'Achetez en ligne en toute confiance : mode, sacs, accessoires — livraison en Afrique de l\'Ouest et en Europe. Paiement en FCFA ou en EUR.',
  keywords: 'e-commerce afrique, marketplace côte d\'ivoire, boutique en ligne, MandeMarket',
  authors: [{ name: 'MandeMarket' }],
  alternates: {
    canonical: SITE_URL,
    languages: HREFLANG_LANGUAGES,
  },
  openGraph: {
    siteName:        'MandeMarket',
    type:            'website',
    locale:          'fr_CI',
    alternateLocale: ['fr_FR', 'fr_BE', 'fr_SN', 'en_GH', 'en_GB'],
    title:           'MandeMarket — Marketplace Afrique & Europe',
    description:     'Achetez en ligne : mode, sacs, accessoires. Paiement en FCFA ou EUR. Livraison en Afrique de l\'Ouest et en Europe.',
    url:             SITE_URL,
  },
  twitter: {
    card:        'summary_large_image',
    site:        '@mandemarket',
    title:       'MandeMarket — Marketplace Afrique & Europe',
    description: 'Mode, sacs, accessoires — livraison Afrique & Europe.',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <RegionProvider>
          <LangSync />
          <StoreProvider>
            <CartProvider>
              <CustomerAuthProvider>
                {children}
              </CustomerAuthProvider>
            </CartProvider>
          </StoreProvider>
        </RegionProvider>
      </body>
    </html>
  )
}
