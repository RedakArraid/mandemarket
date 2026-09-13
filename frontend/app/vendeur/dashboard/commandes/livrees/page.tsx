'use client';

import React from 'react';
import SellerOrdersView from '../_components/SellerOrdersView';

export default function Page() {
  return (
    <SellerOrdersView
      title="Commandes livrées"
      description="Historique des commandes livrées à vos clients et ouvrant droit à libération des gains."
      presetStatus="DELIVERED"
    />
  );
}
