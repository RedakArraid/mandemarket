'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import { XCircleIcon, ArrowPathIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

function CancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') ?? null;

  const shortOrderId = orderId ? orderId.substring(0, 8).toUpperCase() : '';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
          <XCircleIcon className="w-14 h-14 text-red-500" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
        Paiement non finalisé
      </h1>

      <p className="text-gray-600 mb-4">
        Le paiement a été interrompu ou annulé. Aucun prélèvement n&apos;a été effectué sur votre compte.
      </p>

      {orderId && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 mb-8 inline-block">
          <p className="text-sm text-gray-500 mb-1">Numéro de commande</p>
          <p className="text-xl font-bold text-orange-600 tracking-wider">#{shortOrderId}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 mb-8 text-left">
        <p className="text-sm text-gray-600 leading-relaxed">
          Vos articles sont actuellement réservés. Vous pouvez relancer le paiement avec le même mode ou choisir une autre méthode (carte bancaire, Mobile Money, ou paiement à la livraison lors d&apos;une nouvelle commande).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/checkout"
          className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 shadow transition-all"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Réessayer le paiement
        </Link>
        <Link
          href="/panier"
          className="flex items-center justify-center gap-2 py-3 px-6 bg-white border-2 border-orange-300 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-all"
        >
          <ShoppingBagIcon className="w-5 h-5" />
          Modifier mon panier
        </Link>
      </div>

      <div className="mt-8">
        <Link href="/boutique" className="text-sm text-gray-500 hover:text-orange-600 transition-colors font-medium">
          Retourner à la boutique
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
      <PublicHeader />
      <Suspense fallback={<div className="py-24 text-center text-gray-400">Chargement...</div>}>
        <CancelContent />
      </Suspense>
      <PublicFooter />
    </div>
  );
}
