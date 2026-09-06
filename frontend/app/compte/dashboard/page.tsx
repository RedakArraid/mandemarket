'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  StarIcon,
  ArrowRightIcon,
  ArrowLeftStartOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: 'En traitement', color: 'bg-violet-100 text-violet-800' },
  SHIPPED: { label: 'Expédiée', color: 'bg-orange-100 text-orange-800' },
  DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
  REFUNDED: { label: 'Remboursée', color: 'bg-gray-100 text-gray-800' },
};

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { id: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading, logout } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/compte/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchOrders = async () => {
      const token = localStorage.getItem('mandemarket_customer_token');
      try {
        const res = await fetch(`${API}/api/account/orders?limit=3`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        // silently fail
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
        <PublicHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (!customer) return null;

  const totalSpentFCFA = Math.round(customer.totalSpent / 100);
  const initials = `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
      <PublicHeader />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header bienvenue */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {initials}
              </div>
              <div>
                <p className="text-orange-100 text-sm">Bienvenue de retour,</p>
                <h1 className="text-2xl font-bold text-white">
                  {customer.firstName} {customer.lastName}
                </h1>
                <p className="text-orange-200 text-sm">{customer.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium transition-all text-sm"
            >
              <ArrowLeftStartOnRectangleIcon className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBagIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total dépensé</p>
              <p className="text-2xl font-bold text-gray-900">{totalSpentFCFA.toLocaleString()} <span className="text-base font-medium text-gray-500">FCFA</span></p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <StarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Points fidélité</p>
              <p className="text-2xl font-bold text-gray-900">{customer.loyaltyPoints}</p>
            </div>
          </div>
        </div>

        {/* Commandes récentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Commandes récentes</h2>
            <Link
              href="/compte/commandes"
              className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
            >
              Voir toutes
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune commande pour le moment</p>
              <Link
                href="/boutique"
                className="mt-4 inline-block px-6 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors text-sm"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                const totalFCFA = Math.round(order.totalAmount / 100);
                return (
                  <Link
                    key={order.id}
                    href={`/compte/commandes/${order.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <ShoppingBagIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' · '}{order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-bold text-gray-900 text-sm hidden sm:block">
                        {totalFCFA.toLocaleString()} FCFA
                      </span>
                      <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bouton déconnexion mobile */}
        <button
          onClick={handleLogout}
          className="sm:hidden mt-6 w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 px-4 py-3 rounded-xl font-medium transition-all"
        >
          <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
          Se déconnecter
        </button>
      </div>

      <PublicFooter />
    </div>
  );
}
