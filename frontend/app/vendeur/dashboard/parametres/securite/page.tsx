'use client';

import { SellerPageHeader, SellerActionButton, SellerCard, SellerHeaderActions, notifySoon } from '../../_components/ui';

export default function SecuritePage() {
  return (
    <div className="space-y-4">
      <SellerPageHeader title="Sécurité" description="Protégez l’accès à votre espace vendeur." />
      <SellerCard>
        <SellerHeaderActions>
          <SellerActionButton variant="primary" onClick={() => notifySoon('Changer le mot de passe')}>Changer le mot de passe</SellerActionButton>
          <SellerActionButton variant="secondary" onClick={() => notifySoon('2FA')}>Activer la double authentification</SellerActionButton>
          <SellerActionButton variant="outline" onClick={() => notifySoon('Appareils')}>Voir les appareils connectés</SellerActionButton>
          <SellerActionButton variant="danger" onClick={() => notifySoon('Déconnecter les autres appareils')}>Déconnecter les autres appareils</SellerActionButton>
        </SellerHeaderActions>
      </SellerCard>
    </div>
  );
}
