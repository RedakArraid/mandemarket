'use client';

import Image from 'next/image';
import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import {
  ShieldCheckIcon,
  LightBulbIcon,
  HandRaisedIcon,
  StarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const VALUES = [
  { icon: ShieldCheckIcon, title: 'Confiance', desc: 'Un environnement sécurisé' },
  { icon: LightBulbIcon, title: 'Innovation', desc: 'Des solutions modernes et simples' },
  { icon: HandRaisedIcon, title: 'Accessibilité', desc: 'Une opportunité pour tous' },
  { icon: StarIcon, title: 'Qualité', desc: 'Des produits et services fiables' },
];

const STEPS = [
  { n: '1', title: 'Créez votre compte', desc: 'En quelques minutes' },
  { n: '2', title: 'Achetez ou devenez vendeur', desc: 'Choisissez votre expérience' },
  { n: '3', title: 'Publiez vos produits', desc: 'Ajoutez vos photos, prix et stock' },
  { n: '4', title: 'Recevez des commandes', desc: 'Gérez vos ventes depuis votre tableau de bord' },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <PublicHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand-orange font-bold tracking-wider text-sm mb-3">À PROPOS DE MANDINMARKET</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-navy leading-tight mb-5">
              Une marketplace pensée pour rapprocher vendeurs et consommateurs
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              MandinMarket est la marketplace africaine qui permet aux entrepreneurs et créateurs de vendre en ligne,
              et aux clients de découvrir des produits authentiques livrés partout.
            </p>
            <a
              href="#mission"
              className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-orange-dark transition"
            >
              Notre histoire <ArrowRightIcon className="w-5 h-5" />
            </a>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/5] max-w-md mx-auto rounded-[40%_60%_55%_45%/50%_40%_60%_50%] overflow-hidden shadow-2xl">
              <Image
                src="/images/brand/hero-a-propos.jpg"
                alt="Entrepreneur MandinMarket"
                fill
                className="object-cover"
                sizes="420px"
                priority
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center italic">
              Engagement pour une Afrique qui entreprend.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">◎</div>
          <h2 className="text-3xl font-extrabold text-brand-navy mb-4">Notre mission</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Simplifier le commerce en ligne et offrir à chaque entrepreneur une boutique digitale pour grandir,
            vendre et toucher de nouveaux clients à travers l&apos;Afrique et au-delà.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-extrabold text-brand-navy mb-10 text-center">Nos valeurs</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 text-center shadow-card border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand-orange flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-brand-navy text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-brand-navy/40 font-serif italic text-lg">
            Le commerce d&apos;aujourd&apos;hui pour l&apos;Afrique de demain
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-brand-navy mb-10 text-center">Comment fonctionne MandinMarket ?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-100 p-6 bg-brand-cream">
                <div className="w-10 h-10 rounded-full bg-brand-orange text-white font-extrabold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-brand-navy mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community banner */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden min-h-[280px] flex items-end">
            <Image
              src="/images/brand/equipe-a-propos.jpg"
              alt="Communauté MandinMarket"
              fill
              className="object-cover object-[center_30%]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-brand-navy/30 to-transparent" />
            <div className="relative z-10 p-8 md:p-10 w-full flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Des histoires réelles, un impact réel.</h2>
                <p className="text-white/85">Rejoignez une communauté qui grandit chaque jour.</p>
              </div>
              <Link
                href="/compte/register"
                className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-orange-dark transition self-start md:self-auto"
              >
                Rejoindre MandinMarket <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-brand-orange px-6 py-12 text-center text-white">
            <h2 className="text-3xl font-extrabold mb-2">Prêt à rejoindre MandinMarket ?</h2>
            <p className="text-white/90 mb-8">Des milliers de clients vous attendent.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/compte/register" className="bg-white text-brand-orange px-6 py-3.5 rounded-xl font-bold hover:bg-brand-soft transition">
                Créer un compte
              </Link>
              <Link href="/devenir-vendeur" className="bg-brand-navy text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-navy-light transition">
                Devenir vendeur
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
