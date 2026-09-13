'use client';

import React, { useEffect, useState } from 'react';
import { SellerService } from '../../../../config/api';
import { Spinner } from '../../_components/sections';
import { SellerPageHeader, SellerCard, SellerEmptyState } from '../../_components/ui';

const ROLES = [
  { id: 'manager', label: 'Gestionnaire de boutique' },
  { id: 'catalog', label: 'Gestionnaire catalogue & produits' },
  { id: 'orders', label: 'Gestionnaire commandes & logistique' },
  { id: 'finance', label: 'Comptabilité & finances' },
];

export default function EquipePage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[0].id);
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const data = await SellerService.getMyTeam();
      setTeam(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erreur chargement équipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setInviting(true);
      await SellerService.inviteTeamMember(email.trim(), role);
      setFeedback({ type: 'success', message: `Invitation envoyée avec succès à ${email.trim()}.` });
      setEmail('');
      setShowInvite(false);
      await loadTeam();
    } catch (err: any) {
      console.error('Erreur invitation membre:', err);
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de l’envoi de l’invitation.' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Gestion de l'équipe"
        description="Invitez des collaborateurs pour vous aider à gérer votre catalogue, vos expéditions et vos finances."
        action={
          <button
            type="button"
            onClick={() => setShowInvite(!showInvite)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm transition"
          >
            + Inviter un collaborateur
          </button>
        }
      />

      {feedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {showInvite && (
        <SellerCard title="Inviter un nouveau membre">
          <form onSubmit={handleInvite} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email du collaborateur</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@gmail.com"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Rôle et permissions</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-orange/30 bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="px-6 py-2 text-xs font-bold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm disabled:opacity-50 transition"
              >
                {inviting ? 'Envoi...' : 'Envoyer l’invitation'}
              </button>
            </div>
          </form>
        </SellerCard>
      )}

      <SellerCard title="Membres de la boutique">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Propriétaire toujours présent */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-brand-navy">Vous</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Propriétaire
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Accès administrateur complet sur la boutique et les finances.</p>
              </div>
              <span className="text-xs text-emerald-600 font-semibold">Actif</span>
            </div>

            {/* Collaborateurs invités */}
            {team.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-brand-navy">{m.name || m.email}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {m.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{m.email}</p>
                </div>
                <span className="text-xs text-emerald-600 font-semibold">Invité</span>
              </div>
            ))}
          </div>
        )}
      </SellerCard>
    </div>
  );
}
