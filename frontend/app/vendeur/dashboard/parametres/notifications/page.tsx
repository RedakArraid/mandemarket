'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard } from '../../_components/ui';

const ITEMS = ['Nouvelle commande','Nouveau message','Nouvel avis','Nouvel abonné','Stock faible','Paiements','Marketing','Messages MandeMarket'];

export default function NotificationsPage() {
  const [on, setOn] = useState<Record<string, boolean>>(Object.fromEntries(ITEMS.map(i=>[i,true])));
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Notifications" description="Choisissez les alertes à recevoir." action={
        <SellerActionButton variant="primary" onClick={() => alert('Préférences enregistrées')}>Enregistrer</SellerActionButton>
      } />
      <SellerCard>
        <div className="space-y-3">
          {ITEMS.map(item => (
            <label key={item} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-medium text-brand-navy">{item}</span>
              <button type="button" onClick={() => setOn(s=>({...s,[item]:!s[item]}))} className={`w-11 h-6 rounded-full transition ${on[item]?'bg-brand-orange':'bg-gray-300'}`}>
                <span className={`block w-5 h-5 bg-white rounded-full transition translate-y-0.5 ${on[item]?'translate-x-5':'translate-x-0.5'}`} />
              </button>
            </label>
          ))}
        </div>
        <div className="mt-4"><SellerActionButton variant="primary" onClick={() => alert('Préférences enregistrées')}>Enregistrer</SellerActionButton></div>
      </SellerCard>
    </div>
  );
}
