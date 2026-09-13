'use client';

import { useState } from 'react';
import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

export default function LivraisonPage() {
  const [zones, setZones] = useState([{ id:1, name:'Abidjan', price:'2000', delay:'24-48h', freeFrom:'30000' }]);
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Livraison" description="Zones, tarifs et délais." action={
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => setZones(z=>[...z,{id:Date.now(),name:'Nouvelle zone',price:'0',delay:'',freeFrom:''}])}>+ Ajouter une zone</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Ajouter un mode de livraison')}>+ Ajouter un mode de livraison</SellerActionButton>
        </SellerHeaderActions>
      } />
      <SellerCard>
        <div className="space-y-4">
          {zones.map(z => (
            <div key={z.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="grid md:grid-cols-4 gap-2">
                <input className="px-3 py-2 border rounded-lg text-sm" value={z.name} onChange={()=>{}} placeholder="Zone" />
                <input className="px-3 py-2 border rounded-lg text-sm" value={z.price} placeholder="Tarif FCFA" />
                <input className="px-3 py-2 border rounded-lg text-sm" value={z.delay} placeholder="Délai" />
                <input className="px-3 py-2 border rounded-lg text-sm" value={z.freeFrom} placeholder="Gratuit à partir de" />
              </div>
              <RowActions>
                <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Modifier')}>Modifier</SellerActionButton>
                <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Désactiver')}>Désactiver</SellerActionButton>
                <SellerActionButton size="sm" variant="danger" onClick={() => setZones(zs=>zs.filter(x=>x.id!==z.id))}>Supprimer</SellerActionButton>
              </RowActions>
            </div>
          ))}
          <SellerHeaderActions>
            <SellerActionButton variant="primary" onClick={() => notifySoon('Enregistrer')}>Enregistrer</SellerActionButton>
            <SellerActionButton variant="secondary" onClick={() => setZones(z=>[...z,{id:Date.now(),name:'',price:'',delay:'',freeFrom:''}])}>Ajouter une autre zone</SellerActionButton>
          </SellerHeaderActions>
        </div>
      </SellerCard>
    </div>
  );
}
