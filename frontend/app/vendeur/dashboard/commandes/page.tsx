'use client';

import React from 'react';
import SellerOrdersView from './_components/SellerOrdersView';

export default function Page() {
  return (
    <SellerOrdersView
      title="Toutes les commandes"
      description="Consultez, filtrez et gérez l'ensemble des commandes reçues sur votre boutique."
    />
  );
}
