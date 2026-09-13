'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, notifySoon } from '../_components/ui';

export default function ComptePage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'' });
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Compte" description="Informations de votre compte vendeur." action={
        <SellerActionButton variant="primary" onClick={() => notifySoon('Enregistrer')}>Enregistrer</SellerActionButton>
      } />
      <SellerCard>
        <div className="grid md:grid-cols-2 gap-3 max-w-2xl">
          <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Modifier mes informations" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Changer mon email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Changer mon téléphone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
        </div>
        <div className="mt-4"><SellerActionButton variant="primary" onClick={() => notifySoon('Enregistrer')}>Enregistrer</SellerActionButton></div>
      </SellerCard>
    </div>
  );
}
