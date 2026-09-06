'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../contexts/CartContext';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useRegion, ALL_COUNTRIES } from '../contexts/RegionContext';
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  HomeIcon,
  NewspaperIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon,
  UserCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const AFRICA_CODES  = ['CI','SN','ML','BF','TG','BJ','GN','GH','NG','CM','NE','MA'];
const EUROPE_CODES  = ['FR','BE','CH','LU','DE','IT','ES','PT','NL','GB','AT','IE'];

export default function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen]       = useState(false);
  const [countryOpen, setCountryOpen]     = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchValue, setSearchValue]     = useState('');
  const dropdownRef                        = useRef<HTMLDivElement>(null);
  const searchRef                          = useRef<HTMLInputElement>(null);
  const pathname                           = usePathname();
  const router                             = useRouter();
  const { totalItems, items }              = useCart();
  const { customer, isAuthenticated }      = useCustomerAuth();
  const { lang, setLang, countryCode, countryInfo, isDetecting, setCountry, t } = useRegion();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/boutique?search=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue('');
      setIsMenuOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: HomeIcon },
    { href: '/boutique', label: t('nav.shop'), icon: ShoppingBagIcon },
    { href: '/blog', label: t('nav.blog'), icon: NewspaperIcon },
    { href: '/contact', label: t('nav.contact'), icon: EnvelopeIcon },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo + contrôles région/langue */}
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent hover:from-orange-500 hover:to-orange-700 transition-all duration-300">
              MandeMarket
            </Link>

            {/* Sélecteur de pays */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                onClick={() => setCountryOpen(!countryOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors text-sm"
              >
                {isDetecting ? (
                  <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <span className="text-base leading-none">{countryInfo.flag}</span>
                )}
                <span className="font-medium text-gray-700 text-xs">{countryCode}</span>
                <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
              </button>

              {countryOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  {/* Afrique */}
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Afrique de l'Ouest</p>
                    <div className="grid grid-cols-3 gap-1">
                      {AFRICA_CODES.map(code => {
                        const c = ALL_COUNTRIES[code];
                        return (
                          <button
                            key={code}
                            onClick={() => { setCountry(code); setCountryOpen(false); }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                              countryCode === code
                                ? 'bg-orange-100 text-orange-700 font-semibold'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span>{c.flag}</span>
                            <span className="truncate">{code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Europe */}
                  <div className="px-3 pt-2 pb-3 border-t border-gray-100 mt-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Europe</p>
                    <div className="grid grid-cols-3 gap-1">
                      {EUROPE_CODES.map(code => {
                        const c = ALL_COUNTRIES[code];
                        return (
                          <button
                            key={code}
                            onClick={() => { setCountry(code); setCountryOpen(false); }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                              countryCode === code
                                ? 'bg-orange-100 text-orange-700 font-semibold'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span>{c.flag}</span>
                            <span className="truncate">{code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Région détectée */}
                  <div className="px-3 pb-2 border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-400 text-center">
                      {isDetecting ? 'Détection en cours…' : `Région : ${countryInfo.region === 'africa' ? 'Afrique' : 'Europe'} · Paiement : ${countryInfo.region === 'africa' ? 'Paystack / FCFA' : 'Stripe / EUR'}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sélecteur de langue */}
            <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === 'fr' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  lang === 'en' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
              className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
              title="Rechercher"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <Link
              href="/devenir-vendeur"
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-orange-600 text-sm font-medium transition-colors"
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              {t('nav.seller')}
            </Link>
            {isAuthenticated ? (
              <Link
                href="/compte/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 text-sm font-medium rounded-lg transition-colors"
                title={`${t('nav.account')} (${customer?.firstName})`}
              >
                <UserCircleIcon className="w-5 h-5" />
                {customer?.firstName}
              </Link>
            ) : (
              <Link
                href="/compte/login"
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-orange-600 text-sm font-medium rounded-lg transition-colors"
              >
                <UserCircleIcon className="w-5 h-5" />
                {t('nav.login')}
              </Link>
            )}
            <button
              onClick={() => { window.location.href = '/panier'; }}
              className="relative inline-block p-2 text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
              title="Voir le panier"
            >
              <ShoppingBagIcon className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center transform translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ zIndex: 10 }}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Menu Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-orange-50 transition-colors"
          >
            {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Pays + langue mobile */}
            <div className="flex items-center justify-between px-4 mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">{countryInfo.flag}</span>
                <span className="text-sm font-medium text-gray-700">{countryInfo.name}</span>
              </div>
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                <button onClick={() => setLang('fr')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'fr' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>FR</button>
                <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>EN</button>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(link.href) ? 'bg-orange-100 text-orange-600 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setIsMenuOpen(false); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-gray-700 hover:bg-gray-50"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Rechercher
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); window.location.href = '/panier'; }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-gray-700 hover:bg-gray-50"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Panier {totalItems > 0 && `(${totalItems})`}
              </button>
              {isAuthenticated ? (
                <Link href="/compte/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-orange-600 font-medium hover:bg-orange-50">
                  <UserCircleIcon className="w-5 h-5" />
                  Mon compte ({customer?.firstName})
                </Link>
              ) : (
                <Link href="/compte/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50">
                  <UserCircleIcon className="w-5 h-5" />
                  Connexion / Inscription
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center pt-20 px-4" onClick={() => setSearchOpen(false)}>
          <form
            onSubmit={handleSearch}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 gap-3">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Rechercher un produit..."
                className="flex-1 text-lg outline-none text-gray-900 placeholder-gray-400"
              />
              {searchValue && (
                <button type="button" onClick={() => setSearchValue('')} className="p-1 hover:bg-gray-100 rounded-full">
                  <XMarkIcon className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <button type="button" onClick={() => setSearchOpen(false)} className="p-1 hover:bg-gray-100 rounded-full ml-1">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">Appuyez sur Entrée pour rechercher</span>
              <button type="submit" className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                Rechercher
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
