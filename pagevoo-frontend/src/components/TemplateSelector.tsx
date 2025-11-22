import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Template {
  id: number;
  name: string;
  description: string;
  business_type: string;
  preview_image: string | null;
  pages: any[];
}

interface TemplateSelectorProps {
  onSelect: (templateId: number) => void;
  onCancel: () => void;
}

export function TemplateSelector({ onSelect, onCancel }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.getAllTemplates();
      if (response.success) {
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

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate.id);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-gray-600">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-[#4b4b4b]">Choose a Template</h2>
          <p className="text-gray-600 mt-1">Select a template that matches your business type</p>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No templates available</p>
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedTemplate?.id === template.id
                      ? 'border-[#98b290] bg-green-50'
                      : 'border-gray-200 hover:border-[#98b290]'
                  }`}
                >
                  {template.preview_image ? (
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={template.preview_image}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No preview</span>
                    </div>
                  )}

                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {template.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                      {template.business_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.pages.length} page{template.pages.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <div className="mt-3 flex items-center gap-2 text-[#98b290]">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white flex gap-3 justify-between items-center">
              <p className="text-sm text-gray-600">
                {selectedTemplate
                  ? `Selected: ${selectedTemplate.name}`
                  : 'Please select a template to continue'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSelectTemplate}
                  disabled={!selectedTemplate}
                  className={`px-6 py-2 rounded-md font-medium transition ${
                    selectedTemplate
                      ? 'bg-[#98b290] hover:bg-[#88a280] text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Use This Template
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
