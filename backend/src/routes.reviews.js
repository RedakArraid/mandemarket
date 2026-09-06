const express = require('express');
const { z } = require('zod');
const router = express.Router();
const db = require('./db');

// Zod schema pour validation
const reviewSchema = z.object({
  productId: z.number().int().positive(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(1),
  isVerified: z.boolean().optional(),
});

// GET /api/reviews/:productId - Récupérer tous les avis d'un produit
router.get('/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de produit invalide' });
    }

    const reviews = await db.review.findMany({
      where: {
        productId: productId,
        status: 'approved', // Seulement les avis approuvés
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ reviews });
  } catch (error) {
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/reviews - Créer un nouvel avis
router.post('/', async (req, res) => {
  try {
    const data = reviewSchema.parse(req.body);
    
    // Vérifier que le produit existe
    const product = await db.product.findUnique({ where: { id: data.productId } });
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Créer l'avis
    const review = await db.review.create({
      data: {
        productId: data.productId,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
        isVerified: data.isVerified || false,
        status: 'approved', // Par défaut approuvé, peut être changé en 'pending' pour modération
      },
    });

    res.status(201).json({ review });
  } catch (err) {
    console.error('Erreur lors de la création de l\'avis:', err);
    if (err.errors) {
      // Erreur de validation Zod
      res.status(400).json({ error: 'Données invalides', details: err.errors });
    } else {
      res.status(400).json({ error: err.message || 'Erreur lors de la création de l\'avis' });
    }
  }
});

// PUT /api/reviews/:id/helpful - Marquer un avis comme utile
router.put('/:id/helpful', async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }

    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: { helpful: review.helpful + 1 },
    });

    res.json({ review: updatedReview });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/reviews/:productId/stats - Statistiques des avis d'un produit
router.get('/:productId/stats', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'ID de produit invalide' });
    }

    const reviews = await db.review.findMany({
      where: {
        productId: productId,
        status: 'approved',
      },
    });

    const stats = {
      total: reviews.length,
      averageRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      },
    };

    res.json({ stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

