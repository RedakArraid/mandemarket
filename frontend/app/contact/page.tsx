'use client';

import { useState } from 'react';
import Image from 'next/image';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { ContactService } from '../config/api';
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    honeypot: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await ContactService.sendMessage(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', honeypot: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur s’est produite lors de l’envoi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <PublicHeader />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-brand-orange font-bold text-sm tracking-wider mb-2">SUPPORT & ASSISTANCE</p>
            <h1 className="text-4xl font-extrabold text-brand-navy mb-4">Nous sommes à votre écoute</h1>
            <p className="text-gray-600 mb-8">
              Une question sur une commande, un compte vendeur ou un partenariat ? Écrivez-nous, notre équipe vous répond sous 24h ouvrées.
            </p>

            <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-card mb-8 ring-4 ring-white">
              <Image
                src="/images/brand/support-contact.jpg"
                alt="Support MandeMarket"
                fill
                className="object-cover object-top"
                sizes="380px"
                priority
              />
            </div>

            <div className="space-y-4">
              {[
                { icon: MapPinIcon, title: 'Adresses', text: 'Bamako (Mali) & Abidjan (Côte d\'Ivoire)' },
                { icon: EnvelopeIcon, title: 'Email support', text: 'contact@mandemarket.com' },
                { icon: PhoneIcon, title: 'Service client', text: '+223 70 00 00 00 / +225 07 00 00 00' },
                { icon: ClockIcon, title: 'Disponibilité', text: 'Du Lundi au Samedi · 8h – 18h GMT' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand-orange flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-brand-navy text-sm">{title}</p>
                    <p className="text-gray-600 text-sm">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-extrabold text-brand-navy mb-6">Envoyez-nous un message</h2>

            {submitted ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-8 text-center space-y-3">
                <CheckCircleIcon className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold">Message bien transmis !</h3>
                <p className="text-sm text-emerald-700">
                  Merci de nous avoir contactés. Notre équipe d'assistance a bien reçu votre demande et vous répondra par email dans les plus brefs délais.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 text-red-600" />
                    {error}
                  </div>
                )}

                {/* Honeypot invisible pour contrer les robots */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                    <input
                      required
                      placeholder="Ex: Fatoumata Traoré"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                    <input
                      required
                      type="email"
                      placeholder="Ex: fatoumata@exemple.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange text-sm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro de téléphone</label>
                    <input
                      placeholder="+223 XX XX XX XX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Sujet *</label>
                    <input
                      required
                      placeholder="Ex: Suivi de livraison, partenariat..."
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Votre message *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Détaillez votre question ou demande..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange resize-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold py-3.5 rounded-xl transition disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {loading ? 'Envoi en cours...' : 'Envoyer mon message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
