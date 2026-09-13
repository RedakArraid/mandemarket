'use client';

import React from 'react';
import SellerOrdersView from '../_components/SellerOrdersView';

export default function Page() {
  return (
    <SellerOrdersView
      title="Retours & remboursements"
      description="Suivi des retours et remboursements concernant vos articles vendus."
      presetStatus="REFUNDED"
    />
  );
}
