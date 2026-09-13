'use client';

import React, { useEffect, useState } from 'react';
import { AuthService } from '../../../../config/api';
import { SellerPageHeader, SellerCard } from '../../_components/ui';

export default function SecuritePage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSessions = async () => {
    try {
      setSessionLoading(true);
      const res = await AuthService.getSessions();
      setSessions(res?.sessions || []);
    } catch (err) {
      console.error('Erreur sessions:', err);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    if (newPassword.length < 8) {
      setFeedback({ type: 'error', message: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
      return;
    }

    try {
      setLoading(true);
      await AuthService.changePassword(oldPassword, newPassword);
      setFeedback({ type: 'success', message: 'Votre mot de passe a été modifié avec succès.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erreur mot de passe:', err);
      setFeedback({ type: 'error', message: err.message || 'Erreur lors du changement de mot de passe.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Voulez-vous déconnecter toutes vos autres sessions actives sur d’autres appareils ?')) return;
    try {
      setSessionLoading(true);
      await AuthService.logoutAllSessions();
      setFeedback({ type: 'success', message: 'Toutes les autres sessions ont été fermées avec succès.' });
      await loadSessions();
    } catch (err: any) {
      console.error('Erreur logout all:', err);
      setFeedback({ type: 'error', message: 'Erreur lors de la déconnexion globale.' });
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SellerPageHeader
        title="Sécurité du compte"
        description="Gérez vos identifiants, changez votre mot de passe et surveillez vos sessions actives."
      />

      {feedback && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Formulaire Changement de Mot de Passe */}
      <SellerCard title="Changer le mot de passe">
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-orange/30"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-orange/30"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm disabled:opacity-50 transition"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>
        </form>
      </SellerCard>

      {/* Sessions actives */}
      <SellerCard title="Appareils et sessions actives">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Consultez les appareils actuellement connectés à votre compte vendeur et révoquez les accès suspects.
          </p>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl p-3 bg-gray-50">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">Session actuelle active sur ce navigateur.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-800">{s.userAgent || 'Navigateur web'}</span>
                    <p className="text-gray-400 text-[11px]">IP: {s.ipAddress || 'Masquée'} · Expire le {new Date(s.expiresAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">Active</span>
                </div>
              ))
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={sessionLoading}
              onClick={handleLogoutAll}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
            >
              {sessionLoading ? 'Fermeture...' : '🔒 Déconnecter tous les autres appareils'}
            </button>
          </div>
        </div>
      </SellerCard>
    </div>
  );
}
