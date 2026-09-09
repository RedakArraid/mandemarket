'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BanknotesIcon,
  CurrencyEuroIcon,
  ShoppingBagIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CreditCardIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  EyeIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AuthService, SellerService, ProductService, CategoryService } from '../../config/api';
import CloudinaryImageUpload from '../../components/CloudinaryImageUpload';

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'mtn_money', label: 'MTN Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En traitement',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  completed: 'Complété',
  rejected: 'Rejeté',
};

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'used_good', label: 'Occasion - Bon état' },
  { value: 'used_fair', label: 'Occasion - État correct' },
  { value: 'refurbished', label: 'Reconditionné' },
];

const PIE_COLORS = ['#1A8F5C', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'];

type Section = 'overview' | 'products' | 'orders' | 'stats' | 'payments' | 'profile';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: ChartBarIcon },
  { id: 'products', label: 'Produits', icon: CubeIcon },
  { id: 'orders', label: 'Commandes', icon: ShoppingBagIcon },
  { id: 'stats', label: 'Statistiques', icon: ChartBarIcon },
  { id: 'payments', label: 'Paiements', icon: BanknotesIcon },
  { id: 'profile', label: 'Profil boutique', icon: BuildingStorefrontIcon },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR') + ' FCFA';
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function statusBadge(status: string, colors: Record<string, string>, labels: Record<string, string>) {
  const key = status?.toUpperCase() in colors ? status.toUpperCase() : status;
  const cls = colors[key] || colors[status] || 'bg-gray-100 text-gray-600';
  const label = labels[key] || labels[status] || status;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-gray-400 text-sm">{message}</div>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  return (
    <div className={`animate-spin rounded-full border-b-2 border-orange-500 ${sz}`} />
  );
}

// ─── Section: Overview ───────────────────────────────────────────────────────

