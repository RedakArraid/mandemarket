// Données par défaut pour MandeMarket
// Centralisation des produits et catégories

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Prix en centimes
  categoryId: string;
  image: string;
  stock: number;
  coating?: string;
  sku?: string;
  material?: string;
  dimensions?: string;
  weight?: number;
  colors?: string[];
  features?: string[];
  status?: 'active' | 'inactive';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  icon?: string;
  status?: 'active' | 'inactive';
  productCount?: number;
}

// Catégories avec IDs cohérents
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-001-luxury",
    name: "Luxury",
    description: "Sacs de luxe et accessoires premium",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
  },
  {
    id: "cat-002-vintage",
    name: "Vintage",
    description: "Sacs vintage et rétro authentiques",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=300&fit=crop"
  },
  {
    id: "cat-003-business",
    name: "Business",
    description: "Sacs professionnels et élégants",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop"
  },
  {
    id: "cat-004-casual",
    name: "Casual",
    description: "Sacs décontractés et quotidiens",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
  }
];

// Produits avec prix en centimes et IDs cohérents
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-001-luxury-leather",
    name: "Sac Cuir Luxe Premium",
    description: "Sac en cuir véritable de première qualité, finition impeccable",
    price: 10000000, // 100,000 FCFA
    categoryId: "cat-001-luxury",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
    stock: 5,
    coating: "Vernis brillant",
    sku: "LUX-001"
  },
  {
    id: "prod-002-vintage-retro",
    name: "Sac Vintage Authentique",
    description: "Sac vintage authentique des années 60, état excellent",
    price: 8000000, // 80,000 FCFA
    categoryId: "cat-002-vintage",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=300&fit=crop",
    stock: 3,
    coating: "Patine naturelle",
    sku: "VIN-002"
  },
  {
    id: "prod-003-business-elegant",
    name: "Sac Business Élégant",
    description: "Sac professionnel élégant, parfait pour le bureau",
    price: 12000000, // 120,000 FCFA
    categoryId: "cat-003-business",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop",
    stock: 8,
    coating: "Cuir mat",
    sku: "BUS-003"
  },
  {
    id: "prod-004-casual-daily",
    name: "Sac Casual Quotidien",
    description: "Sac décontracté parfait pour la vie quotidienne",
    price: 6000000, // 60,000 FCFA
    categoryId: "cat-004-casual",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    stock: 12,
    coating: "Tissu résistant",
    sku: "CAS-004"
  }
];

// Fonctions utilitaires pour le formatage des prix
export const formatPrice = (priceInCents: number): string => {
  const fcfa = priceInCents / 100;
  return `${fcfa.toFixed(0)} FCFA`;
};

export const validatePrice = (price: number): boolean => {
  return price > 0 && Number.isInteger(price);
};

// Fonction pour obtenir un produit par ID
export const getProductById = (id: string): Product | undefined => {
  return DEFAULT_PRODUCTS.find(product => product.id === id);
};

// Fonction pour obtenir une catégorie par ID
export const getCategoryById = (id: string): Category | undefined => {
  return DEFAULT_CATEGORIES.find(category => category.id === id);
};

// Fonction pour obtenir les produits d'une catégorie
export const getProductsByCategory = (categoryId: string): Product[] => {
  return DEFAULT_PRODUCTS.filter(product => product.categoryId === categoryId);
}; 