// Configuration API centralisée pour MandeMarket
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const apiEndpoints = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    verify: '/api/auth/verify',
    logout: '/api/auth/logout',
  },
  products: '/api/products',
  categories: '/api/categories',
  orders: '/api/orders',
  customers: '/api/customers',
  dashboard: '/api/dashboard',
  sellers: '/api/sellers',
};

// Service API avec gestion d'erreur robuste
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter le token d'authentification si disponible
    const token = this.getAuthToken();
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error ${response.status}:`, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
      return data;
    } catch (error) {
      console.error('🚨 API Network Error:', error);
      
      // Fallback pour certaines opérations
      if (endpoint === '/api/products' && options.method === 'GET') {
        console.log('📦 Fallback: Utilisation des données locales');
        return this.getFallbackProducts();
      }
      
      throw error;
    }
  }

  // Méthodes HTTP
  async get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options?: RequestInit) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
      method: 'DELETE',
    };

    // Ajouter le token d'authentification si disponible
    const token = this.getAuthToken();
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      console.log(`🔄 API Request: DELETE ${url}`);
      
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ API Error ${response.status}:`, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Si status 204 (No Content), retourner null
      if (response.status === 204) {
        console.log(`✅ API Success: DELETE ${url} (No Content)`);
        return null;
      }
      
      // Sinon retourner les données JSON
      const data = await response.json();
      console.log(`✅ API Success: DELETE ${url}`, data);
      return data;
    } catch (error) {
      console.error('🚨 API Network Error:', error);
      throw error;
    }
  }

  // Gestion du token d'authentification
  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  }

  setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  removeAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  // Données de fallback
  getFallbackProducts() {
    return {
      products: [
        {
          id: 1,
          name: "Sac à main verni brillant avec anneau de levage",
          price: 150000,
          category: "Luxe",
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&crop=center",
          description: "Sac à main élégant avec finition vernie brillante",
          stock: 12,
          status: "active"
        },
        {
          id: 2,
          name: "Sac imprimé géométrique vintage léger tendance",
          price: 125000,
          category: "Vintage",
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center",
          description: "Sac tendance avec motifs géométriques vintage",
          stock: 8,
          status: "active"
        }
      ]
    };
  }

  // Test de connectivité
  async testConnection(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();

// Services spécialisés avec fallback automatique
export class ProductService {
  static async getAll() {
    try {
      const response = await apiService.get('/api/products?limit=500');
      return response.products || response || [];
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      return apiService.getFallbackProducts().products || [];
    }
  }

  static async getPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sellerId?: string;
  } = {}) {
    const qs = new URLSearchParams();
    if (params.page)       qs.set('page',       String(params.page));
    if (params.limit)      qs.set('limit',      String(params.limit));
    if (params.search)     qs.set('search',     params.search);
    if (params.categoryId) qs.set('categoryId', params.categoryId);
    if (params.sortBy)     qs.set('sortBy',     params.sortBy);
    if (params.sellerId)   qs.set('sellerId',   params.sellerId);
    try {
      const response = await apiService.get(`/api/products?${qs.toString()}`);
      return {
        products:   response.products || [],
        pagination: response.pagination || { page: 1, limit: 24, total: 0, totalPages: 1 },
      };
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      return { products: [], pagination: { page: 1, limit: 24, total: 0, totalPages: 1 } };
    }
  }

  static async getById(id: string) {
    try {
      const response = await apiService.get(`/api/products/${id}`);
      return response.product || response;
    } catch (error) {
      console.error('Erreur lors du chargement du produit:', error);
      // Fallback: chercher dans les données locales
      const fallbackProducts = apiService.getFallbackProducts().products || [];
      return fallbackProducts.find(p => p.id.toString() === id) || null;
    }
  }

  static async create(productData: any) {
    try {
      const response = await apiService.post('/api/products', productData);
      return response.product || response;
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error;
    }
  }

  static async update(id: string, productData: any) {
    try {
      const response = await apiService.put(`/api/products/${id}`, productData);
      return response.product || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      return await apiService.delete(`/api/products/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error;
    }
  }

  static async uploadImage(file: File): Promise<{ url: string; publicId: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = apiService.getAuthToken();
      const url = `${apiService['baseURL']}/api/products/upload`;

      console.log('📤 Uploading image to Cloudinary...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'upload de l\'image');
      }

      const data = await response.json();
      console.log('✅ Image uploaded to Cloudinary:', data.url);

      return {
        url: data.url,
        publicId: data.publicId
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload de l\'image:', error);
      throw error;
    }
  }
}

export class CategoryService {
  static async getAll() {
    try {
      const response = await apiService.get('/api/categories');
      return response.categories || response || [];
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      return [
        {
          id: "cat-001-luxury",
          name: "Luxury",
          description: "Sacs de luxe et accessoires premium",
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
        },
        {
          id: "cat-002-vintage",
          name: "Vintage",
          description: "Sacs vintage et rétro authentiques",
          image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=300&fit=crop"
        },
        {
          id: "cat-003-business",
          name: "Business",
          description: "Sacs professionnels et élégants",
          image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop"
        },
        {
          id: "cat-004-casual",
          name: "Casual",
          description: "Sacs décontractés et quotidiens",
          image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
        }
      ];
    }
  }

  static async getById(id: string) {
    try {
      const response = await apiService.get(`/api/categories/${id}`);
      return response.category || response;
    } catch (error) {
      console.error('Erreur lors du chargement de la catégorie:', error);
      return null;
    }
  }

  static async create(categoryData: any) {
    try {
      const response = await apiService.post('/api/categories', categoryData);
      return response.category || response;
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw error;
    }
  }

  static async update(id: string, categoryData: any) {
    try {
      const response = await apiService.put(`/api/categories/${id}`, categoryData);
      return response.category || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      throw error;
    }
  }

  static async delete(id: string) {
    try {
      return await apiService.delete(`/api/categories/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      throw error;
    }
  }
}

