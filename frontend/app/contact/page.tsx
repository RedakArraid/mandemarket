'use client';

import { useState } from 'react';
import Image from 'next/image';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import {
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <PublicHeader />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <p className="text-brand-orange font-bold text-sm tracking-wider mb-2">CONTACT</p>
            <h1 className="text-4xl font-extrabold text-brand-navy mb-4">Nous sommes là pour vous</h1>
            <p className="text-gray-600 mb-8">
              Une question sur une commande, un compte vendeur ou un partenariat ? Écrivez-nous, notre équipe répond rapidement.
            </p>

            <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-card mb-8 ring-4 ring-white">
              <Image
                src="/images/brand/support-contact.jpg"
                alt="Support MandinMarket"
                fill
                className="object-cover object-top"
                sizes="380px"
                priority
              />
            </div>

            <div className="space-y-4">
              {[
                { icon: MapPinIcon, title: 'Adresse', text: 'Abidjan, Plateau — Côte d\'Ivoire' },
                { icon: EnvelopeIcon, title: 'Email', text: 'contact@mandinmarket.com' },
                { icon: PhoneIcon, title: 'Téléphone', text: '+225 XX XX XX XX XX' },
                { icon: ClockIcon, title: 'Horaires', text: 'Lun – Sam · 8h – 18h' },
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
            <h2 className="text-2xl font-extrabold text-brand-navy mb-6">Envoyez un message</h2>
            {submitted ? (
              <div className="rounded-2xl bg-emerald-50 text-emerald-700 p-6 text-center font-semibold">
                Merci ! Votre message a bien été envoyé.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="Nom complet"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange"
                  />
                </div>
                <input
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange"
                />
                <input
                  required
                  placeholder="Sujet"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange"
                />
                <textarea
                  required
                  rows={5}
                  placeholder="Votre message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:border-brand-orange resize-none"
                />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold py-3.5 rounded-xl transition"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Envoyer
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