function OverviewSection({
  earnings,
  products,
  orders,
  onNavigate,
}: {
  earnings: any;
  products: any[];
  orders: any[];
  onNavigate: (s: Section) => void;
}) {
  const activeProducts = products.filter((p) => p.status === 'active').length;
  const lowStock = products.filter((p) => p.stock <= 5).length;
  const recentOrders = orders.slice(0, 5);
  const recentProducts = products.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          icon={BanknotesIcon}
          label="Chiffre d'affaires"
          value={fmt(earnings?.totalSales ?? 0)}
          color="bg-green-500"
        />
        <KpiCard
          icon={CurrencyEuroIcon}
          label="Revenus nets"
          value={fmt(earnings?.totalEarnings ?? 0)}
          subtitle={`Commission ${earnings?.commissionRate ?? 0}%`}
          color="bg-orange-500"
        />
        <KpiCard
          icon={ShoppingBagIcon}
          label="Commandes"
          value={earnings?.totalOrders ?? 0}
          color="bg-blue-500"
        />
        <KpiCard
          icon={CubeIcon}
          label="Produits actifs"
          value={activeProducts}
          color="bg-purple-500"
        />
        <KpiCard
          icon={ExclamationTriangleIcon}
          label="Stock faible"
          value={lowStock}
          subtitle={lowStock > 0 ? 'Produits avec stock ≤ 5' : 'Aucun produit en rupture'}
          color={lowStock > 0 ? 'bg-red-500' : 'bg-green-500'}
        />
        <KpiCard
          icon={ClockIcon}
          label="Versement en attente"
          value={fmt(earnings?.pendingPayoutAmount ?? 0)}
          color="bg-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Commandes récentes</h3>
          {recentOrders.length === 0 ? (
            <EmptyState message="Aucune commande pour le moment." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b">
                    <th className="pb-2 text-left font-medium">N° commande</th>
                    <th className="pb-2 text-left font-medium">Client</th>
                    <th className="pb-2 text-left font-medium">Montant</th>
                    <th className="pb-2 text-left font-medium">Statut</th>
                    <th className="pb-2 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="py-2 font-mono text-xs text-gray-500">#{String(o.id).slice(0, 8)}</td>
                      <td className="py-2">{o.customer?.firstName} {o.customer?.lastName}</td>
                      <td className="py-2 font-medium">{fmt(o.totalAmount ?? 0)}</td>
                      <td className="py-2">{statusBadge(o.status, STATUS_COLORS, STATUS_LABELS)}</td>
                      <td className="py-2 text-gray-400">{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Produits récents</h3>
          {recentProducts.length === 0 ? (
            <EmptyState message="Aucun produit. Ajoutez votre premier produit." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase border-b">
                    <th className="pb-2 text-left font-medium">Produit</th>
                    <th className="pb-2 text-left font-medium">Prix</th>
                    <th className="pb-2 text-left font-medium">Stock</th>
                    <th className="pb-2 text-left font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentProducts.map((p: any) => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${p.stock <= 5 ? 'bg-yellow-50' : ''}`}>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          {p.image && (
                            <img src={p.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="truncate max-w-[140px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2 font-medium">{fmt(p.price ?? 0)}</td>
                      <td className="py-2">
                        <span className={p.stock <= 5 ? 'text-red-600 font-semibold' : ''}>{p.stock}</span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {p.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Ajouter un produit
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Voir les commandes
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
          >
            <BanknotesIcon className="w-4 h-4" />
            Demander un versement
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────

const EMPTY_PRODUCT_FORM = {
  name: '',
  price: '' as string | number,
  categoryId: '',
  image: '',
  description: '',
  stock: 0,
  sku: '',
  status: 'active',
  colors: '',
  features: '',
  brand: '',
  condition: 'new',
};

function ProductForm({
  initial,
  categories,
  onSave,
  onCancel,
}: {
  initial?: any;
  categories: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_PRODUCT_FORM,
    ...(initial
      ? {
          name: initial.name || '',
          price: initial.price ? initial.price / 100 : '',
          categoryId: initial.categoryId || '',
          image: initial.image || '',
          description: initial.description || '',
          stock: initial.stock ?? 0,
          sku: initial.sku || '',
          status: initial.status || 'active',
          colors: Array.isArray(initial.colors) ? initial.colors.join(', ') : (initial.colors || ''),
          features: Array.isArray(initial.features) ? initial.features.join(', ') : (initial.features || ''),
          brand: initial.brand || '',
          condition: initial.condition || 'new',
        }
      : {}),
  });
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Math.round(parseFloat(String(form.price)) * 100),
        categoryId: form.categoryId,
        image: form.image,
        description: form.description,
        stock: parseInt(String(form.stock)) || 0,
        sku: form.sku,
        status: form.status,
        colors: form.colors ? form.colors.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        features: form.features ? form.features.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        brand: form.brand,
        condition: form.condition,
        styles: [],
      };
      await onSave(payload);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {initial ? 'Modifier le produit' : 'Nouveau produit'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="Nom du produit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix en FCFA *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="Ex: 25000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="">Choisir une catégorie...</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
            <input
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="Marque du produit"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
          <CloudinaryImageUpload
            currentImage={form.image}
            onImageChange={(url) => set('image', url)}
            placeholder="Choisir une image pour le produit"
            maxSize={5 * 1024 * 1024}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
            placeholder="Description du produit..."
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <input
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="SKU-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select
              value={form.condition}
              onChange={(e) => set('condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            >
              {CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleurs (séparées par virgule)</label>
            <input
              value={form.colors}
              onChange={(e) => set('colors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="Rouge, Bleu, Vert"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caractéristiques (séparées par virgule)</label>
            <input
              value={form.features}
              onChange={(e) => set('features', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="Imperméable, Résistant, Léger"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Section: Products ───────────────────────────────────────────────────────

function ProductsSection({
  products,
  categories,
  total,
  pages,
  currentPage,
  onPageChange,
  onRefresh,
  openFormOnMount,
}: {
  products: any[];
  categories: any[];
  total: number;
  pages: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  onRefresh: () => Promise<void>;
  openFormOnMount: boolean;
}) {
  const [showForm, setShowForm] = useState(openFormOnMount);
  const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSave = async (payload: any) => {
    try {
      setError('');
      if (editing) {
        await ProductService.update(String(editing.id), payload);
      } else {
        await ProductService.create(payload);
      }
      setShowForm(false);
      setEditing(null);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      throw err;
    }
  };

  const handleEdit = (p: any) => {
    setEditing(p);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit définitivement ?')) return;
    try {
      setError('');
      await ProductService.delete(String(id));
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mes produits</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} produit{total !== 1 ? 's' : ''} au total</p>
        </div>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Ajouter un produit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {showForm && (
        <ProductForm
          initial={editing}
          categories={categories}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {products.length === 0 ? (
          <EmptyState message="Aucun produit. Cliquez sur « Ajouter un produit » pour commencer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p: any) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.stock <= 5 ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || 'https://via.placeholder.com/48'}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmt(p.price ?? 0)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.stock}
                        {p.stock <= 5 && <ExclamationTriangleIcon className="w-4 h-4 inline ml-1 text-red-500" />}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {currentPage} sur {pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Orders ─────────────────────────────────────────────────────────

const ORDER_FILTER_TABS = [
  { label: 'Toutes', value: '' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Confirmées', value: 'CONFIRMED' },
  { label: 'Expédiées', value: 'SHIPPED' },
  { label: 'Livrées', value: 'DELIVERED' },
  { label: 'Annulées', value: 'CANCELLED' },
];

function OrdersSection({
  orders,
  total,
  pages,
  currentPage,
  currentStatus,
  onPageChange,
  onStatusChange,
}: {
  orders: any[];
  total: number;
  pages: number;
  currentPage: number;
  currentStatus: string;
  onPageChange: (p: number) => void;
  onStatusChange: (s: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(o.id).toLowerCase().includes(q) ||
      `${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Commandes</h2>
        <p className="text-sm text-gray-500 mt-0.5">{total} commande{total !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-1">
            {ORDER_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onStatusChange(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentStatus === tab.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-48"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message="Aucune commande trouvée." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° commande</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livraison</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o: any) => (
                  <>
                    <tr
                      key={o.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggle(o.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{String(o.id).slice(0, 8)}</td>
                      <td className="px-4 py-3 text-sm">{o.customer?.firstName} {o.customer?.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {Array.isArray(o.items) ? `${o.items.length} article${o.items.length > 1 ? 's' : ''}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{fmt(o.totalAmount ?? 0)}</td>
                      <td className="px-4 py-3 text-sm">
                        {o.payment ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {o.payment.status === 'paid' ? 'Payé' : o.payment.status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {o.shipping?.status ? (
                          <span className="text-xs text-gray-600">{o.shipping.status}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3">{statusBadge(o.status, STATUS_COLORS, STATUS_LABELS)}</td>
                      <td className="px-4 py-3 text-right">
                        {expandedId === o.id
                          ? <ChevronUpIcon className="w-4 h-4 text-gray-400 ml-auto" />
                          : <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-auto" />}
                      </td>
                    </tr>
                    {expandedId === o.id && (
                      <tr key={`${o.id}-detail`}>
                        <td colSpan={9} className="px-6 py-5 bg-orange-50 border-t border-orange-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            {/* Items */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Articles</h4>
                              {Array.isArray(o.items) && o.items.length > 0 ? (
                                <ul className="space-y-1">
                                  {o.items.map((item: any, idx: number) => (
                                    <li key={idx} className="flex justify-between">
                                      <span>{item.product?.name || 'Produit'} × {item.quantity}</span>
                                      <span className="font-medium">{fmt(item.unitPrice ?? 0)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : <p className="text-gray-400">—</p>}
                            </div>
                            {/* Customer */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Client</h4>
                              <p>{o.customer?.firstName} {o.customer?.lastName}</p>
                              {o.customer?.email && <p className="text-gray-400">{o.customer.email}</p>}
                              {o.shippingAddress && (
                                <p className="text-gray-400 mt-1">
                                  {[o.shippingAddress.address, o.shippingAddress.city, o.shippingAddress.country].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                            {/* Payment & Shipping */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-2">Paiement & Livraison</h4>
                              {o.payment && (
                                <p>Mode : <span className="font-medium">{o.payment.method || '—'}</span></p>
                              )}
                              {o.shipping?.trackingCode && (
                                <p className="mt-1">Suivi : <span className="font-mono text-orange-700">{o.shipping.trackingCode}</span></p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {currentPage} sur {pages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Stats ──────────────────────────────────────────────────────────

function StatsSection({ orders, products }: { orders: any[]; products: any[] }) {
  // Build daily revenue from orders (last 30 days)
  const dailyRevenue = (() => {
    const now = new Date();
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    orders.forEach((o: any) => {
      const day = String(o.createdAt || '').slice(0, 10);
      if (day in map) {
        map[day] = (map[day] || 0) + (o.totalAmount || 0);
      }
    });
    return Object.entries(map).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      revenue: revenue / 100,
    }));
  })();

  // Top products by revenue from order items
  const productRevenue: Record<string, { name: string; revenue: number; units: number }> = {};
  orders.forEach((o: any) => {
    if (!Array.isArray(o.items)) return;
    o.items.forEach((item: any) => {
      const name = item.product?.name || 'Inconnu';
      const id = item.product?.id || name;
      if (!productRevenue[id]) productRevenue[id] = { name, revenue: 0, units: 0 };
      productRevenue[id].revenue += (item.unitPrice || 0) * (item.quantity || 1);
      productRevenue[id].units += item.quantity || 1;
    });
  });
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((p) => ({ ...p, revenue: p.revenue / 100 }));

  // Orders by status
  const statusCounts: Record<string, number> = {};
  orders.forEach((o: any) => {
    const key = o.status?.toUpperCase() || 'UNKNOWN';
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
  }));

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée disponible.</p>
          <p className="text-sm text-gray-400 mt-1">Les statistiques apparaîtront dès que vous aurez des commandes.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Statistiques</h2>
        <p className="text-sm text-gray-400">Données basées sur vos {orders.length} dernières commandes</p>
      </div>

      <div className="space-y-6">
        {/* Revenue Area Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Chiffre d'affaires — 30 derniers jours</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A8F5C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A8F5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${v.toLocaleString()}`} />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Revenus']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#1A8F5C"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Top produits par revenus</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#374151' }} width={100} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Revenus']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="revenue" fill="#1A8F5C" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Orders by Status Pie */}
          {pieData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Commandes par statut</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, 'Commandes']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Payments ───────────────────────────────────────────────────────

function PaymentsSection({
  earnings,
  payouts,
  profile,
  onProfileUpdate,
  onPayoutsRefresh,
}: {
  earnings: any;
  payouts: any[];
  profile: any;
  onProfileUpdate: (p: any) => void;
  onPayoutsRefresh: () => Promise<void>;
}) {
  const [paymentForm, setPaymentForm] = useState({
    method: profile?.paymentInfo?.method || 'mobile_money',
    accountNumber: profile?.paymentInfo?.accountNumber || '',
    accountName: profile?.paymentInfo?.accountName || '',
    operator: profile?.paymentInfo?.operator || '',
  });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const paidOut = payouts
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const available = (earnings?.totalEarnings ?? 0) - paidOut;

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);
    setError('');
    setSuccess('');
    try {
      await SellerService.updateMyProfile({ paymentInfo: paymentForm });
      onProfileUpdate({ paymentInfo: paymentForm });
      setSuccess('Informations de paiement enregistrées.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSavingPayment(false);
    }
  };

  const requestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const amount = Math.round(parseFloat(payoutAmount) * 100);
    if (!amount || amount <= 0) {
      setError('Montant invalide');
      return;
    }
    if (!profile?.paymentInfo?.accountNumber && !paymentForm.accountNumber) {
      setError('Configurez vos informations de paiement d\'abord.');
      return;
    }
    if (amount > available) {
      setError('Montant supérieur au solde disponible.');
      return;
    }
    setRequestingPayout(true);
    try {
      await SellerService.requestPayout(amount);
      setPayoutAmount('');
      setSuccess('Demande de versement envoyée.');
      await onPayoutsRefresh();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la demande');
    } finally {
      setRequestingPayout(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Paiements & Versements</h2>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Balance Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BanknotesIcon className="w-5 h-5 text-orange-500" />
            Solde disponible
          </h3>
          <p className="text-4xl font-bold text-orange-600 mb-1">{fmt(Math.max(0, available))}</p>
          <p className="text-sm text-gray-400">
            Revenus totaux : {fmt(earnings?.totalEarnings ?? 0)} — Versé : {fmt(paidOut)}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Taux de commission : <strong>{earnings?.commissionRate ?? 0}%</strong></p>
            {(earnings?.pendingPayoutAmount ?? 0) > 0 && (
              <p className="text-sm text-yellow-600">En attente : {fmt(earnings.pendingPayoutAmount)}</p>
            )}
          </div>
        </div>

        {/* Payout Request */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Demander un versement</h3>
          <form onSubmit={requestPayout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="Ex: 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={requestingPayout || !payoutAmount}
              className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {requestingPayout ? 'Envoi en cours...' : 'Demander le versement'}
            </button>
          </form>
        </div>
      </div>

      {/* Payment Info Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-orange-500" />
          Informations de paiement
        </h3>
        <form onSubmit={savePayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du titulaire</label>
              <input
                required
                value={paymentForm.accountName}
                onChange={(e) => setPaymentForm((f) => ({ ...f, accountName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Nom complet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° compte / téléphone</label>
              <input
                required
                value={paymentForm.accountNumber}
                onChange={(e) => setPaymentForm((f) => ({ ...f, accountNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Ex: 07 XX XX XX XX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opérateur (optionnel)</label>
              <input
                value={paymentForm.operator}
                onChange={(e) => setPaymentForm((f) => ({ ...f, operator: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Ex: Orange CI"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPayment}
            className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {savingPayment ? 'Enregistrement...' : 'Enregistrer les informations'}
          </button>
        </form>
      </div>

      {/* Payouts History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Historique des versements</h3>
        </div>
        {payouts.length === 0 ? (
          <EmptyState message="Aucun versement pour le moment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{fmt(p.amount ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYOUT_STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {PAYOUT_STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-400">{p.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({
  profile,
  onProfileUpdate,
}: {
  profile: any;
  onProfileUpdate: (p: any) => void;
}) {
  const [form, setForm] = useState({
    storeName: profile?.storeName || '',
    description: profile?.description || '',
    logo: profile?.logo || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await SellerService.updateMyProfile(form);
      onProfileUpdate(form);
      setSuccess('Profil mis à jour avec succès.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Profil boutique</h2>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input
              required
              value={form.storeName}
              onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              placeholder="Nom de votre boutique"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
              placeholder="Décrivez votre boutique..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la boutique</label>
            <CloudinaryImageUpload
              currentImage={form.logo}
              onImageChange={(url) => setForm((f) => ({ ...f, logo: url }))}
              placeholder="Choisir un logo"
              maxSize={5 * 1024 * 1024}
            />
          </div>

          {profile?.slug && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Lien de votre boutique :{' '}
                <Link href={`/vendeur/${profile.slug}`} className="text-orange-600 hover:underline font-medium" target="_blank">
                  /vendeur/{profile.slug}
                </Link>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function VendeurDashboardPage() {
  const router = useRouter();

  // Global state
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('overview');
  const [profile, setProfile] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPages, setOrderPages] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState('');

  // Payouts state
  const [payouts, setPayouts] = useState<any[]>([]);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lazy load tracking
  const loadedSections = useRef<Set<Section>>(new Set());
  const [openProductFormOnMount, setOpenProductFormOnMount] = useState(false);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push('/admin/login');
        return;
      }

      const userStr = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.role && u.role !== 'seller') {
            router.push('/admin/dashboard');
            return;
          }
          setUserEmail(u.email || '');
        } catch {}
      }

      const results = await Promise.allSettled([
        SellerService.getMyProfile(),
        SellerService.getMyEarnings(),
        SellerService.getMyProducts(1),
        SellerService.getMyOrders(1),
        SellerService.getMyPayouts(),
        CategoryService.getAll(),
      ]);

      if (results[0].status === 'fulfilled') setProfile(results[0].value);
      if (results[1].status === 'fulfilled') setEarnings(results[1].value);
      if (results[2].status === 'fulfilled') {
        const r = results[2].value;
        setProducts(r?.products || []);
        setProductTotal(r?.total || 0);
        setProductPages(r?.pages || 1);
      }
      if (results[3].status === 'fulfilled') {
        const r = results[3].value;
        setOrders(r?.orders || []);
        setOrderTotal(r?.total || 0);
        setOrderPages(r?.pages || 1);
      }
      if (results[4].status === 'fulfilled') {
        const r = results[4].value;
        setPayouts(Array.isArray(r) ? r : r?.payouts || []);
      }
      if (results[5].status === 'fulfilled') {
        const cats = results[5].value;
        setCategories(Array.isArray(cats) ? cats.filter((c: any) => c.status !== 'inactive') : []);
      }

      loadedSections.current.add('overview');
      setLoading(false);
    };

    init();
  }, [router]);

  // ── Section change with lazy load ────────────────────────────────────────
  const navigateTo = useCallback(async (s: Section, opts?: { openProductForm?: boolean }) => {
    setSection(s);
    setSidebarOpen(false);
    if (opts?.openProductForm) setOpenProductFormOnMount(true);

    if (loadedSections.current.has(s)) return;
    loadedSections.current.add(s);

    if (s === 'products') {
      const r = await SellerService.getMyProducts(1).catch(() => null);
      if (r) { setProducts(r.products || []); setProductTotal(r.total || 0); setProductPages(r.pages || 1); }
    }
    if (s === 'orders') {
      const r = await SellerService.getMyOrders(1).catch(() => null);
      if (r) { setOrders(r.orders || []); setOrderTotal(r.total || 0); setOrderPages(r.pages || 1); }
    }
    if (s === 'payments') {
      const r = await SellerService.getMyPayouts().catch(() => null);
      if (r) setPayouts(Array.isArray(r) ? r : r?.payouts || []);
    }
  }, []);

  // ── Product pagination ───────────────────────────────────────────────────
  const handleProductPage = async (p: number) => {
    setProductPage(p);
    const r = await SellerService.getMyProducts(p).catch(() => null);
    if (r) { setProducts(r.products || []); setProductTotal(r.total || 0); setProductPages(r.pages || 1); }
  };

  const refreshProducts = useCallback(async () => {
    const r = await SellerService.getMyProducts(productPage).catch(() => null);
    if (r) { setProducts(r.products || []); setProductTotal(r.total || 0); setProductPages(r.pages || 1); }
  }, [productPage]);

  // ── Order pagination & filter ────────────────────────────────────────────
  const handleOrderPage = async (p: number) => {
    setOrderPage(p);
    const r = await SellerService.getMyOrders(p, orderStatus || undefined).catch(() => null);
    if (r) { setOrders(r.orders || []); setOrderTotal(r.total || 0); setOrderPages(r.pages || 1); }
  };

  const handleOrderStatus = async (s: string) => {
    setOrderStatus(s);
    setOrderPage(1);
    const r = await SellerService.getMyOrders(1, s || undefined).catch(() => null);
    if (r) { setOrders(r.orders || []); setOrderTotal(r.total || 0); setOrderPages(r.pages || 1); }
  };

  // ── Payouts refresh ──────────────────────────────────────────────────────
  const refreshPayouts = useCallback(async () => {
    const r = await SellerService.getMyPayouts().catch(() => null);
    if (r) setPayouts(Array.isArray(r) ? r : r?.payouts || []);
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
    router.push('/admin/login');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const sectionLabel = NAV_ITEMS.find((n) => n.id === section)?.label || '';
  const storeName = profile?.storeName || 'Ma boutique';
  const statusBg =
    profile?.status === 'approved'
      ? 'bg-green-100 text-green-700'
      : profile?.status === 'pending'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-600';
  const statusLabel =
    profile?.status === 'approved' ? 'Approuvé' : profile?.status === 'pending' ? 'En attente' : profile?.status || 'Inconnu';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo + Store */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-lg font-extrabold mb-3">
            <span className="text-brand-navy">Mandin</span>
            <span className="text-brand-orange">Market</span>
          </p>
          <div className="flex items-center gap-3 mb-1">
            {profile?.logo ? (
              <img src={profile.logo} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <BuildingStorefrontIcon className="w-5 h-5 text-orange-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Ma Boutique</p>
              <p className="font-semibold text-gray-900 text-sm truncate">{storeName}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBg}`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <li key={id}>
                  <button
                    onClick={() => navigateTo(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-orange text-white'
                        : 'text-gray-600 hover:bg-brand-soft hover:text-brand-navy'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {profile?.slug && (
            <Link
              href={`/vendeur/${profile.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              Voir ma boutique
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{sectionLabel}</h1>
          </div>
          <div className="flex items-center gap-3">
            <UserCircleIcon className="w-5 h-5 text-gray-400" />
            <span className="hidden sm:block text-sm text-gray-500">{userEmail}</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8">
          {section === 'overview' && (
            <OverviewSection
              earnings={earnings}
              products={products}
              orders={orders}
              onNavigate={(s) => navigateTo(s, s === 'products' ? { openProductForm: true } : undefined)}
            />
          )}
          {section === 'products' && (
            <ProductsSection
              products={products}
              categories={categories}
              total={productTotal}
              pages={productPages}
              currentPage={productPage}
              onPageChange={handleProductPage}
              onRefresh={refreshProducts}
              openFormOnMount={openProductFormOnMount}
            />
          )}
          {section === 'orders' && (
            <OrdersSection
              orders={orders}
              total={orderTotal}
              pages={orderPages}
              currentPage={orderPage}
              currentStatus={orderStatus}
              onPageChange={handleOrderPage}
              onStatusChange={handleOrderStatus}
            />
          )}
          {section === 'stats' && (
            <StatsSection orders={orders} products={products} />
          )}
          {section === 'payments' && (
            <PaymentsSection
              earnings={earnings}
              payouts={payouts}
              profile={profile}
              onProfileUpdate={(data) => setProfile((prev: any) => ({ ...prev, ...data }))}
              onPayoutsRefresh={refreshPayouts}
            />
          )}
          {section === 'profile' && (
            <ProfileSection
              profile={profile}
              onProfileUpdate={(data) => setProfile((prev: any) => ({ ...prev, ...data }))}
            />
          )}
        </div>
      </main>
    </div>
  );
}
