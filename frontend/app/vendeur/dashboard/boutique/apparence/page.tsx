'use client';

import { SellerPageHeader, SellerHeaderActions, SellerActionButton, SellerCard, notifySoon } from '../../_components/ui';

export default function ApparencePage() {
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Apparence" description="Identité visuelle de votre boutique." action={
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Prévisualiser')}>Prévisualiser</SellerActionButton>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Enregistrer')}>Enregistrer les modifications</SellerActionButton>
          <SellerActionButton variant="secondary" href="/vendeur/dashboard/boutique">Voir ma boutique</SellerActionButton>
        </SellerHeaderActions>
      } />
      <SellerCard title="Logo">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Importer mon logo')}>Importer mon logo</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Changer')}>Changer</SellerActionButton>
          <SellerActionButton variant="danger" onClick={() => notifySoon('Supprimer')}>Supprimer</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
      <SellerCard title="Photo de couverture">
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Importer une couverture')}>Importer une couverture</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('Changer')}>Changer</SellerActionButton>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Repositionner')}>Repositionner</SellerActionButton>
          <SellerActionButton variant="danger" onClick={() => notifySoon('Supprimer')}>Supprimer</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
      <SellerCard title="Couleurs">
        <SellerActionButton variant="secondary" onClick={() => notifySoon('Choisir la couleur principale')}>Choisir la couleur principale</SellerActionButton>
      </SellerCard>
      <SellerCard title="Organisation">
        <SellerHeaderActions>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Produits vedettes')}>Choisir les produits vedettes</SellerActionButton>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Catégories à afficher')}>Choisir les catégories à afficher</SellerActionButton>
          <SellerActionButton variant="ghost" onClick={() => notifySoon('Réorganiser')}>Réorganiser</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
