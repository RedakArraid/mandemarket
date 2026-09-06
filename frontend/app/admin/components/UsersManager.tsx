'use client';

import { useState } from 'react';
import { UserCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UserAccount {
  email: string;
  name: string;
  role: string;
  type: string; // "Système" or "Créé"
}

interface UsersManagerProps {
  token: string;
}

const SYSTEM_ACCOUNTS: UserAccount[] = [
  { email: 'admin@mandemarket.com', name: 'Administrateur', role: 'admin', type: 'Système' },
  { email: 'manager@mandemarket.com', name: 'Manager', role: 'manager', type: 'Système' },
  { email: 'vendeur@mandemarket.com', name: 'Vendeur (Boutique Aminata)', role: 'seller', type: 'Système' }
];

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-purple-100 text-purple-800',
  seller: 'bg-orange-100 text-orange-800',
  user: 'bg-blue-100 text-blue-800'
};

export default function UsersManager({ token }: UsersManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<UserAccount[]>([]);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'user' | 'admin'>('user');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }

      setCreatedAccounts((prev) => [
        ...prev,
        { email: formEmail, name: formName, role: formRole, type: 'Créé' }
      ]);
      setSuccessMessage(`Compte "${formEmail}" créé avec succès.`);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('user');
      setShowCreateForm(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de créer le compte.');
    } finally {
      setSubmitting(false);
    }
  };

  const allAccounts = [...SYSTEM_ACCOUNTS, ...createdAccounts];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserCircleIcon className="w-6 h-6 text-orange-500" />
          Comptes système &amp; administration
        </h2>
        <button
          onClick={() => {
            setShowCreateForm((v) => !v);
            setSuccessMessage('');
            setErrorMessage('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          {showCreateForm ? (
            <>
              <XMarkIcon className="w-4 h-4" />
              Annuler
            </>
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              Créer un utilisateur
            </>
          )}
        </button>
      </div>

      {/* Info note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Note :</strong> Pour gérer les comptes admin/manager, utilisez le script de seed ou l'API directement.
        Le tableau ci-dessous liste les comptes système de référence ainsi que ceux créés via ce formulaire.
      </div>

      {/* Success / Error messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Nouveau compte</h3>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nom complet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Accounts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {allAccounts.map((account, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.email}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{account.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      ROLE_BADGE[account.role] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {account.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      account.type === 'Système'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {account.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
