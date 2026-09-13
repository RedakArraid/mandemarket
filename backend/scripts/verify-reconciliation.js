const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  console.log('🔍 Début de la vérification de réconciliation (Stocks & Finances)...\n');

  let discrepancies = 0;

  // 1. Vérification Stock : Inventory vs Product.stock
  console.log('📦 1. Vérification des stocks (Product.stock vs Inventory)...');
  const products = await db.product.findMany({
    include: { inventory: true },
  });

  for (const product of products) {
    if (!product.inventory) {
      console.warn(`  ⚠️ Produit ID ${product.id} ("${product.name}") n'a PAS d'enregistrement Inventory !`);
      discrepancies++;
    } else {
      const available = product.inventory.quantity - product.inventory.reserved;
      if (product.inventory.available !== available) {
        console.warn(`  ⚠️ Incohérence Inventory ID ${product.inventory.id}: available (${product.inventory.available}) != quantity (${product.inventory.quantity}) - reserved (${product.inventory.reserved})`);
        discrepancies++;
      }
      if (product.stock !== product.inventory.quantity) {
        console.warn(`  ⚠️ Divergence projection Product ID ${product.id}: Product.stock (${product.stock}) != Inventory.quantity (${product.inventory.quantity})`);
        discrepancies++;
      }
    }
  }

  // 2. Vérification Commandes : Somme des OrderItems vs Order.totalAmount
  console.log('\n🛒 2. Vérification de la ventilation des commandes...');
  const orders = await db.order.findMany({
    include: { items: true },
  });

  for (const order of orders) {
    const itemsTotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const calculatedTotal = itemsTotal + (order.shippingCost || 0) + (order.taxAmount || 0) - (order.discountAmount || 0);

    if (order.totalAmount !== calculatedTotal) {
      console.warn(`  ⚠️ Commande ID ${order.id} : totalAmount (${order.totalAmount}) != calcul (${calculatedTotal}) [items: ${itemsTotal}, port: ${order.shippingCost}, promo: -${order.discountAmount}]`);
      discrepancies++;
    }
  }

  // 3. Vérification Vendeurs : Ledger vs Projections Seller
  console.log('\n💼 3. Vérification des soldes vendeurs (SellerLedger vs Seller)...');
  const sellers = await db.seller.findMany({
    include: { ledgerEntries: true },
  });

  for (const seller of sellers) {
    const ledgerNetSum = seller.ledgerEntries
      .filter((e) => e.status !== 'CANCELLED')
      .reduce((sum, e) => sum + e.netAmount, 0);

    // Si des écritures de ledger existent, vérifier la cohérence
    if (seller.ledgerEntries.length > 0 && seller.totalEarnings !== ledgerNetSum) {
      console.warn(`  ⚠️ Vendeur ID ${seller.id} ("${seller.storeName}"): totalEarnings (${seller.totalEarnings}) != solde ledger (${ledgerNetSum})`);
      discrepancies++;
    }
  }

  console.log('\n========================================');
  if (discrepancies === 0) {
    console.log('✅ Réconciliation terminée : AUCUNE DIVERGENCE DÉTECTÉE.');
  } else {
    console.warn(`⚠️ Réconciliation terminée : ${discrepancies} divergence(s) détectée(s).`);
  }
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la vérification de réconciliation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
