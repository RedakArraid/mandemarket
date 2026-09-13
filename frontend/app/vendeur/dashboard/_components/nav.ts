export type SellerNavChild = {
  href: string;
  label: string;
};

export type SellerNavItem = {
  id: string;
  label: string;
  href: string;
  icon:
    | 'overview'
    | 'products'
    | 'orders'
    | 'marketing'
    | 'stats'
    | 'payments'
    | 'comms'
    | 'store'
    | 'settings';
  children: SellerNavChild[];
};

export const SELLER_NAV: SellerNavItem[] = [
  {
    id: 'overview',
    label: "Vue d'ensemble",
    href: '/vendeur/dashboard',
    icon: 'overview',
    children: [],
  },
  {
    id: 'products',
    label: 'Produits',
    href: '/vendeur/dashboard/produits',
    icon: 'products',
    children: [
      { href: '/vendeur/dashboard/produits', label: 'Tous les produits' },
      { href: '/vendeur/dashboard/produits/ajouter', label: 'Ajouter un produit' },
      { href: '/vendeur/dashboard/produits/stock', label: 'Stock' },
      { href: '/vendeur/dashboard/produits/brouillons', label: 'Brouillons' },
      { href: '/vendeur/dashboard/produits/categories', label: 'Catégories' },
    ],
  },
  {
    id: 'orders',
    label: 'Commandes',
    href: '/vendeur/dashboard/commandes',
    icon: 'orders',
    children: [
      { href: '/vendeur/dashboard/commandes', label: 'Toutes' },
      { href: '/vendeur/dashboard/commandes/a-preparer', label: 'À préparer' },
      { href: '/vendeur/dashboard/commandes/expediees', label: 'Expédiées' },
      { href: '/vendeur/dashboard/commandes/livrees', label: 'Livrées' },
      { href: '/vendeur/dashboard/commandes/annulees', label: 'Annulées' },
      { href: '/vendeur/dashboard/commandes/retours', label: 'Retours' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    href: '/vendeur/dashboard/marketing/promotions',
    icon: 'marketing',
    children: [
      { href: '/vendeur/dashboard/marketing/promotions', label: 'Promotions' },
      { href: '/vendeur/dashboard/marketing/coupons', label: 'Coupons' },
      { href: '/vendeur/dashboard/marketing/campagnes', label: 'Campagnes' },
      { href: '/vendeur/dashboard/marketing/booster', label: 'Booster' },
    ],
  },
  {
    id: 'stats',
    label: 'Statistiques',
    href: '/vendeur/dashboard/statistiques',
    icon: 'stats',
    children: [
      { href: '/vendeur/dashboard/statistiques', label: 'Ventes' },
      { href: '/vendeur/dashboard/statistiques/visiteurs', label: 'Visiteurs' },
      { href: '/vendeur/dashboard/statistiques/produits', label: 'Produits' },
      { href: '/vendeur/dashboard/statistiques/marketing', label: 'Marketing' },
      { href: '/vendeur/dashboard/statistiques/abonnes', label: 'Abonnés' },
    ],
  },
  {
    id: 'payments',
    label: 'Paiements',
    href: '/vendeur/dashboard/paiements',
    icon: 'payments',
    children: [
      { href: '/vendeur/dashboard/paiements', label: 'Solde' },
      { href: '/vendeur/dashboard/paiements/transactions', label: 'Transactions' },
      { href: '/vendeur/dashboard/paiements/retraits', label: 'Retraits' },
      { href: '/vendeur/dashboard/paiements/factures', label: 'Factures' },
    ],
  },
  {
    id: 'comms',
    label: 'Communication',
    href: '/vendeur/dashboard/communication/messages',
    icon: 'comms',
    children: [
      { href: '/vendeur/dashboard/communication/messages', label: 'Messages' },
      { href: '/vendeur/dashboard/communication/avis', label: 'Avis' },
      { href: '/vendeur/dashboard/communication/support', label: 'Support MandinMarket' },
    ],
  },
  {
    id: 'store',
    label: 'Ma boutique',
    href: '/vendeur/dashboard/boutique',
    icon: 'store',
    children: [
      { href: '/vendeur/dashboard/boutique', label: 'Profil' },
      { href: '/vendeur/dashboard/boutique/apparence', label: 'Apparence' },
      { href: '/vendeur/dashboard/boutique/livraison', label: 'Livraison' },
      { href: '/vendeur/dashboard/boutique/equipe', label: 'Équipe' },
    ],
  },
  {
    id: 'settings',
    label: 'Paramètres',
    href: '/vendeur/dashboard/parametres',
    icon: 'settings',
    children: [
      { href: '/vendeur/dashboard/parametres', label: 'Compte' },
      { href: '/vendeur/dashboard/parametres/securite', label: 'Sécurité' },
      { href: '/vendeur/dashboard/parametres/notifications', label: 'Notifications' },
    ],
  },
];

export function findNavItem(pathname: string): SellerNavItem | undefined {
  const exactChild = SELLER_NAV.find((item) =>
    item.children.some((c) => c.href === pathname)
  );
  if (exactChild) return exactChild;

  const exact = SELLER_NAV.find((item) => item.href === pathname);
  if (exact) return exact;

  const ranked = [...SELLER_NAV]
    .filter((item) => item.href !== '/vendeur/dashboard')
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length);

  return ranked[0] || (pathname === '/vendeur/dashboard' ? SELLER_NAV[0] : undefined);
}
