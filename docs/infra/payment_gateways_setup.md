# Guide de Configuration et d'Exploitation des Passerelles de Paiement (MM-INF-040)

Ce document décrit l'architecture, la configuration et la politique d'exploitation sécurisée des passerelles de paiement (Stripe, Paystack, CinetPay) pour MandeMarket.

---

## 1. Matrice des Prestataires & Périmètres

| Prestataire | Région Principale | Devises | Moyens de Paiement | Mode de Vérification |
|---|---|---|---|---|
| **Paystack** | Côte d'Ivoire & Afrique de l'Ouest | XOF (centimes) | Mobile Money (MTN, Wave, Orange/Airtel), Cartes | Webhook HMAC SHA-512 + API `/transaction/verify/:ref` |
| **CinetPay** | Côte d'Ivoire & Afrique Centrale/Ouest | XOF | Mobile Money, Cartes locales | Notification IPN + Check API `/v2/payment/check` |
| **Stripe** | Europe & International | EUR, XOF | Carte bancaire (CB, Visa, Mastercard), SEPA | Webhook signature Stripe (`constructEvent`) |
| **Cash on Delivery** | Abidjan & villes couvertes | XOF | Espèces à la livraison | Transition `DELIVERED` par le livreur/gestionnaire |

---

## 2. Variables d'Environnement (Sandbox vs Production)

Les clés de test et de production doivent être strictement isolées :

```env
# ==========================================
# PAYSTACK
# ==========================================
# Test / Sandbox
PAYSTACK_SECRET_KEY="sk_test_..."
# Production (Live)
# PAYSTACK_SECRET_KEY="sk_live_..."

# ==========================================
# CINETPAY
# ==========================================
# Sandbox / Live
CINETPAY_API_KEY="..."
CINETPAY_SITE_ID="..."
CINETPAY_SECRET_KEY="..."

# ==========================================
# STRIPE
# ==========================================
# Test / Sandbox
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
# Production (Live)
# STRIPE_SECRET_KEY="sk_live_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 3. Configuration des Webhooks Publics

Dans les tableaux de bord respectifs des prestataires, configurez les URLs de rappel vers le domaine de l'API MandeMarket :

### A. Stripe
- **URL** : `https://api.mandemarket.com/api/payment/webhook/stripe`
- **Événements écoutés** :
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `charge.refunded`

### B. Paystack
- **URL** : `https://api.mandemarket.com/api/payment/webhook/paystack`
- **Événements écoutés** :
  - `charge.success`

### C. CinetPay
- **URL de notification** : `https://api.mandemarket.com/api/payment/notify/cinetpay`
- **Règle absolue** : MandeMarket n'accepte jamais le paiement sur la base du paramètre `cpm_result` seul. Le serveur effectue obligatoirement un appel serveur-à-serveur vers `https://api-checkout.cinetpay.com/v2/payment/check` pour valider le statut `ACCEPTED`.

---

## 4. Garde-Fous et Idempotence

1. **Dédoublonnage au niveau PostgreSQL (`PaymentEvent`)** :
   Chaque événement entrant génère une clé d'idempotence unique (`${gateway}_${transactionId}_${eventId}`). Toute réémission réseau est traitée de façon idempotente sans double incrémentation des stocks, du chiffre d'affaires ou des soldes vendeurs.
2. **Contrôle d'intégrité du montant et de la devise** :
   Avant tout passage de commande à l'état `CONFIRMED`, le montant effectivement débité est comparé au `totalAmount` fixé par le serveur. En cas d'incohérence, l'événement est rejeté et consigné en alerte de sécurité (`AuditLog`).
3. **Machine d'état stricte** :
   Une commande annulée ou déjà livrée ne peut pas être basculée vers un état incohérent lors d'une notification tardive.
