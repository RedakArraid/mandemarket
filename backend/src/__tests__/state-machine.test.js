const mockDb = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  inventory: {
    update: jest.fn(),
  },
  payment: {
    update: jest.fn(),
  },
  promotion: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockDb)),
};

jest.mock('../db', () => mockDb);

jest.mock('../services/ledger.service', () => ({
  makeOrderFundsAvailable: jest.fn(),
  recordOrderRefund: jest.fn(),
}));

const {
  OrderService,
  ALLOWED_ORDER_TRANSITIONS,
  ALLOWED_PAYMENT_TRANSITIONS,
  ALLOWED_SHIPPING_TRANSITIONS,
} = require('../services/order.service');
const LedgerService = require('../services/ledger.service');

describe('Machines d\'État & Gestion de Stock (MM-QA-090)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Règles de transition d\'état', () => {
    it('définit des règles cohérentes pour les commandes', () => {
      expect(ALLOWED_ORDER_TRANSITIONS.PENDING).toEqual(['CONFIRMED', 'CANCELLED']);
      expect(ALLOWED_ORDER_TRANSITIONS.CONFIRMED).toEqual(['PROCESSING', 'CANCELLED']);
      expect(ALLOWED_ORDER_TRANSITIONS.PROCESSING).toEqual(['SHIPPED', 'CANCELLED']);
      expect(ALLOWED_ORDER_TRANSITIONS.SHIPPED).toEqual(['DELIVERED']);
      expect(ALLOWED_ORDER_TRANSITIONS.DELIVERED).toEqual(['REFUNDED']);
      expect(ALLOWED_ORDER_TRANSITIONS.CANCELLED).toEqual([]);
      expect(ALLOWED_ORDER_TRANSITIONS.REFUNDED).toEqual([]);
    });

    it('définit des règles cohérentes pour les paiements', () => {
      expect(ALLOWED_PAYMENT_TRANSITIONS.PENDING).toEqual(['PROCESSING', 'COMPLETED', 'FAILED']);
      expect(ALLOWED_PAYMENT_TRANSITIONS.PROCESSING).toEqual(['COMPLETED', 'FAILED']);
      expect(ALLOWED_PAYMENT_TRANSITIONS.COMPLETED).toEqual(['REFUNDED']);
      expect(ALLOWED_PAYMENT_TRANSITIONS.FAILED).toEqual([]);
      expect(ALLOWED_PAYMENT_TRANSITIONS.REFUNDED).toEqual([]);
    });

    it('définit des règles cohérentes pour la livraison', () => {
      expect(ALLOWED_SHIPPING_TRANSITIONS.PENDING).toEqual(['PROCESSING', 'SHIPPED']);
      expect(ALLOWED_SHIPPING_TRANSITIONS.SHIPPED).toEqual(['DELIVERED', 'RETURNED']);
    });
  });

  describe('transitionOrderStatus', () => {
    it('bloque une transition illégale et consigne un AuditLog (ex: DELIVERED -> PROCESSING)', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'DELIVERED',
        items: [],
      });

      await expect(
        OrderService.transitionOrderStatus('order-1', 'PROCESSING')
      ).rejects.toThrow('Transition de statut interdite de DELIVERED vers PROCESSING');

      expect(mockDb.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'INVALID_ORDER_TRANSITION',
            entityId: 'order-1',
          }),
        })
      );
    });

    it('libère le stock réservé lors de l\'annulation d\'une commande PENDING', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-2',
        status: 'PENDING',
        promotionCode: null,
        items: [
          { productId: 101, quantity: 2 },
          { productId: 102, quantity: 1 },
        ],
        payment: { id: 'pay-1', status: 'PENDING' },
      });

      mockDb.order.update.mockResolvedValue({
        id: 'order-2',
        status: 'CANCELLED',
      });

      const updated = await OrderService.transitionOrderStatus('order-2', 'CANCELLED', {
        reason: 'Client a annulé',
      });

      expect(updated.status).toBe('CANCELLED');
      // Vérifier la libération de stock
      expect(mockDb.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 101 },
          data: { reserved: { decrement: 2 }, available: { increment: 2 } },
        })
      );
      expect(mockDb.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 102 },
          data: { reserved: { decrement: 1 }, available: { increment: 1 } },
        })
      );
      // Le paiement en attente passe en FAILED
      expect(mockDb.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: { status: 'FAILED' },
        })
      );
    });

    it('déclenche le déblocage des fonds vendeur lors de la livraison (DELIVERED)', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-3',
        status: 'SHIPPED',
        items: [],
      });
      mockDb.order.update.mockResolvedValue({
        id: 'order-3',
        status: 'DELIVERED',
      });

      await OrderService.transitionOrderStatus('order-3', 'DELIVERED');

      expect(LedgerService.makeOrderFundsAvailable).toHaveBeenCalledWith('order-3', mockDb);
    });

    it('déclenche l\'inversion comptable lors du remboursement (REFUNDED)', async () => {
      mockDb.order.findUnique.mockResolvedValue({
        id: 'order-4',
        status: 'DELIVERED',
        items: [],
      });
      mockDb.order.update.mockResolvedValue({
        id: 'order-4',
        status: 'REFUNDED',
      });

      await OrderService.transitionOrderStatus('order-4', 'REFUNDED', {
        reason: 'Article défectueux',
      });

      expect(LedgerService.recordOrderRefund).toHaveBeenCalledWith(
        'order-4',
        { reason: 'Article défectueux' },
        mockDb
      );
    });
  });

  describe('expirePendingOrders', () => {
    it('annule automatiquement les commandes PENDING expirées', async () => {
      mockDb.order.findMany.mockResolvedValue([
        { id: 'exp-1', orderNumber: 'MM-260101-AAA1' },
        { id: 'exp-2', orderNumber: 'MM-260101-AAA2' },
      ]);

      jest.spyOn(OrderService, 'transitionOrderStatus').mockResolvedValue({ status: 'CANCELLED' });

      const result = await OrderService.expirePendingOrders(60);

      expect(result.expiredCount).toBe(2);
      expect(result.totalFound).toBe(2);
      expect(OrderService.transitionOrderStatus).toHaveBeenCalledTimes(2);
    });
  });
});
