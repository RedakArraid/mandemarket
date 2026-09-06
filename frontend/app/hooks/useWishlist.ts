'use client';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mandemarket_wishlist';

export function useWishlist() {
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setWishlistIds(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = (productId: number) => {
    setWishlistIds(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isInWishlist = (productId: number) => wishlistIds.includes(productId);

  return { wishlistIds, toggle, isInWishlist, count: wishlistIds.length };
}
