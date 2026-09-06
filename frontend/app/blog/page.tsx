'use client';

import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import Link from 'next/link';
import { 
  CalendarDaysIcon,
  UserIcon,
  ClockIcon,
  ArrowRightIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const blogPosts = [
  {
    id: 1,
    title: "Comment choisir le sac à main parfait pour chaque occasion",
    excerpt: "Découvrez nos conseils d'experts pour sélectionner le sac idéal selon vos besoins et votre style de vie.",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop",
    category: "Conseils",
    author: "Marie Kouassi",
    date: "15 Oct 2024",
    readTime: "5 min"
  },
  {
    id: 2,
    title: "Tendances sacs à main 2024 : Les must-have de la saison",
    excerpt: "Explorez les dernières tendances en matière de sacs à main et découvrez les styles qui font sensation cette année.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop",
    category: "Tendances",
    author: "Sophie Diallo",
    date: "10 Oct 2024",
    readTime: "7 min"
  },
  {
    id: 3,
    title: "Entretien et soin de vos sacs en cuir : Guide complet",
    excerpt: "Apprenez les meilleures techniques pour préserver la beauté et la durabilité de vos sacs en cuir premium.",
    image: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&h=600&fit=crop",
    category: "Entretien",
    author: "Jean-Paul Touré",
    date: "5 Oct 2024",
    readTime: "6 min"
  },
  {
    id: 4,
    title: "L'histoire de MandeMarket : Une passion ivoirienne",
    excerpt: "Découvrez l'histoire de notre marque et notre engagement envers la qualité et l'excellence en Côte d'Ivoire.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop",
    category: "À propos",
    author: "Direction MandeMarket",
    date: "1 Oct 2024",
    readTime: "4 min"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30">
      <PublicHeader />
      
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">
              Notre Blog
            </h1>
            <p className="text-xl text-gray-300">
              Conseils, tendances et actualités sur l'univers des sacs à main
            </p>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post, idx) => (
              <article 
                key={post.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 group ${
                  idx === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className={`${idx === 0 ? 'md:flex' : ''}`}>
                  <div className={`${idx === 0 ? 'md:w-1/2' : ''} relative overflow-hidden`}>
                    <img
                      src={post.image}
                      alt={post.title}
                      className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                        idx === 0 ? 'h-96' : 'h-64'
                      }`}
                      onError={(e) => { e.currentTarget.src = `https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=600&fit=crop`; }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-lg">
                        <TagIcon className="w-3 h-3" />
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className={`p-6 ${idx === 0 ? 'md:w-1/2 flex flex-col justify-center' : ''}`}>
                    <h2 className={`font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors ${
                      idx === 0 ? 'text-3xl' : 'text-xl'
                    }`}>
                      {post.title}
                    </h2>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/blog/${post.id}`}
                      className="inline-flex items-center gap-2 text-orange-600 font-bold hover:gap-4 transition-all mt-4"
                    >
                      Lire la suite
                      <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Newsletter */}
      <section className="py-16 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ne manquez aucune actualité
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Inscrivez-vous à notre newsletter pour recevoir nos derniers articles et offres exclusives
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email..."
              className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:ring-4 focus:ring-orange-300 focus:outline-none font-medium"
            />
            <button className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-xl hover:scale-105">
              S'inscrire
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
