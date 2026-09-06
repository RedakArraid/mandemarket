'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product } from '../../types/index';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity: number, selectedColor?: string) => void;
  removeItem: (productId: number, selectedColor?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    const savedCart = localStorage.getItem('mandemarket_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Convertir les dates string en Date objects
        const cartWithDates = parsedCart.map((item: any) => ({
          ...item,
          product: {
            ...item.product,
            createdAt: new Date(item.product.createdAt),
            updatedAt: new Date(item.product.updatedAt),
          },
        }));
        setItems(cartWithDates);
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
        setItems([]);
      }
    }
    setIsHydrated(true);
  }, []);

  // Sauvegarder le panier dans localStorage quand il change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('mandemarket_cart', JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const addItem = (product: Product, quantity: number, selectedColor?: string) => {
    console.log('🛒 Ajout au panier:', { productId: product.id, name: product.name, quantity, selectedColor });
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === selectedColor
      );

      if (existingItemIndex >= 0) {
        // Mettre à jour la quantité si l'item existe déjà
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        console.log('✅ Quantité mise à jour:', updatedItems[existingItemIndex].quantity);
        return updatedItems;
      } else {
        // Ajouter un nouvel item
        const newItems = [...prevItems, { product, quantity, selectedColor }];
        console.log('✅ Nouvel item ajouté. Total items:', newItems.length);
        return newItems;
      }
    });
  };

  const removeItem = (productId: number, selectedColor?: string) => {
    console.log('🗑️ Suppression du panier:', { productId, selectedColor });
    setItems((prevItems) => {
      const filtered = prevItems.filter(
        (item) => !(item.product.id === productId && item.selectedColor === selectedColor)
      );
      console.log('✅ Item supprimé. Restants:', filtered.length);
      return filtered;
    });
  };

  const updateQuantity = (productId: number, quantity: number, selectedColor?: string) => {
    if (quantity <= 0) {
      removeItem(productId, selectedColor);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId && item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: number): number => {
    const item = items.find((item) => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Calculer totalItems et totalPrice avec useMemo pour éviter les recalculs inutiles
  const totalItems = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    console.log('📊 Calcul totalItems:', total, 'items:', items.length);
    return total;
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [items]);

  // Debug: log du total items quand il change
  useEffect(() => {
    if (isHydrated) {
      console.log('📊 Panier mis à jour:', { 
        totalItems, 
        totalPrice, 
        itemsCount: items.length,
        items: items.map(i => ({ id: i.product.id, qty: i.quantity }))
      });
    }
  }, [totalItems, totalPrice, items.length, isHydrated, items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

