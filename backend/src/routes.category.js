const express = require('express');
const { z } = require('zod');
const router = express.Router();
const db = require('./db');
const { requireAuth, requireAdmin, requireRole } = require('./middleware.auth');

// 🔧 Fonction pour générer un slug à partir du nom
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, ''); // Supprimer les tirets au début et à la fin
}

// Zod schema for category validation (SANS icon et image)
const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  slug: z.string().optional(),
  description: z.string().optional().default(""),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  parentId: z.string().uuid().nullable().optional()
    .transform(val => val === null || val === '' ? null : val),
  displayOrder: z.number().int().optional().default(0)
});

// GET all categories (avec hiérarchie)
router.get('/', async (req, res) => {
  try {
    const includeHierarchy = req.query.hierarchy === 'true';
    
    if (includeHierarchy) {
      // Récupérer seulement les catégories principales (sans parent)
      const mainCategories = await db.category.findMany({
        where: { parentId: null },
        include: {
          subcategories: {
            include: {
              _count: {
                select: { products: true }
              }
            },
            orderBy: { displayOrder: 'asc' }
          },
          _count: {
            select: { products: true }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });
      
      // Formater avec productCount
      const categoriesWithCount = mainCategories.map(cat => ({
        ...cat,
        productCount: cat._count.products,
        subcategories: cat.subcategories.map(sub => ({
          ...sub,
          productCount: sub._count.products
        }))
      }));
      
      return res.json(categoriesWithCount);
    }
    
    // Sans hiérarchie : toutes les catégories à plat
    const categories = await db.category.findMany({
      include: {
        parent: true,
        subcategories: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });
    
    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      productCount: cat._count.products
    }));
    
    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET category by id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const category = await db.category.findUnique({
      where: { id },
      include: {
        products: true,
        parent: true,
        subcategories: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const categoryWithCount = {
      ...category,
      productCount: category._count.products,
      subcategories: category.subcategories.map(sub => ({
        ...sub,
        productCount: sub._count.products
      }))
    };
    
    res.json(categoryWithCount);
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST create category
router.post('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    
    // Générer le slug s'il n'est pas fourni
    if (!data.slug) {
      data.slug = generateSlug(data.name);
    }
    
    // Vérifier que le slug est unique
    const existingSlug = await db.category.findUnique({
      where: { slug: data.slug }
    });
    if (existingSlug) {
      data.slug = `${data.slug}-${Date.now()}`;
    }
    
    // Si parentId est fourni, vérifier que la catégorie parente existe
    if (data.parentId) {
      const parent = await db.category.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        return res.status(400).json({ error: 'Catégorie parente non trouvée' });
      }
    }
    
    const category = await db.category.create({
      data: data,
      include: {
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    });
    
    const categoryWithCount = {
      ...category,
      productCount: category._count.products
    };
    
    res.status(201).json(categoryWithCount);
  } catch (err) {
    console.error('Erreur création catégorie:', err);
    res.status(400).json({ error: err.errors || err.message });
  }
});

// PUT update category
router.put('/:id', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  const id = req.params.id;
  try {
    const data = categorySchema.partial().parse(req.body);
    
    // Vérifier que la catégorie existe
    const existingCategory = await db.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    // Régénérer le slug si le nom change
    if (data.name && data.name !== existingCategory.name) {
      const newSlug = generateSlug(data.name);
      const slugExists = await db.category.findFirst({
        where: {
          slug: newSlug,
          NOT: { id: id }
        }
      });
      if (slugExists) {
        data.slug = `${newSlug}-${Date.now()}`;
      } else {
        data.slug = newSlug;
      }
    }
    
    // Vérifier qu'on ne crée pas de boucle (catégorie qui serait son propre parent)
    if (data.parentId === id) {
      return res.status(400).json({ error: 'Une catégorie ne peut pas être son propre parent' });
    }
    
    // Si parentId change, vérifier que la nouvelle catégorie parente existe
    if (data.parentId && data.parentId !== existingCategory.parentId) {
      const parent = await db.category.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        return res.status(400).json({ error: 'Catégorie parente non trouvée' });
      }
    }
    
    const category = await db.category.update({
      where: { id },
      data: data,
      include: {
        parent: true,
        subcategories: true,
        _count: {
          select: { products: true }
        }
      }
    });
    
    const categoryWithCount = {
      ...category,
      productCount: category._count.products
    };
    
    res.json(categoryWithCount);
  } catch (err) {
    console.error('Erreur mise à jour catégorie:', err);
    res.status(400).json({ error: err.errors || err.message });
  }
});

// DELETE category
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const id = req.params.id;
  try {
    // Vérifier que la catégorie existe
    const category = await db.category.findUnique({
      where: { id },
      include: {
        subcategories: true
      }
    });
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    
    // Vérifier qu'il n'y a pas de sous-catégories
    if (category.subcategories.length > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer une catégorie contenant ${category.subcategories.length} sous-catégorie(s). Veuillez d'abord supprimer les sous-catégories.`
      });
    }
    
    // Vérifier qu'il n'y a pas de produits dans la catégorie
    const productsCount = await db.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer une catégorie contenant ${productsCount} produit(s). Veuillez d'abord supprimer ou déplacer les produits.`
      });
    }
    
    await db.category.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Erreur suppression catégorie:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

module.exports = router;
