'use client';

import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, RowActions, notifySoon } from '../../_components/ui';

export default function MessagesPage() {
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Messages clients" description="Conversations avec vos acheteurs." action={
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Nouveau message')}>Nouveau message</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Marquer comme lu')}>Marquer comme lu</SellerActionButton>
        </SellerHeaderActions>
      } />
      <SellerCard title="Boîte de réception">
        <div className="space-y-3">
          {['Aïcha K. — Commande #A12','Moussa D. — Question produit'].map((t,i)=>(
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-brand-navy mb-3">{t}</p>
              <RowActions>
                <SellerActionButton size="sm" variant="primary" onClick={() => notifySoon('Répondre')}>Répondre</SellerActionButton>
                <SellerActionButton size="sm" variant="secondary" href="/vendeur/dashboard/commandes">Voir la commande</SellerActionButton>
                <SellerActionButton size="sm" variant="outline" href="/vendeur/dashboard/produits">Voir le produit</SellerActionButton>
                <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Envoyer une image')}>Envoyer une image</SellerActionButton>
                <SellerActionButton size="sm" variant="ghost" onClick={() => notifySoon('Envoyer un document')}>Envoyer un document</SellerActionButton>
                <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Archiver')}>Archiver</SellerActionButton>
                <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Bloquer')}>Bloquer</SellerActionButton>
                <SellerActionButton size="sm" variant="danger" onClick={() => notifySoon('Signaler')}>Signaler</SellerActionButton>
              </RowActions>
            </div>
          ))}
        </div>
      </SellerCard>
    </div>
  );
}
