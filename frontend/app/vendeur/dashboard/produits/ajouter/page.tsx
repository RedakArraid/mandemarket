'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryService, ProductService } from '../../../../config/api';
import CloudinaryImageUpload from '../../../../components/CloudinaryImageUpload';
import { Spinner } from '../../_components/sections';
import {
  SellerPageHeader,
  SellerHeaderActions,
  SellerActionButton,
  SellerCard,
  notifySoon,
} from '../../_components/ui';

const STEPS = ['Informations', 'Images', 'Prix', 'Stock', 'Livraison'];

export default function AjouterProduitPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    subCategory: '',
    description: '',
    brand: '',
    condition: 'new',
    image: '',
    price: '',
    promoPrice: '',
    stock: '0',
    sku: '',
    variants: '',
    weight: '',
    dimensions: '',
    prepDelay: '',
    status: 'active',
  });

  useEffect(() => {
    CategoryService.getAll()
      .then((c) => setCategories(Array.isArray(c) ? c.filter((x: any) => x.status !== 'inactive') : []))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (asDraft: boolean) => {
    setSaving(true);
    try {
      await ProductService.create({
        name: form.name,
        categoryId: form.categoryId,
        description: form.description,
        brand: form.brand,
        condition: form.condition,
        image: form.image,
        price: Math.round(parseFloat(form.promoPrice || form.price || '0') * 100),
        stock: parseInt(form.stock, 10) || 0,
        sku: form.sku,
        status: asDraft ? 'inactive' : 'active',
        styles: [],
        features: form.variants ? form.variants.split(',').map((s) => s.trim()).filter(Boolean) : [],
        colors: [],
      });
      router.push(asDraft ? '/vendeur/dashboard/produits/brouillons' : '/vendeur/dashboard/produits');
    } catch (e: any) {
      alert(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <SellerPageHeader
        title="Ajouter un produit"
        description="Créez une fiche produit complète pour votre boutique."
        action={
          <SellerHeaderActions>
            <SellerActionButton variant="secondary" href="/vendeur/dashboard/produits">Annuler</SellerActionButton>
            <SellerActionButton variant="outline" onClick={() => save(true)} disabled={saving}>Enregistrer comme brouillon</SellerActionButton>
          </SellerHeaderActions>
        }
      />

      <div className="flex flex-wrap gap-2 mb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${i === step ? 'bg-brand-orange text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <SellerCard title={STEPS[step]}>
        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-orange" placeholder="Nom *" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-orange" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">Catégorie *</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-orange" placeholder="Sous-catégorie" value={form.subCategory} onChange={(e) => set('subCategory', e.target.value)} />
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-orange" placeholder="Marque" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-orange" value={form.condition} onChange={(e) => set('condition', e.target.value)}>
              <option value="new">État : Neuf</option>
              <option value="used_good">Occasion - Bon état</option>
              <option value="refurbished">Reconditionné</option>
            </select>
            <textarea className="w-full md:col-span-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-orange" rows={4} placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4 max-w-xl">
            <CloudinaryImageUpload currentImage={form.image} onImageChange={(url) => set('image', url)} placeholder="+ Ajouter des photos" />
            <SellerHeaderActions>
              <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Choisir l’image principale')}>Choisir l’image principale</SellerActionButton>
              <SellerActionButton size="sm" variant="danger" onClick={() => set('image', '')}>Supprimer</SellerActionButton>
              <SellerActionButton size="sm" variant="outline" onClick={() => notifySoon('Réorganiser')}>Réorganiser</SellerActionButton>
            </SellerHeaderActions>
          </div>
        )}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4 max-w-xl">
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" type="number" placeholder="Prix normal (FCFA)" value={form.price} onChange={(e) => set('price', e.target.value)} />
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" type="number" placeholder="Prix promotionnel" value={form.promoPrice} onChange={(e) => set('promoPrice', e.target.value)} />
            <SellerActionButton variant="ghost" href="/vendeur/dashboard/marketing/promotions">Programmer une promotion</SellerActionButton>
          </div>
        )}
        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" type="number" placeholder="Quantité" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
            <input className="w-full md:col-span-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Variantes (ex: Taille S/M/L, Couleur Noir/Blanc)" value={form.variants} onChange={(e) => set('variants', e.target.value)} />
            <SellerActionButton size="sm" variant="secondary" onClick={() => notifySoon('Ajouter une variante')}>+ Ajouter une variante</SellerActionButton>
          </div>
        )}
        {step === 4 && (
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Poids" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Dimensions" value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} />
            <input className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" placeholder="Délai de préparation" value={form.prepDelay} onChange={(e) => set('prepDelay', e.target.value)} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100">
          {step > 0 && <SellerActionButton variant="secondary" onClick={() => setStep((s) => s - 1)}>Retour</SellerActionButton>}
          {step < STEPS.length - 1 ? (
            <SellerActionButton variant="primary" onClick={() => setStep((s) => s + 1)}>Suivant</SellerActionButton>
          ) : (
            <>
              <SellerActionButton variant="outline" onClick={() => notifySoon('Prévisualiser')}>Prévisualiser</SellerActionButton>
              <SellerActionButton variant="secondary" onClick={() => save(true)} disabled={saving}>Enregistrer comme brouillon</SellerActionButton>
              <SellerActionButton variant="primary" onClick={() => save(false)} disabled={saving || !form.name || !form.categoryId}>
                {saving ? 'Publication…' : 'Publier le produit'}
              </SellerActionButton>
            </>
          )}
          <SellerActionButton variant="ghost" href="/vendeur/dashboard/produits">Annuler</SellerActionButton>
        </div>
      </SellerCard>
    </div>
  );
}
