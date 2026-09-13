'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

export default function CampagnesPage() {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Campagnes" description="Promotion, nouveautés, vente flash, annonces et messages abonnés." action={
        <SellerActionButton variant="primary" onClick={() => setShow(true)}>+ Nouvelle campagne</SellerActionButton>
      } />
      {show && (
        <SellerCard title="Nouvelle campagne">
          <form className="grid md:grid-cols-2 gap-3 max-w-3xl" onSubmit={(e)=>{e.preventDefault(); notifySoon('Lancer campagne');}}>
            <select className="w-full px-3 py-2 border rounded-lg text-sm"><option>Promotion</option><option>Nouveautés</option><option>Vente flash</option><option>Annonce boutique</option><option>Message aux abonnés</option></select>
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nom de campagne" />
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Audience" />
            <input className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Produits" />
            <textarea className="md:col-span-2 w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Message" />
            <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <SellerActionButton type="button" variant="outline" onClick={() => notifySoon('Prévisualiser')}>Prévisualiser</SellerActionButton>
              <SellerActionButton type="button" variant="secondary" onClick={() => notifySoon('Brouillon')}>Enregistrer comme brouillon</SellerActionButton>
              <SellerActionButton type="button" variant="ghost" onClick={() => notifySoon('Programmer')}>Programmer</SellerActionButton>
              <SellerActionButton type="submit" variant="primary">Lancer maintenant</SellerActionButton>
            </div>
          </form>
        </SellerCard>
      )}
      <SellerCard title="Campagnes existantes">
        <div className="flex flex-col lg:flex-row justify-between gap-3 items-start lg:items-center">
          <div><p className="font-semibold">Nouveautés printemps</p><p className="text-xs text-gray-500">Brouillon</p></div>
          <RowActions>
            <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Voir')}>Voir</SellerActionButton>
            <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Modifier')}>Modifier</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Dupliquer')}>Dupliquer</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Suspendre')}>Suspendre</SellerActionButton>
            <SellerActionButton size="sm" variant="danger" onClick={() => notifySoon('Arrêter')}>Arrêter</SellerActionButton>
            <SellerActionButton size="sm" variant="ghost" href="/vendeur/dashboard/statistiques/marketing">Voir les résultats</SellerActionButton>
          </RowActions>
        </div>
      </SellerCard>
    </div>
  );
}
