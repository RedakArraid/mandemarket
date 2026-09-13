const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      if (req.seller && req.seller.id) {
        return `mandemarket/sellers/${req.seller.id}`;
      }
      return 'mandemarket/platform';
    },
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' }, // Limite la taille
      { quality: 'auto' }, // Optimisation automatique
      { fetch_format: 'auto' } // Format optimal selon le navigateur
    ],
    public_id: (req, file) => {
      // Génère un nom unique pour le fichier
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = file.originalname.replace(/\s+/g, '_').replace(/\.[^/.]+$/, '');
      return `product_${timestamp}_${randomString}_${filename}`;
    }
  },
});

// Middleware Multer avec Cloudinary
const uploadToCloudinary = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG, GIF, WEBP ou SVG.'), false);
    }
  }
});

/**
 * Upload une seule image
 */
const uploadSingle = uploadToCloudinary.single('image');

/**
 * Upload plusieurs images
 */
const uploadMultiple = uploadToCloudinary.array('images', 10); // Max 10 images

/**
 * Supprimer une image de Cloudinary
 * @param {string} publicId - L'ID public de l'image dans Cloudinary
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image supprimée de Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'image:', error);
    throw error;
  }
}

/**
 * Extraire le public_id depuis une URL Cloudinary
 * @param {string} url - URL Cloudinary
 * @returns {string} Public ID
 */
function extractPublicId(url) {
  if (!url) return null;
  
  // Format URL Cloudinary: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
  if (matches && matches[1]) {
    return matches[1];
  }
  
  // Format alternatif
  const matches2 = url.match(/\/([^/]+)\.\w+$/);
  if (matches2 && matches2[1]) {
    return `mandemarket/${matches2[1]}`;
  }
  
  return null;
}

/**
 * Obtenir l'URL optimisée d'une image
 * @param {string} publicId - Public ID de l'image
 * @param {object} options - Options de transformation
 */
function getOptimizedUrl(publicId, options = {}) {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  };
  
  return cloudinary.url(publicId, defaultOptions);
}

/**
 * Générer plusieurs tailles d'image (responsive)
 * @param {string} publicId - Public ID de l'image
 */
function getResponsiveUrls(publicId) {
  return {
    thumbnail: cloudinary.url(publicId, { width: 150, height: 150, crop: 'fill', quality: 'auto' }),
    small: cloudinary.url(publicId, { width: 400, height: 400, crop: 'limit', quality: 'auto' }),
    medium: cloudinary.url(publicId, { width: 800, height: 800, crop: 'limit', quality: 'auto' }),
    large: cloudinary.url(publicId, { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }),
    original: cloudinary.url(publicId, { quality: 'auto' })
  };
}

/**
 * Vérifier la configuration Cloudinary
 */
function checkConfiguration() {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    console.error('❌ Configuration Cloudinary manquante !');
    console.error('Assurez-vous que les variables suivantes sont définies :');
    console.error('  - CLOUDINARY_CLOUD_NAME');
    console.error('  - CLOUDINARY_API_KEY');
    console.error('  - CLOUDINARY_API_SECRET');
    return false;
  }
  
  console.log('✅ Cloudinary configuré avec succès');
  console.log(`   Cloud Name: ${cloud_name}`);
  return true;
}

module.exports = {
  cloudinary,
  uploadSingle,
  uploadMultiple,
  deleteImage,
  extractPublicId,
  getOptimizedUrl,
  getResponsiveUrls,
  checkConfiguration
};

