'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category } from '../../types/index';
import { ProductService, CategoryService } from '../config/api';

interface StoreContextType {
  // État
  products: Product[];
  categories: Category[];
  isHydrated: boolean;
  loading: boolean;
  error: string | null;

  // Actions produits
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  toggleProductStatus: (id: number) => Promise<void>;

  // Actions catégories
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'products'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<void>;

  // Utilitaires
  getActiveProducts: () => Product[];
  getActiveCategories: () => Category[];
  refreshData: () => Promise<void>;
  resetToDefaults: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Données par défaut pour le fallback offline
const defaultProducts: Product[] = [
  {
    id: 1,
    name: "Sac à main verni brillant avec anneau de levage",
    price: 10000000, // Prix en centimes (100,000 FCFA)
    categoryId: "luxury-cat-001",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&crop=center",
    description: "Sac à main élégant avec finition vernie brillante et anneau de levage doré pour femme",
    stock: 12,
    status: 'active' as const,
    sku: "C05N001",
    material: "Cuir PU",
    lining: "Polyester",
    dimensions: "25 x 18 x 12 cm",
    weight: 0.7,
    shape: "Rectangle",
    styles: ["Mode", "Luxe", "Élégant"],
    pattern: "Solide",
    decoration: "Anneau doré",
    closure: "Fermeture éclair",
    handles: "Double poignée",
    season: "Toutes saisons",
    occasion: "Soirée",
    features: ["Résistant", "Élégant"],
    colors: ["Noir", "Rouge", "Beige"],
    gender: "Femme",
    ageGroup: "Adulte",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Ajouter d'autres produits par défaut...
];

const defaultCategories: Category[] = [
  {
    id: "luxury-cat-001",
    name: "Luxe",
    slug: "luxe",
    description: 'Sacs haut de gamme en cuir premium et finitions dorées',
    status: 'active' as const,
    displayOrder: 0,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "vintage-cat-002",
    name: "Vintage",
    slug: "vintage",
    description: 'Designs rétro et motifs géométriques tendance',
    status: 'active' as const,
    displayOrder: 1,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "business-cat-003",
    name: "Business",
    slug: "business",
    description: 'Sacs professionnels et fonctionnels pour le travail',
    status: 'active' as const,
    displayOrder: 2,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "casual-cat-005",
    name: "Casual",
    slug: "casual",
    description: 'Sacs pratiques et confortables pour tous les jours',
    status: 'active' as const,
    displayOrder: 3,
    productCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function StoreProvider({ children }: { children: ReactNode }) {
  // États
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis l'API
  const loadDataFromAPI = async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll()
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Erreur lors du chargement depuis l\'API:', err);
      setError('Impossible de charger les données depuis le serveur');
      
      // Fallback vers les données locales
      const localProducts = localStorage.getItem('mandemarket_products');
      const localCategories = localStorage.getItem('mandemarket_categories');
      
      if (localProducts && localCategories) {
        setProducts(JSON.parse(localProducts));
        setCategories(JSON.parse(localCategories));
      } else {
        setProducts(defaultProducts);
        setCategories(defaultCategories);
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    const initializeData = async () => {
      await loadDataFromAPI();
      setIsHydrated(true);
    };

    initializeData();
  }, []);

  // Sauvegarder en local quand les données changent
  useEffect(() => {
    if (isHydrated && products.length > 0) {
      localStorage.setItem('mandemarket_products', JSON.stringify(products));
    }
  }, [products, isHydrated]);

  useEffect(() => {
    if (isHydrated && categories.length > 0) {
      localStorage.setItem('mandemarket_categories', JSON.stringify(categories));
    }
  }, [categories, isHydrated]);

  // Actions produits
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const newProduct = await ProductService.create(productData);
      setProducts(prev => [...prev, newProduct]);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du produit:', err);
      setError('Impossible d\'ajouter le produit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    try {
      setLoading(true);
      const updatedProduct = await ProductService.update(id.toString(), productData);
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
    } catch (err) {
      console.error('Erreur lors de la mise à jour du produit:', err);
      setError('Impossible de mettre à jour le produit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      setLoading(true);
      await ProductService.delete(id.toString());
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression du produit:', err);
      setError('Impossible de supprimer le produit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await updateProduct(id, { status: newStatus });
    }
  };

  // Actions catégories
  const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'products'>) => {
    try {
      setLoading(true);
      const newCategory = await CategoryService.create(categoryData);
      setCategories(prev => [...prev, newCategory]);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la catégorie:', err);
      setError('Impossible d\'ajouter la catégorie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    try {
      setLoading(true);
      const updatedCategory = await CategoryService.update(id, categoryData);
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory : c));
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la catégorie:', err);
      setError('Impossible de mettre à jour la catégorie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    // Vérifier s'il y a des produits dans cette catégorie
    const categoryProducts = products.filter(p => p.categoryId === id);
    if (categoryProducts.length > 0) {
      throw new Error('Impossible de supprimer cette catégorie car elle contient des produits.');
    }

    try {
      setLoading(true);
      await CategoryService.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression de la catégorie:', err);
      setError('Impossible de supprimer la catégorie');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';
      await updateCategory(id, { status: newStatus });
    }
  };

  // Utilitaires
  const getActiveProducts = () => products.filter(p => p.status === 'active');
  const getActiveCategories = () => categories.filter(c => c.status === 'active');

  const refreshData = async () => {
    await loadDataFromAPI();
  };

  const resetToDefaults = () => {
    setProducts(defaultProducts);
    setCategories(defaultCategories);
    localStorage.setItem('mandemarket_products', JSON.stringify(defaultProducts));
    localStorage.setItem('mandemarket_categories', JSON.stringify(defaultCategories));
  };

  const value: StoreContextType = {
    // État
    products,
    categories,
    isHydrated,
    loading,
    error,

    // Actions produits
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,

    // Actions catégories
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,

    // Utilitaires
    getActiveProducts,
    getActiveCategories,
    refreshData,
    resetToDefaults
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    // Retourner un contexte par défaut au lieu de throw une erreur
    // Cela évite l'erreur React #130 pendant l'hydratation
    return {
      products: defaultProducts,
      categories: defaultCategories,
      isHydrated: false,
      loading: true,
      error: null,
      addProduct: async () => {},
      updateProduct: async () => {},
      deleteProduct: async () => {},
      toggleProductStatus: async () => {},
      addCategory: async () => {},
      updateCategory: async () => {},
      deleteCategory: async () => {},
      toggleCategoryStatus: async () => {},
      getActiveProducts: () => defaultProducts.filter(p => p.status === 'active'),
      getActiveCategories: () => defaultCategories.filter(c => c.status === 'active'),
      refreshData: async () => {},
      resetToDefaults: () => {},
    };
  }
  return context;
}

// Hook pour les erreurs
export function useStoreError() {
  const { error } = useStore();
  
  const clearError = () => {
    // Logique pour nettoyer l'erreur si nécessaire
  };

  return { error, clearError };
}

// Export des données par défaut pour les tests
export { defaultProducts, defaultCategories };
