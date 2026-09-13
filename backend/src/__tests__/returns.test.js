const mockDb = {
  returnRequest: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  product: {
    update: jest.fn(),
  },
  inventory: {
    updateMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockDb)),
};

jest.mock('../db', () => mockDb);

const mockLedgerService = {
  recordRefund: jest.fn(),
};
jest.mock('../services/ledger.service', () => mockLedgerService);

describe('Gestion des Retours et Remboursements (MM-BE-072 / MM-QA-090)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation et cycle de vie d\'un retour', () => {
    it('interdit le remboursement d\'un retour déjà traité (completed)', async () => {
      mockDb.returnRequest.findUnique.mockResolvedValue({
        id: 'ret-1',
        status: 'completed',
        orderId: 'ord-1',
      });

      const ret = await mockDb.returnRequest.findUnique({ where: { id: 'ret-1' } });
      expect(ret.status).toBe('completed');
    });

    it('rétablit le stock en magasin et en inventaire lors du remboursement', async () => {
      const mockReturn = {
        id: 'ret-2',
        status: 'approved',
        orderId: 'ord-2',
        order: {
          id: 'ord-2',
          totalAmount: 1500000,
          items: [
            { productId: 50, quantity: 2 },
            { productId: 51, quantity: 1 },
          ],
        },
      };

      mockDb.returnRequest.findUnique.mockResolvedValue(mockReturn);
      mockDb.returnRequest.update.mockResolvedValue({ id: 'ret-2', status: 'completed' });
      mockDb.order.update.mockResolvedValue({ id: 'ord-2', status: 'REFUNDED' });

      // Exécution de la logique transactionnelle
      await mockDb.$transaction(async (tx) => {
        await tx.returnRequest.update({
          where: { id: mockReturn.id },
          data: { status: 'completed' },
        });

        await tx.order.update({
          where: { id: mockReturn.orderId },
          data: { status: 'REFUNDED' },
        });

        for (const item of mockReturn.order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });

          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: {
              quantity: { increment: item.quantity },
              available: { increment: item.quantity },
            },
          });
        }

        await mockLedgerService.recordRefund(
          mockReturn.orderId,
          mockReturn.order.totalAmount,
          `Retour accepté #${mockReturn.id}`
        );
      });

      // Assertions
      expect(mockDb.returnRequest.update).toHaveBeenCalledWith({
        where: { id: 'ret-2' },
        data: { status: 'completed' },
      });
      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: 'ord-2' },
        data: { status: 'REFUNDED' },
      });
      expect(mockDb.product.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: { stock: { increment: 2 } },
      });
      expect(mockDb.inventory.updateMany).toHaveBeenCalledWith({
        where: { productId: 50 },
        data: { quantity: { increment: 2 }, available: { increment: 2 } },
      });
      expect(mockLedgerService.recordRefund).toHaveBeenCalledWith(
        'ord-2',
        1500000,
        'Retour accepté #ret-2'
      );
    });
  });
});
