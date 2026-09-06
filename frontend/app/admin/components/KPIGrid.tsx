'use client';

import {
  CurrencyEuroIcon,
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatNumber, formatPercentage, getGrowthColor } from '../../config/analytics';

interface KPICardProps {
  title: string;
  value: string | number;
  growth?: number;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500'
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  growth,
  icon: Icon,
  trend,
  loading = false,
  subtitle,
  color = 'blue'
}) => {
  const getTrendIcon = () => {
    if (growth === undefined) return null;
    if (growth > 0) return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <ArrowRightIcon className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg opacity-20`}></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header avec titre et icône */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </h3>
        <div className={`w-10 h-10 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Valeur principale */}
      <div className="mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
      </div>

      {/* Growth et subtitle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          {growth !== undefined && (
            <span className={`text-sm font-medium ${getGrowthColor(growth)}`}>
              {growth > 0 ? '+' : ''}{formatPercentage(growth)}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-xs text-gray-500">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

interface KPIGridProps {
  data: {
    sales: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      revenueGrowth: number;
    };
    customers: {
      total: number;
      newThisMonth: number;
      customerGrowth: number;
    };
    inventory: {
      totalProducts: number;
      stockValue: number;
      lowStockProducts: number;
      stockHealth: number;
      outOfStockProducts?: number;
    };
  } | null;
  loading?: boolean;
  marketplaceData?: {
    sellersTotal: number;
    sellersApproved: number;
    sellersPending: number;
    payoutsPending: number;
    payoutsTotalAmount: number;
  };
}

const KPIGrid: React.FC<KPIGridProps> = ({ data, loading = false, marketplaceData }) => {
  const outOfStock = data?.inventory.outOfStockProducts || 0;
  const sellersPending = marketplaceData?.sellersPending || 0;

  const kpis = [
    {
      title: 'Chiffre d\'Affaires',
      value: data ? formatCurrency(data.sales.totalRevenue) : '0 FCFA',
      growth: data?.sales.revenueGrowth,
      icon: CurrencyEuroIcon,
      color: 'green' as const,
      subtitle: 'vs mois précédent'
    },
    {
      title: 'Commandes',
      value: data?.sales.totalOrders || 0,
      growth: data ? ((data.sales.totalOrders - 50) / 50) * 100 : 0, // Mock growth
      icon: ShoppingBagIcon,
      color: 'blue' as const,
      subtitle: `${data ? formatCurrency(data.sales.averageOrderValue) : '0 FCFA'} moy.`
    },
    {
      title: 'Clients',
      value: data?.customers.total || 0,
      growth: data?.customers.customerGrowth,
      icon: UsersIcon,
      color: 'purple' as const,
      subtitle: `${data?.customers.newThisMonth || 0} nouveaux`
    },
    {
      title: 'Stock',
      value: data?.inventory.totalProducts || 0,
      growth: data ? data.inventory.stockHealth - 80 : 0, // Mock health vs target
      icon: CubeIcon,
      color: data && data.inventory.lowStockProducts > 5 ? 'red' as const : 'orange' as const,
      subtitle: data ? `${formatCurrency(data.inventory.stockValue)} valeur` : '0 FCFA valeur'
    },
    {
      title: 'Valeur Moy. Panier',
      value: data ? formatCurrency(data.sales.averageOrderValue) : '0 FCFA',
      icon: ShoppingCartIcon,
      color: 'blue' as const,
      subtitle: 'par commande'
    },
    {
      title: 'Vendeurs Actifs',
      value: marketplaceData?.sellersApproved || 0,
      icon: BuildingStorefrontIcon,
      color: sellersPending > 0 ? 'red' as const : 'green' as const,
      subtitle: `${sellersPending} en attente`
    },
    {
      title: 'Versements Pendants',
      value: marketplaceData?.payoutsPending || 0,
      icon: BanknotesIcon,
      color: 'yellow' as const,
      subtitle: marketplaceData ? formatCurrency(marketplaceData.payoutsTotalAmount) : '0 FCFA'
    },
    {
      title: 'Ruptures de Stock',
      value: outOfStock,
      icon: ExclamationTriangleIcon,
      color: outOfStock > 0 ? 'red' as const : 'green' as const,
      subtitle: outOfStock > 0 ? 'produits indisponibles' : 'stock OK'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          growth={(kpi as any).growth}
          icon={kpi.icon}
          color={kpi.color}
          subtitle={kpi.subtitle}
          loading={loading}
        />
      ))}
    </div>
  );
};

export default KPIGrid;
