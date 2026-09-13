const test = require('node:test');
const assert = require('node:assert');

// Logique pure de réduction d'état du panier
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(
        (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId
      );
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: newItems };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, variantId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
        ),
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}

function calculateCartTotals(items) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return { totalQuantity, subtotalCents };
}

test('ADD_ITEM ajoute un nouvel article ou incrémente si déjà présent', () => {
  let state = { items: [] };
  state = cartReducer(state, {
    type: 'ADD_ITEM',
    payload: { productId: 1, variantId: null, priceCents: 500000, quantity: 1 },
  });
  assert.strictEqual(state.items.length, 1);
  assert.strictEqual(state.items[0].quantity, 1);

  // Ajout du même article -> incrémentation
  state = cartReducer(state, {
    type: 'ADD_ITEM',
    payload: { productId: 1, variantId: null, priceCents: 500000, quantity: 2 },
  });
  assert.strictEqual(state.items.length, 1);
  assert.strictEqual(state.items[0].quantity, 3);
});

test('UPDATE_QUANTITY modifie ou supprime si quantité <= 0', () => {
  let state = {
    items: [{ productId: 2, variantId: 'v1', priceCents: 1000000, quantity: 2 }],
  };
  state = cartReducer(state, {
    type: 'UPDATE_QUANTITY',
    payload: { productId: 2, variantId: 'v1', quantity: 5 },
  });
  assert.strictEqual(state.items[0].quantity, 5);

  state = cartReducer(state, {
    type: 'UPDATE_QUANTITY',
    payload: { productId: 2, variantId: 'v1', quantity: 0 },
  });
  assert.strictEqual(state.items.length, 0);
});

test('calculateCartTotals calcule précisément les totaux en centimes', () => {
  const items = [
    { productId: 1, priceCents: 200000, quantity: 3 }, // 6 000 FCFA
    { productId: 2, priceCents: 450000, quantity: 2 }, // 9 000 FCFA
  ];
  const totals = calculateCartTotals(items);
  assert.strictEqual(totals.totalQuantity, 5);
  assert.strictEqual(totals.subtotalCents, 1500000); // 15 000 FCFA
});