export class SellerService {
  static async getAll(params?: { page?: number; search?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const query = q.toString();
    const response = await apiService.get(`/api/sellers${query ? `?${query}` : ''}`);
    return response;
  }

  static async getBySlug(slug: string) {
    return apiService.get(`/api/sellers/slug/${slug}`);
  }

  static async register(data: { storeName: string; slug?: string; description?: string; logo?: string }) {
    return apiService.post('/api/sellers/register', data);
  }

  static async getMyStatus() {
    return apiService.get('/api/sellers/me/status');
  }

  static async getMyProfile() {
    return apiService.get('/api/sellers/me/profile');
  }

  static async updateMyProfile(data: { storeName?: string; description?: string; logo?: string; paymentInfo?: { method: string; accountNumber: string; accountName: string; operator?: string } }) {
    return apiService.put('/api/sellers/me/profile', data);
  }

  static async getMyProducts(page = 1) {
    return apiService.get(`/api/sellers/me/products?page=${page}`);
  }

  static async getMyOrders(page = 1, status?: string) {
    const q = new URLSearchParams({ page: String(page) });
    if (status) q.set('status', status);
    return apiService.get(`/api/sellers/me/orders?${q}`);
  }

  static async getMyEarnings() {
    return apiService.get('/api/sellers/me/earnings');
  }

  static async getMyBalance() {
    return apiService.get('/api/sellers/me/balance');
  }

  static async getMyLedger(page = 1, limit = 20) {
    return apiService.get(`/api/sellers/me/ledger?page=${page}&limit=${limit}`);
  }

  static async downloadLedgerCsv() {
    const token = apiService.getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/sellers/me/ledger/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Erreur lors du téléchargement du fichier CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandemarket-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  static async adminGetAll(status?: string) {
    const q = status ? `?status=${status}` : '';
    return apiService.get(`/api/sellers/admin/all${q}`);
  }

  static async adminApprove(sellerId: string, data: { status: 'approved' | 'suspended'; commissionRate?: number }) {
    return apiService.put(`/api/sellers/admin/${sellerId}/approve`, data);
  }

  static async requestPayout(amount: number, method?: string) {
    return apiService.post('/api/sellers/me/payouts', { amount, method });
  }

  static async getMyPayouts() {
    return apiService.get('/api/sellers/me/payouts');
  }

  static async adminGetPayouts(status?: string) {
    const q = status ? `?status=${status}` : '';
    return apiService.get(`/api/sellers/admin/payouts${q}`);
  }

  static async adminUpdatePayout(payoutId: string, data: { status?: string; reference?: string }) {
    return apiService.put(`/api/sellers/admin/payouts/${payoutId}`, data);
  }
}

export class AuthService {
  static async login(email: string, password: string) {
    try {
      const response = await apiService.post('/api/auth/login', { email, password });
      if (response.token) {
        apiService.setAuthToken(response.token);
      }
      return response;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  static async verify() {
    try {
      const response = await apiService.get('/api/auth/verify');
      return response;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      apiService.removeAuthToken();
      throw error;
    }
  }

  static async signupSeller(data: { email: string; password: string; name?: string; storeName: string; slug?: string; description?: string }) {
    try {
      const response = await apiService.post('/api/auth/signup-seller', data);
      if (response.token) apiService.setAuthToken(response.token);
      return response;
    } catch (error) {
      console.error('Erreur inscription vendeur:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      await apiService.post('/api/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      apiService.removeAuthToken();
    }
  }

  static isAuthenticated(): boolean {
    return !!apiService.getAuthToken();
  }

  static getToken(): string | null {
    return apiService.getAuthToken();
  }
}

export class ReviewService {
  static async getByProductId(productId: number) {
    try {
      const response = await apiService.get(`/api/reviews/${productId}`);
      return response.reviews || [];
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      return [];
    }
  }

  static async getStats(productId: number) {
    try {
      const response = await apiService.get(`/api/reviews/${productId}/stats`);
      return response.stats || null;
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      return null;
    }
  }

  static async create(reviewData: {
    productId: number;
    customerName: string;
    customerEmail?: string;
    rating: number;
    title?: string;
    comment: string;
  }) {
    try {
      const response = await apiService.post('/api/reviews', reviewData);
      return response.review || response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'avis:', error);
      throw error;
    }
  }

  static async markHelpful(reviewId: string) {
    try {
      const response = await apiService.put(`/api/reviews/${reviewId}/helpful`);
      return response.review || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }
}

export default apiService;
