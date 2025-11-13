import axios, { type AxiosInstance, type AxiosError } from 'axios';

/**
 * API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * API Service Class
 *
 * Centralized API client for all backend communication
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle common errors
        if (error.response) {
          // Server responded with error
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // Request made but no response
          console.error('Network Error: No response received');
        } else {
          // Something else happened
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.client.get('/v1/health');
    return response.data;
  }

  /**
   * Generic GET request
   */
  async get<T = any>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url);
    return response.data;
  }

  /**
   * Authentication Methods
   */

  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await this.client.post('/v1/login', { email, password });
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    business_name: string;
    business_type: string;
    phone_number?: string;
  }): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await this.client.post('/v1/register', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.client.post('/v1/logout');
    localStorage.removeItem('auth_token');
    return response.data;
  }

  async getUser(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/v1/me');
    return response.data;
  }

  /**
   * User Management Methods
   */

  async getAllUsers(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/v1/users');
    return response.data;
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    business_name: string;
    business_type: string;
    phone_number?: string;
    role: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/users', data);
    return response.data;
  }

  async updateUser(id: number, data: {
    name: string;
    email: string;
    password?: string;
    business_name: string;
    business_type: string;
    phone_number?: string;
    role: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/v1/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/v1/users/${id}`);
    return response.data;
  }

  async deleteInactiveUsers(): Promise<ApiResponse<{ deleted_count: number; deleted_users: string[] }>> {
    const response = await this.client.post('/v1/users/delete-inactive');
    return response.data;
  }

  /**
   * Collaborator Management Methods
   */

  async getAllCollaborators(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/v1/collaborators');
    return response.data;
  }

  async createCollaborator(data: {
    name: string;
    email: string;
    password: string;
    phone_number?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/collaborators', data);
    return response.data;
  }

  async updateCollaborator(id: number, data: {
    name: string;
    email: string;
    password?: string;
    phone_number?: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/v1/collaborators/${id}`, data);
    return response.data;
  }

  async deleteCollaborator(id: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/v1/collaborators/${id}`);
    return response.data;
  }

  /**
   * Group Management Methods
   */

  async getAllGroups(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/v1/groups');
    return response.data;
  }

  async createGroup(data: {
    name: string;
    description?: string;
    permissions?: any;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/groups', data);
    return response.data;
  }

  async updateGroup(id: number, data: {
    name: string;
    description?: string;
    permissions?: any;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/v1/groups/${id}`, data);
    return response.data;
  }

  async deleteGroup(id: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/v1/groups/${id}`);
    return response.data;
  }

  async addUsersToGroup(groupId: number, userIds: number[]): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/v1/groups/${groupId}/add-users`, { user_ids: userIds });
    return response.data;
  }

  async removeUsersFromGroup(groupId: number, userIds: number[]): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/v1/groups/${groupId}/remove-users`, { user_ids: userIds });
    return response.data;
  }

  /**
   * Note/Journal Management Methods
   */

  async getAllNotes(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/v1/notes');
    return response.data;
  }

  async createNote(data: {
    title: string;
    content?: string;
    share_with_users?: number[];
    share_with_groups?: number[];
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/notes', data);
    return response.data;
  }

  async updateNote(id: number, data: {
    title: string;
    content?: string;
    share_with_users?: number[];
    share_with_groups?: number[];
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/v1/notes/${id}`, data);
    return response.data;
  }

  async deleteNote(id: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/v1/notes/${id}`);
    return response.data;
  }

  /**
   * Template Management Methods
   */

  async getAllTemplates(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/v1/templates');
    return response.data;
  }

  async getAllTemplatesAdmin(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/v1/templates/admin/all');
    return response.data;
  }

  async getTemplate(id: number): Promise<ApiResponse<any>> {
    const response = await this.client.get(`/v1/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: {
    name: string;
    description?: string;
    business_type: string;
    preview_image?: string;
    is_active?: boolean;
    pages: Array<{
      name: string;
      slug: string;
      is_homepage?: boolean;
      order?: number;
      sections?: Array<{
        name: string;
        type: string;
        content?: any;
        order?: number;
      }>;
    }>;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/templates', data);
    return response.data;
  }

  async updateTemplate(id: number, data: any): Promise<ApiResponse<any>> {
    const response = await this.client.put(`/v1/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/v1/templates/${id}`);
    return response.data;
  }

  async purgeAllTemplates(): Promise<ApiResponse> {
    const response = await this.client.post('/v1/templates/purge-all');
    return response.data;
  }

  async uploadTemplateImage(id: number, formData: FormData): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/v1/templates/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadGalleryImage(templateId: number, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file);
    const response = await this.client.post(`/v1/templates/${templateId}/gallery/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteGalleryImage(templateId: number, imageId: string): Promise<ApiResponse> {
    const response = await this.client.post(`/v1/templates/${templateId}/gallery/delete`, {
      image_id: imageId
    });
    return response.data;
  }

  async renameGalleryImage(templateId: number, imageId: string, newFilename: string): Promise<ApiResponse> {
    const response = await this.client.post(`/v1/templates/${templateId}/gallery/rename`, {
      image_id: imageId,
      new_filename: newFilename
    });
    return response.data;
  }

  /**
   * User Website Management Methods
   */

  async getUserWebsite(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/v1/user-website');
    return response.data;
  }

  async initializeWebsiteFromTemplate(templateId: number): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/user-website/initialize', {
      template_id: templateId
    });
    return response.data;
  }

  async createBlankWebsite(): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/user-website/create-blank');
    return response.data;
  }

  async publishWebsite(): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/user-website/publish');
    return response.data;
  }

  async unpublishWebsite(): Promise<ApiResponse<any>> {
    const response = await this.client.post('/v1/user-website/unpublish');
    return response.data;
  }

  async deleteUserWebsite(): Promise<ApiResponse<any>> {
    const response = await this.client.delete('/v1/user-website');
    return response.data;
  }

  /**
   * Settings Management Methods
   */

  async getUploadSettings(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/v1/settings/upload');
    return response.data;
  }

  async updateUploadSettings(data: {
    upload_max_gallery_image_size: number;
    upload_max_preview_image_size: number;
    upload_allowed_gallery_formats: string;
    upload_allowed_preview_formats: string;
  }): Promise<ApiResponse<any>> {
    const response = await this.client.put('/v1/settings/upload', data);
    return response.data;
  }
}

// Export singleton instance
export const api = new ApiService();
