'use client';

import React from 'react';
import SellerOrdersView from '../_components/SellerOrdersView';

export default function Page() {
  return (
    <SellerOrdersView
      title="Commandes annulées"
      description="Historique des commandes annulées par le client ou le service logistique."
      presetStatus="CANCELLED"
    />
  );
}
