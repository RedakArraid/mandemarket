'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

export default function RetraitsPage() {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Retraits" description="Demandez un versement sur Mobile Money ou compte bancaire." action={
        <SellerActionButton variant="primary" onClick={() => setShow(true)}>+ Nouveau retrait</SellerActionButton>
      } />
      {show && (
        <SellerCard title="Nouveau retrait">
          <form className="grid md:grid-cols-2 gap-3 max-w-xl" onSubmit={(e)=>{e.preventDefault(); notifySoon('Confirmer le retrait'); setShow(false);}}>
            <select className="w-full px-3 py-2 border rounded-lg text-sm"><option>Mobile Money</option><option>Compte bancaire</option></select>
            <input required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Montant (FCFA)" />
            <div className="md:col-span-2"><SellerActionButton type="submit" variant="primary">Confirmer le retrait</SellerActionButton></div>
          </form>
        </SellerCard>
      )}
      <SellerCard title="Historique">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div><p className="font-semibold">Retrait #R-104</p><p className="text-xs text-gray-500">En attente · 50 000 FCFA</p></div>
          <RowActions>
            <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Voir')}>Voir</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Télécharger le reçu')}>Télécharger le reçu</SellerActionButton>
            <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/communication/support">Signaler un problème</SellerActionButton>
          </RowActions>
        </div>
      </SellerCard>
    </div>
  );
}
