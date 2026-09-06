'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { AuthService, SellerService } from '../config/api';

export default function VendeurPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSellerAccount, setHasSellerAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [form, setForm] = useState({
    storeName: '',
    slug: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const check = async () => {
      if (!AuthService.isAuthenticated()) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      try {
        const { hasSeller, status } = await SellerService.getMyStatus();
        setHasSellerAccount(!!hasSeller);
        if (hasSeller && status === 'approved') {
          router.push('/vendeur/dashboard');
          return;
        }
      } catch {
        setHasSellerAccount(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.storeName.trim()) {
      setError('Le nom de la boutique est requis.');
      return;
    }
    try {
      const res = await SellerService.register(form);
      setSuccess(res.message || 'Inscription envoyée ! Votre compte sera activé après vérification.');
      setHasSellerAccount(true);
      setShowRegisterForm(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  // Non connecté : présenter le concept et rediriger vers login
  if (!isAuthenticated && !AuthService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Devenez vendeur sur MandeMarket
            </h1>
            <p className="text-xl text-gray-600">
              Vendez vos sacs et accessoires sur la plus grande marketplace de la région.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: BuildingStorefrontIcon, title: 'Votre boutique', desc: 'Créez votre espace vendeur personnalisé' },
              { icon: ChartBarIcon, title: 'Tableau de bord', desc: 'Suivez vos ventes et revenus en temps réel' },
              { icon: BanknotesIcon, title: 'Commission claire', desc: 'Tarifs transparents, paiements réguliers' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
                <Icon className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">Inscrivez-vous en 1 clic pour devenir vendeur, ou connectez-vous si vous avez déjà un compte.</p>
            <div className="flex gap-4 justify-center flex-wrap mb-8">
              <button
                onClick={() => setShowRegisterForm(true)}
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
              >
                S&apos;inscrire et devenir vendeur
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
              <Link
                href="/admin/login"
                className="inline-flex items-center px-6 py-3 border border-orange-600 text-orange-600 font-medium rounded-lg hover:bg-orange-50"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
            {showRegisterForm && (
              <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-8 max-w-md mx-auto text-left">
                <h3 className="text-xl font-semibold mb-6">Inscription vendeur</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setError('');
                  try {
                    const d = (e.target as any);
                    const res = await AuthService.signupSeller({
                      email: d.email.value,
                      password: d.password.value,
                      name: d.name?.value,
                      storeName: d.storeName.value,
                      description: d.description?.value || undefined
                    });
                    setSuccess(res.message || 'Inscription envoyée !');
                    setShowRegisterForm(false);
                    router.push('/vendeur');
                  } catch (err: any) {
                    setError(err.message || 'Erreur');
                  }
                }} className="space-y-4">
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input name="email" type="email" required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mot de passe *</label>
                    <input name="password" type="password" required minLength={8} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input name="name" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom de la boutique *</label>
                    <input name="storeName" required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea name="description" rows={2} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg">S&apos;inscrire</button>
                    <button type="button" onClick={() => setShowRegisterForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connecté mais pas de compte vendeur : formulaire d'inscription
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Devenir vendeur</h1>
          <p className="text-gray-600">Remplissez le formulaire pour créer votre boutique.</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {hasSellerAccount && !showRegisterForm ? (
          <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-8 text-center">
            <p className="text-gray-600 mb-4">Vous avez déjà soumis une demande d&apos;inscription vendeur.</p>
            <p className="text-sm text-gray-500 mb-4">Un administrateur validera votre compte sous peu. Vous recevrez un email une fois celui-ci activé.</p>
            <p className="text-xs text-gray-400">Votre espace vendeur sera accessible après validation.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-8">
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique *</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ma Belle Boutique"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optionnel)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="ma-belle-boutique"
                />
                <p className="text-xs text-gray-500 mt-1">URL de votre boutique. Laissez vide pour générer automatiquement.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Présentez votre boutique..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700"
              >
                Envoyer ma demande
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
