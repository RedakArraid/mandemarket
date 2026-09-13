'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '../../_components/sections';

export default function EditProductRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/vendeur/dashboard/produits/ajouter?id=${params.id}`);
    }
  }, [params, router]);

  return (
    <div className="flex justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}
