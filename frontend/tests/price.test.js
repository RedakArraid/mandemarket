const test = require('node:test');
const assert = require('node:assert');

// Utilitaires de conversion de prix testés en isolation
const formatPrice = (priceInCents) => {
  const priceInFCFA = priceInCents / 100;
  return `${priceInFCFA.toLocaleString('fr-FR')} FCFA`;
};

const formatPriceForInput = (priceInCents) => {
  return Math.round(priceInCents / 100);
};

const parsePrice = (priceInFCFA) => {
  return Math.round(priceInFCFA * 100);
};

const isValidPrice = (price) => {
  return !isNaN(price) && price >= 0 && isFinite(price);
};

const calculatePriceRange = (products) => {
  if (!products || products.length === 0) {
    return { min: 0, max: 5000000 };
  }
  const prices = products.map((p) => p.price).filter((p) => typeof p === 'number');
  if (prices.length === 0) return { min: 0, max: 5000000 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

test('formatPrice formate correctement les centimes en FCFA', () => {
  assert.strictEqual(formatPrice(1500000).replace(/\s/g, ' '), '15 000 FCFA');
  assert.strictEqual(formatPrice(0), '0 FCFA');
});

test('parsePrice convertit correctement les FCFA en centimes pour la base', () => {
  assert.strictEqual(parsePrice(15000), 1500000);
  assert.strictEqual(parsePrice(2500.5), 250050);
});

test('formatPriceForInput extrait les FCFA arrondis pour les formulaires', () => {
  assert.strictEqual(formatPriceForInput(1500000), 15000);
  assert.strictEqual(formatPriceForInput(250000), 2500);
});

test('isValidPrice valide les montants valides et rejette les montants négatifs/infinis', () => {
  assert.strictEqual(isValidPrice(100), true);
  assert.strictEqual(isValidPrice(0), true);
  assert.strictEqual(isValidPrice(-50), false);
  assert.strictEqual(isValidPrice(NaN), false);
  assert.strictEqual(isValidPrice(Infinity), false);
});

test('calculatePriceRange calcule min et max de manière fiable', () => {
  const products = [{ price: 500000 }, { price: 1200000 }, { price: 250000 }];
  const range = calculatePriceRange(products);
  assert.strictEqual(range.min, 250000);
  assert.strictEqual(range.max, 1200000);
});
