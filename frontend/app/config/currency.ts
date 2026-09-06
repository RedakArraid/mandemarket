// Configuration de la devise pour MandeMarket
// Tous les prix sont en Francs CFA (XOF)

export const CURRENCY_CONFIG = {
  code: 'XOF', // ISO 4217 code pour Franc CFA
  symbol: 'FCFA',
  name: 'Franc CFA',
  locale: 'fr-FR',
  decimalDigits: 0, // FCFA n'utilise généralement pas de décimales
  thousandSeparator: ' ',
  decimalSeparator: ',',
  symbolPosition: 'after', // Le symbole FCFA vient après le montant
};

/**
 * Formate un montant en centimes vers FCFA
 * @param amountInCents Montant en centimes
 * @param showSymbol Afficher le symbole FCFA (défaut: true)
 * @returns Montant formaté (ex: "100 000 FCFA")
 */
export const formatCurrency = (
  amountInCents: number,
  showSymbol: boolean = true
): string => {
  const amountInFCFA = amountInCents / 100;
  
  const formatted = new Intl.NumberFormat(CURRENCY_CONFIG.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInFCFA);

  return showSymbol ? `${formatted} ${CURRENCY_CONFIG.symbol}` : formatted;
};

/**
 * Formate un montant en FCFA vers centimes pour stockage
 * @param amountInFCFA Montant en FCFA
 * @returns Montant en centimes
 */
export const parseCurrency = (amountInFCFA: number): number => {
  return Math.round(amountInFCFA * 100);
};

/**
 * Formate pour les inputs (sans symbole)
 * @param amountInCents Montant en centimes
 * @returns Montant en FCFA pour input
 */
export const formatForInput = (amountInCents: number): number => {
  return Math.round(amountInCents / 100);
};

/**
 * Valide un montant
 * @param amount Montant à valider
 * @returns true si valide
 */
export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount >= 0 && isFinite(amount);
};

/**
 * Formate de manière compacte (ex: "100K FCFA")
 * @param amountInCents Montant en centimes
 * @returns Montant formaté compact
 */
export const formatCurrencyCompact = (amountInCents: number): string => {
  const amountInFCFA = amountInCents / 100;
  
  if (amountInFCFA >= 1000000) {
    return `${(amountInFCFA / 1000000).toFixed(1)}M FCFA`;
  }
  if (amountInFCFA >= 1000) {
    return `${(amountInFCFA / 1000).toFixed(0)}K FCFA`;
  }
  return `${amountInFCFA.toFixed(0)} FCFA`;
};

export default {
  formatCurrency,
  parseCurrency,
  formatForInput,
  isValidAmount,
  formatCurrencyCompact,
  config: CURRENCY_CONFIG,
};

