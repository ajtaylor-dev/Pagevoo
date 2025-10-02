import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Template {
  id: number;
  name: string;
  description: string;
  business_type: string;
  preview_image: string | null;
  is_active: boolean;
  created_at: string;
  creator: {
    name: string;
  };
  pages: any[];
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      console.log('Loading templates...');
      const response = await api.getAllTemplatesAdmin();
      console.log('Template response:', response);
      if (response.success) {
        console.log('Templates data:', response.data);
        setTemplates(response.data || []);
      } else {
        console.error('API returned success: false');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      alert('Failed to load templates: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const response = await api.updateTemplate(template.id, {
        is_active: !template.is_active
      });
      if (response.success) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await api.deleteTemplate(id);
      if (response.success) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate) return;

    try {
      const response = await api.updateTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        description: editingTemplate.description,
        business_type: editingTemplate.business_type,
      });
      if (response.success) {
        setEditingTemplate(null);
        loadTemplates();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading templates...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#4b4b4b]">Template Manager</h2>
        <a
          href="/template-builder"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
        >
          Create Template
        </a>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No templates found</p>
          <a
            href="/template-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md font-medium transition"
          >
            Create Your First Template
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 transition ${
                template.is_active
                  ? 'border-[#98b290] bg-green-50'
                  : 'border-gray-300 bg-gray-50 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    By {template.creator.name} • {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    template.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description || 'No description'}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                  {template.business_type}
                </span>
                <span className="text-xs text-gray-500">
                  {template.pages.length} page{template.pages.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(template)}
                  className={`flex-1 px-3 py-1.5 rounded text-sm transition ${
                    template.is_active
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      : 'bg-green-100 hover:bg-green-200 text-green-700'
                  }`}
                >
                  {template.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-[#4b4b4b]">Edit Template</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type *
                </label>
                <select
                  value={editingTemplate.business_type}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, business_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="barber">Barber</option>
                  <option value="pizza">Pizza Shop</option>
                  <option value="cafe">Cafe</option>
                  <option value="gym">Gym</option>
                  <option value="salon">Salon</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
