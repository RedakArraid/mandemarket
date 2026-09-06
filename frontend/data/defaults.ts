// Données par défaut centralisées pour MandeMarket
// Interfaces définies localement

// Interfaces définies localement
interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
  description: string;
  stock: number;
  status: 'active' | 'inactive';
  sku?: string;
  material?: string;
  lining?: string;
  coating?: string;
  dimensions?: string;
  weight?: number;
  shape?: string;
  styles?: string[];
  pattern?: string;
  decoration?: string;
  closure?: string;
  handles?: string;
  season?: string;
  occasion?: string;
  features?: string[];
  colors?: string[];
  gender?: string;
  ageGroup?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
  description: string;
  status: 'active' | 'inactive';
  productCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Fonctions utilitaires pour les prix
const validatePrice = (price: number): boolean => price > 0;
const formatPrice = (price: number): string => `${(price / 100).toFixed(0)} FCFA`;

// IDs cohérents avec séquence logique
export const CATEGORY_IDS = {
  LUXURY: 'cat-001-luxury',
  VINTAGE: 'cat-002-vintage', 
  BUSINESS: 'cat-003-business',
  CASUAL: 'cat-004-casual'
} as const;

// Images uniques pour chaque catégorie
export const CATEGORY_IMAGES = {
  [CATEGORY_IDS.LUXURY]: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&crop=center',
  [CATEGORY_IDS.VINTAGE]: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
  [CATEGORY_IDS.BUSINESS]: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop&crop=center',
  [CATEGORY_IDS.CASUAL]: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center'
} as const;

// Images uniques pour chaque produit
export const PRODUCT_IMAGES = {
  1: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&crop=center',
  2: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
  3: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop&crop=center',
  4: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center'
} as const;

