const PricingService = require('../services/pricing.service');
const { ALLOWED_ORDER_TRANSITIONS, ALLOWED_PAYMENT_TRANSITIONS } = require('../services/order.service');

describe('Order & Pricing Engine Tests (Phase 3 - MM-BE-031 / MM-BE-033)', () => {
  describe('State Machine Transitions (MM-BE-033)', () => {
    test('PENDING order can only transition to CONFIRMED or CANCELLED', () => {
      expect(ALLOWED_ORDER_TRANSITIONS.PENDING).toEqual(['CONFIRMED', 'CANCELLED']);
      expect(ALLOWED_ORDER_TRANSITIONS.PENDING).not.toContain('DELIVERED');
      expect(ALLOWED_ORDER_TRANSITIONS.PENDING).not.toContain('SHIPPED');
    });

    test('CONFIRMED order can only transition to PROCESSING or CANCELLED', () => {
      expect(ALLOWED_ORDER_TRANSITIONS.CONFIRMED).toEqual(['PROCESSING', 'CANCELLED']);
    });

    test('SHIPPED order can only transition to DELIVERED', () => {
      expect(ALLOWED_ORDER_TRANSITIONS.SHIPPED).toEqual(['DELIVERED']);
    });

    test('DELIVERED order cannot be cancelled or shipped again', () => {
      expect(ALLOWED_ORDER_TRANSITIONS.DELIVERED).toEqual(['REFUNDED']);
      expect(ALLOWED_ORDER_TRANSITIONS.DELIVERED).not.toContain('CANCELLED');
    });

    test('Terminal states (CANCELLED, REFUNDED) have no transitions', () => {
      expect(ALLOWED_ORDER_TRANSITIONS.CANCELLED).toEqual([]);
      expect(ALLOWED_ORDER_TRANSITIONS.REFUNDED).toEqual([]);
    });

    test('Payment state machine transitions follow strict lifecycle', () => {
      expect(ALLOWED_PAYMENT_TRANSITIONS.PENDING).toEqual(['PROCESSING', 'COMPLETED', 'FAILED']);
      expect(ALLOWED_PAYMENT_TRANSITIONS.COMPLETED).toEqual(['REFUNDED']);
      expect(ALLOWED_PAYMENT_TRANSITIONS.FAILED).toEqual([]);
    });
  });

  describe('PricingService Shipping & Rates (MM-BE-031)', () => {
    test('getShippingOptions returns STANDARD, EXPRESS, and PICKUP options', () => {
      const optionsCI = PricingService.getShippingOptions('CI');
      expect(optionsCI.length).toBe(3);
      const codes = optionsCI.map(o => o.code);
      expect(codes).toContain('STANDARD');
      expect(codes).toContain('EXPRESS');
      expect(codes).toContain('PICKUP');

      const pickup = optionsCI.find(o => o.code === 'PICKUP');
      expect(pickup.cost).toBe(0);
    });

    test('getShippingOptions applies free shipping threshold for Côte d Ivoire', () => {
      const regular = PricingService.getShippingOptions('CI', 1000000); // 10 000 FCFA
      const standardRegular = regular.find(o => o.code === 'STANDARD');
      expect(standardRegular.cost).toBe(200000);

      const free = PricingService.getShippingOptions('CI', 6000000); // 60 000 FCFA (seuil 50k)
      const standardFree = free.find(o => o.code === 'STANDARD');
      expect(standardFree.cost).toBe(0);
    });

    test('calculateQuote rejects empty cart with informative error', async () => {
      await expect(
        PricingService.calculateQuote({ items: [] })
      ).rejects.toThrow('Le panier doit contenir au moins un article');
    });
  });
});
