// Utilitaires pour la gestion des prix dans MandeMarket
// Les prix sont TOUJOURS stockés en centimes dans la base de données

/**
 * Formate un prix en centimes vers un affichage FCFA
 * @param priceInCents Prix en centimes
 * @returns Prix formaté (ex: "15 000 FCFA")
 */
export const formatPrice = (priceInCents: number): string => {
  const priceInFCFA = priceInCents / 100;
  return `${priceInFCFA.toLocaleString('fr-FR')} FCFA`;
};

/**
 * Formate un prix en centimes vers un nombre pour les inputs
 * @param priceInCents Prix en centimes  
 * @returns Prix en FCFA pour input (ex: 15000)
 */
export const formatPriceForInput = (priceInCents: number): number => {
  return Math.round(priceInCents / 100);
};

/**
 * Convertit un prix en FCFA vers les centimes pour stockage
 * @param priceInFCFA Prix en FCFA
 * @returns Prix en centimes (ex: 1500000)
 */
export const parsePrice = (priceInFCFA: number): number => {
  return Math.round(priceInFCFA * 100);
};

/**
 * Valide qu'un prix est valide
 * @param price Prix à valider
 * @returns true si valide
 */
export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && price >= 0 && isFinite(price);
};

/**
 * Formate un prix court sans la devise pour l'affichage compact
 * @param priceInCents Prix en centimes
 * @returns Prix formaté court (ex: "15 000")
 */
export const formatPriceShort = (priceInCents: number): string => {
  const priceInFCFA = priceInCents / 100;
  return priceInFCFA.toLocaleString('fr-FR');
};

/**
 * Calcule la fourchette de prix pour les filtres
 * @param products Liste des produits
 * @returns {min, max} en centimes
 */
export const calculatePriceRange = (products: any[]): { min: number; max: number } => {
  if (!products || products.length === 0) {
    return { min: 0, max: 5000000 }; // Défaut: 0 - 50000 FCFA
  }

  const prices = products
    .map(p => p.price)
    .filter(price => isValidPrice(price));

  if (prices.length === 0) {
    return { min: 0, max: 5000000 };
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

/**
 * Filtre les produits par fourchette de prix
 * @param products Liste des produits
 * @param minPrice Prix minimum en centimes
 * @param maxPrice Prix maximum en centimes
 * @returns Produits filtrés
 */
export const filterProductsByPrice = (
  products: any[], 
  minPrice: number, 
  maxPrice: number
): any[] => {
  return products.filter(product => {
    const price = product.price || 0;
    return price >= minPrice && price <= maxPrice;
  });
};

// Plages de prix prédéfinies pour les filtres (en FCFA)
export interface PriceRange {
  id: string;
  label: string;
  min: number; // En centimes
  max: number; // En centimes
}

export const PRICE_RANGES: PriceRange[] = [
  {
    id: 'budget',
    label: 'Moins de 10 000 FCFA',
    min: 0,
    max: parsePrice(9999)
  },
  {
    id: 'affordable',
    label: '10 000 - 25 000 FCFA',
    min: parsePrice(10000),
    max: parsePrice(25000)
  },
  {
    id: 'mid-range',
    label: '25 000 - 50 000 FCFA',
    min: parsePrice(25000),
    max: parsePrice(50000)
  },
  {
    id: 'premium',
    label: '50 000 - 100 000 FCFA',
    min: parsePrice(50000),
    max: parsePrice(100000)
  },
  {
    id: 'luxury',
    label: 'Plus de 100 000 FCFA',
    min: parsePrice(100000),
    max: parsePrice(999999)
  }
];

/**
 * Filtre les produits par plages de prix sélectionnées
 * @param products Liste des produits
 * @param selectedRanges IDs des plages sélectionnées
 * @returns Produits filtrés
 */
export const filterProductsByPriceRanges = (
  products: any[],
  selectedRanges: string[]
): any[] => {
  if (selectedRanges.length === 0) {
    return products; // Si aucune plage sélectionnée, retourner tous les produits
  }

  return products.filter(product => {
    const price = product.price || 0;
    
    return selectedRanges.some(rangeId => {
      const range = PRICE_RANGES.find(r => r.id === rangeId);
      if (!range) return false;
      
      return price >= range.min && price <= range.max;
    });
  });
};

/**
 * Obtient le label d'affichage pour les plages sélectionnées
 * @param selectedRanges IDs des plages sélectionnées
 * @returns String d'affichage
 */
export const getPriceRangesLabel = (selectedRanges: string[]): string => {
  if (selectedRanges.length === 0) {
    return 'Tous les prix';
  }
  
  if (selectedRanges.length === 1) {
    const range = PRICE_RANGES.find(r => r.id === selectedRanges[0]);
    return range?.label || 'Plage inconnue';
  }
  
  return `${selectedRanges.length} plages sélectionnées`;
};