// Catégories par défaut - TYPES CORRECTS selon types/index.ts
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: CATEGORY_IDS.LUXURY,
    name: 'Luxe',
    icon: '💎',
    image: CATEGORY_IMAGES[CATEGORY_IDS.LUXURY],
    description: 'Sacs haut de gamme en cuir premium et finitions dorées',
    status: 'active',
    productCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: CATEGORY_IDS.VINTAGE,
    name: 'Vintage',
    icon: '🕰️',
    image: CATEGORY_IMAGES[CATEGORY_IDS.VINTAGE],
    description: 'Designs rétro et motifs géométriques tendance',
    status: 'active',
    productCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: CATEGORY_IDS.BUSINESS,
    name: 'Business',
    icon: '💼',
    image: CATEGORY_IMAGES[CATEGORY_IDS.BUSINESS],
    description: 'Sacs professionnels et fonctionnels pour le travail',
    status: 'active',
    productCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: CATEGORY_IDS.CASUAL,
    name: 'Casual',
    icon: '👜',
    image: CATEGORY_IMAGES[CATEGORY_IDS.CASUAL],
    description: 'Sacs pratiques et confortables pour tous les jours',
    status: 'active',
    productCount: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Produits par défaut - TYPES CORRECTS avec TOUTES les propriétés
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "1", // ✅ CORRECT : string
    name: "Sac à main verni brillant avec anneau de levage",
    price: 10000000, // ✅ CORRECT : 100,000 FCFA en centimes
    categoryId: CATEGORY_IDS.LUXURY,
    image: PRODUCT_IMAGES[1],
    description: "Sac à main élégant avec finition vernie brillante et anneau de levage doré pour femme",
    stock: 12,
    status: 'active', // ✅ AJOUTÉ
    sku: "C05N001", // ✅ AJOUTÉ
    material: "Cuir PU", // ✅ AJOUTÉ
    lining: "Polyester", // ✅ AJOUTÉ
    coating: "Vernis brillant", // ✅ AJOUTÉ
    dimensions: "25 x 18 x 12 cm", // ✅ AJOUTÉ
    weight: 0.7, // ✅ AJOUTÉ
    shape: "Rectangle", // ✅ AJOUTÉ
    styles: ["Mode", "Luxe", "Élégant"], // ✅ AJOUTÉ
    pattern: "Solide", // ✅ AJOUTÉ
    decoration: "Anneau doré", // ✅ AJOUTÉ
    closure: "Fermeture éclair", // ✅ AJOUTÉ
    handles: "Double poignée", // ✅ AJOUTÉ
    season: "Toutes saisons", // ✅ AJOUTÉ
    occasion: "Soirée", // ✅ AJOUTÉ
    features: ["Résistant", "Élégant"], // ✅ AJOUTÉ
    colors: ["Noir", "Rouge", "Beige"], // ✅ AJOUTÉ
    gender: "Femme", // ✅ AJOUTÉ
    ageGroup: "Adulte", // ✅ AJOUTÉ
    createdAt: new Date(), // ✅ AJOUTÉ
    updatedAt: new Date() // ✅ AJOUTÉ
  },
  {
    id: "2", // ✅ CORRECT : string
    name: "Sac imprimé géométrique vintage léger tendance",
    price: 8000000, // ✅ CORRECT : 80,000 FCFA en centimes
    categoryId: CATEGORY_IDS.VINTAGE,
    image: PRODUCT_IMAGES[2],
    description: "Sac tendance avec motifs géométriques vintage, léger et pratique pour un look moderne",
    stock: 8,
    status: 'active',
    sku: "C05N002",
    material: "Toile enduite",
    lining: "Coton",
    coating: "Traitement anti-taches",
    dimensions: "30 x 25 x 8 cm",
    weight: 0.4,
    shape: "Rectangle",
    styles: ["Vintage", "Décontracté", "Tendance"],
    pattern: "Géométrique",
    decoration: "Motifs imprimés",
    closure: "Fermeture éclair",
    handles: "Bandoulière réglable",
    season: "Printemps-Été",
    occasion: "Quotidien",
    features: ["Léger", "Pratique"],
    colors: ["Multicolore", "Beige", "Marron"],
    gender: "Femme",
    ageGroup: "Jeune Adulte",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3", // ✅ CORRECT : string
    name: "Sac à dos d'ordinateur résistant à l'eau antivol",
    price: 12000000, // ✅ CORRECT : 120,000 FCFA en centimes
    categoryId: CATEGORY_IDS.BUSINESS,
    image: PRODUCT_IMAGES[3],
    description: "Sac à dos professionnel antivol avec protection contre l'eau pour ordinateur portable",
    stock: 15,
    status: 'active',
    sku: "C05N003",
    material: "Nylon renforcé",
    lining: "Polyester",
    coating: "Revêtement imperméable",
    dimensions: "45 x 30 x 15 cm",
    weight: 1.2,
    shape: "Ergonomique",
    styles: ["Business", "Moderne", "Fonctionnel"],
    pattern: "Solide",
    decoration: "Logo discret",
    closure: "Fermeture éclair",
    handles: "Bretelles rembourrées",
    season: "Toutes saisons",
    occasion: "Travail",
    features: ["Imperméable", "Antivol", "Port USB", "Compartiment ordinateur"],
    colors: ["Noir", "Gris", "Bleu marine"],
    gender: "Unisexe",
    ageGroup: "Adulte",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4", // ✅ CORRECT : string
    name: "Sac bandoulière compact quotidien",
    price: 6000000, // ✅ CORRECT : 60,000 FCFA en centimes
    categoryId: CATEGORY_IDS.CASUAL,
    image: PRODUCT_IMAGES[4],
    description: "Sac bandoulière compact et pratique pour le quotidien, design moderne et fonctionnel",
    stock: 20,
    status: 'active',
    sku: "C05N004",
    material: "Coton canvas",
    lining: "Polyester",
    coating: "Traitement déperlant",
    dimensions: "20 x 15 x 8 cm",
    weight: 0.3,
    shape: "Compact",
    styles: ["Décontracté", "Moderne", "Pratique"],
    pattern: "Solide",
    decoration: "Logo brodé",
    closure: "Fermeture éclair",
    handles: "Bandoulière ajustable",
    season: "Toutes saisons",
    occasion: "Quotidien",
    features: ["Compact", "Léger", "Pratique"],
    colors: ["Beige", "Kaki", "Noir"],
    gender: "Unisexe",
    ageGroup: "Jeune Adulte",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Fonctions utilitaires avec types corrects
export const getCategoryById = (id: string): Category | undefined => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id);
};

export const getProductById = (id: string): Product | undefined => {
  return DEFAULT_PRODUCTS.find(product => product.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  return DEFAULT_PRODUCTS.filter(product => product.categoryId === categoryId);
};

export const getActiveProducts = (): Product[] => {
  return DEFAULT_PRODUCTS.filter(product => product.status === 'active');
};

export const getActiveCategories = (): Category[] => {
  return DEFAULT_CATEGORIES.filter(category => category.status === 'active');
};

// Constantes pour les statistiques
export const STATS = {
  TOTAL_PRODUCTS: DEFAULT_PRODUCTS.length,
  TOTAL_CATEGORIES: DEFAULT_CATEGORIES.length,
  TOTAL_STOCK: DEFAULT_PRODUCTS.reduce((sum, product) => sum + product.stock, 0),
  TOTAL_VALUE: DEFAULT_PRODUCTS.reduce((sum, product) => sum + (product.price * product.stock), 0)
};

// Export des types pour garantir la cohérence
export type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS];
export type ProductId = "1" | "2" | "3" | "4";
