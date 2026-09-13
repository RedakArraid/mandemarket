'use client';

import React from 'react';
import SellerOrdersView from '../_components/SellerOrdersView';

export default function Page() {
  return (
    <SellerOrdersView
      title="Commandes expédiées"
      description="Commandes actuellement en cours d'acheminement auprès de vos clients."
      presetStatus="SHIPPED"
    />
  );
}
