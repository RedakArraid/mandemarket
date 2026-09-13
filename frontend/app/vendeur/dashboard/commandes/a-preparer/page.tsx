'use client';

import React from 'react';
import SellerOrdersView from '../_components/SellerOrdersView';

export default function Page() {
  return (
    <SellerOrdersView
      title="Commandes à préparer"
      description="Commandes confirmées en attente de préparation ou d'expédition."
      presetStatus="PENDING,CONFIRMED,PROCESSING"
    />
  );
}
