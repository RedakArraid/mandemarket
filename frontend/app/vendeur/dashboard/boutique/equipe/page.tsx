'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

const ROLES = ['Administrateur','Gestionnaire produits','Gestionnaire commandes','Marketing','Comptable'];

export default function EquipePage() {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Équipe" description="Gérez les accès collaborateurs de votre boutique." action={
        <SellerActionButton variant="primary" onClick={() => setShow(true)}>+ Ajouter un membre</SellerActionButton>
      } />
      {show && (
        <SellerCard title="Inviter un membre">
          <form className="grid md:grid-cols-3 gap-3" onSubmit={(e)=>{e.preventDefault(); notifySoon('Invitation'); setShow(false);}}>
            <input required className="px-3 py-2 border rounded-lg text-sm" placeholder="Nom" />
            <input required type="email" className="px-3 py-2 border rounded-lg text-sm" placeholder="Email" />
            <select className="px-3 py-2 border rounded-lg text-sm">{ROLES.map(r=><option key={r}>{r}</option>)}</select>
            <div className="md:col-span-3"><SellerActionButton type="submit" variant="primary">Envoyer l’invitation</SellerActionButton></div>
          </form>
        </SellerCard>
      )}
      <SellerCard>
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div><p className="font-semibold">Vous (Administrateur)</p><p className="text-xs text-gray-500">Accès complet</p></div>
          <RowActions>
            <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Voir')}>Voir</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Permissions')}>Modifier les permissions</SellerActionButton>
            <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Suspendre')}>Suspendre l’accès</SellerActionButton>
            <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Renvoyer')}>Renvoyer l’invitation</SellerActionButton>
            <SellerActionButton size="sm" variant="danger" onClick={() => notifySoon('Supprimer')}>Supprimer</SellerActionButton>
          </RowActions>
        </div>
      </SellerCard>
    </div>
  );
}
