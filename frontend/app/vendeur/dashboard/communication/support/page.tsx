'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

const CATS = ['Commande','Produit','Paiement','Retrait','Livraison','Marketing','Compte','Problème technique','Autre'];

export default function SupportPage() {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Support MandinMarket" description="Tickets traités par les Super Admin." action={
        <SellerActionButton variant="primary" onClick={() => setShow(true)}>+ Nouvelle demande</SellerActionButton>
      } />
      {show && (
        <SellerCard title="Nouvelle demande">
          <form className="space-y-3 max-w-xl" onSubmit={(e)=>{e.preventDefault(); notifySoon('Envoyer'); setShow(false);}}>
            <select className="w-full px-3 py-2 border rounded-lg text-sm">{CATS.map(c=><option key={c}>{c}</option>)}</select>
            <textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={4} placeholder="Décrivez votre demande" />
            <div className="flex flex-wrap gap-2">
              <SellerActionButton type="button" variant="outline" onClick={() => notifySoon('Pièce jointe')}>Ajouter une pièce jointe</SellerActionButton>
              <SellerActionButton type="submit" variant="primary">Envoyer</SellerActionButton>
            </div>
          </form>
        </SellerCard>
      )}
      <SellerCard title="Tickets">
        {[{id:'T-12',s:'En attente'},{id:'T-09',s:'En cours'},{id:'T-03',s:'Résolu'}].map(t => (
          <div key={t.id} className="flex flex-col lg:flex-row justify-between gap-3 py-3 border-b last:border-0">
            <div><p className="font-semibold">{t.id}</p><p className="text-xs text-gray-500">{t.s}</p></div>
            <RowActions>
              <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Voir')}>Voir</SellerActionButton>
              <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Répondre')}>Répondre</SellerActionButton>
              <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Pièce jointe')}>Ajouter une pièce jointe</SellerActionButton>
              <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Fermer')}>Fermer le ticket</SellerActionButton>
              <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Rouvrir')}>Rouvrir</SellerActionButton>
            </RowActions>
          </div>
        ))}
      </SellerCard>
    </div>
  );
}
