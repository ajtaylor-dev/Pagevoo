import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getAssetUrl } from '@/config/constants';

interface Template {
  id: number;
  name: string;
  description: string;
  business_type: string;
  tier_category: 'trial' | 'brochure' | 'niche' | 'pro';
  uses_trial_features_only: boolean;
  preview_image: string | null;
  is_active: boolean;
  created_at: string;
  creator: {
    name: string;
  };
  pages: any[];
  exclusive_to: 'trial' | 'pro' | 'niche' | 'brochure' | null;
  technologies: string[];
  features: string[];
}

// Icon mapping for technologies and features
const TechIcon: React.FC<{ tech: string }> = ({ tech }) => {
  const icons: Record<string, { svg: JSX.Element; label: string; color: string }> = {
    html5: {
      label: 'HTML5',
      color: 'text-orange-600',
      svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/></svg>
    },
    css3: {
      label: 'CSS3',
      color: 'text-blue-600',
      svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/></svg>
    },
    react: {
      label: 'React',
      color: 'text-cyan-500',
      svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38a2.167 2.167 0 0 0-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44a23.476 23.476 0 0 0-3.107-.534A23.892 23.892 0 0 0 12.769 4.7c1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442a22.73 22.73 0 0 0-3.113.538 15.02 15.02 0 0 1-.254-1.42c-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87a25.64 25.64 0 0 1-4.412.005 26.64 26.64 0 0 1-1.183-1.86c-.372-.64-.71-1.29-1.018-1.946a23.73 23.73 0 0 1 1.013-1.954c.38-.66.773-1.286 1.18-1.868A25.64 25.64 0 0 1 12 8.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933a25.952 25.952 0 0 0-1.345-2.32zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493a23.966 23.966 0 0 0-1.1-2.98c.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98a23.142 23.142 0 0 0-1.086 2.964c-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39a25.819 25.819 0 0 0 1.341-2.338zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143a22.005 22.005 0 0 1-2.006-.386c.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295a1.185 1.185 0 0 1-.553-.132c-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/></svg>
    },
    php: {
      label: 'PHP',
      color: 'text-indigo-600',
      svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7.01 10.49h-.76c-.39 0-.57.15-.57.53v.77h1.33v1.03h-1.33v2.57H4.65v-2.57H3.96v-1.03h.69v-.79c0-1.05.47-1.58 1.41-1.58.28 0 .53.03.76.08v1.01c-.24-.06-.47-.09-.7-.09-.25 0-.37.12-.37.36v.42h.76v1.03zm11.75-3.07c.72 0 1.35.24 1.87.73.52.48.78 1.07.78 1.76 0 .68-.26 1.28-.78 1.76-.52.48-1.15.73-1.87.73h-1.52v2.06h-1.27V7.42h2.79zm-1.52 3.94h1.52c.41 0 .76-.14 1.05-.43.29-.29.44-.64.44-1.06 0-.41-.15-.76-.44-1.05-.29-.29-.64-.43-1.05-.43h-1.52v2.97zm-11.5-4.62c.72 0 1.35.24 1.87.73.52.48.78 1.07.78 1.76 0 .68-.26 1.28-.78 1.76-.52.48-1.15.73-1.87.73H4.22v2.06H2.95V6.74h2.79zm-1.52 3.94h1.52c.41 0 .76-.14 1.05-.43.29-.29.44-.64.44-1.06 0-.41-.15-.76-.44-1.05-.29-.29-.64-.43-1.05-.43H4.22v2.97z"/></svg>
    },
    mysql: {
      label: 'MySQL',
      color: 'text-blue-700',
      svg: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.405 5.501c-.115 0-.193.014-.274.033v.013h.014c.054.104.146.18.214.273.054.107.1.214.154.32l.014-.015c.094-.066.14-.172.14-.333-.04-.047-.046-.094-.08-.14-.04-.067-.126-.1-.18-.153zM5.77 18.695h-.927c-.03-1.562-.123-3.03-.27-4.41h-.008c-.27 1.098-.582 2.246-.936 3.42l-1.143 3.59H1.33l-1.143-3.59c-.27-1.174-.582-2.322-.853-3.42h-.015c-.078 1.38-.185 2.848-.267 4.41H-2c.103-2.054.287-4.093.568-6.14h1.415c.332 1.077.676 2.168.967 3.245.29 1.077.538 2.168.768 3.245h.015c.23-1.077.538-2.168.845-3.245.291-1.077.635-2.168.967-3.245h1.4c.296 2.054.465 4.093.584 6.14zM23.395 14.93c0 1.174-.164 2.062-.615 2.712-.43.636-1.077.953-1.948.953-.93 0-1.562-.332-1.948-.953-.43-.65-.615-1.538-.615-2.712 0-1.174.184-2.061.63-2.712.446-.65 1.047-.968 1.933-.968.93 0 1.562.318 2.007.968.385.65.555 1.538.555 2.712zm-1.446 0c0-.922-.123-1.592-.38-2.015-.238-.423-.614-.636-1.1-.636-.508 0-.876.213-1.1.636-.24.423-.368 1.093-.368 2.015 0 .922.123 1.592.368 2.015.238.423.6.636 1.1.636.47 0 .84-.213 1.1-.636.257-.423.38-1.093.38-2.015zM11.26 14.93c0 1.174-.163 2.062-.614 2.712-.431.636-1.078.953-1.948.953-.93 0-1.562-.332-1.948-.953-.431-.65-.615-1.538-.615-2.712 0-1.174.184-2.061.63-2.712.446-.65 1.047-.968 1.932-.968.93 0 1.562.318 2.008.968.385.65.555 1.538.555 2.712zm-1.447 0c0-.922-.123-1.592-.38-2.015-.238-.423-.614-.636-1.1-.636-.508 0-.876.213-1.1.636-.238.423-.367 1.093-.367 2.015 0 .922.122 1.592.367 2.015.24.423.6.636 1.1.636.47 0 .84-.213 1.1-.636.257-.423.38-1.093.38-2.015z"/></svg>
    },
  };

  const icon = icons[tech];
  if (!icon) return null;

  return (
    <div className="group relative">
      <div className={`${icon.color}`}>
        {icon.svg}
      </div>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {icon.label}
      </span>
    </div>
  );
};

const FeatureIcon: React.FC<{ feature: string }> = ({ feature }) => {
  const icons: Record<string, { svg: JSX.Element; label: string; color: string }> = {
    'shopping-cart': {
      label: 'Shopping Cart',
      color: 'text-green-600',
      svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    },
    'booking': {
      label: 'Booking System',
      color: 'text-purple-600',
      svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    'blog': {
      label: 'Blog',
      color: 'text-pink-600',
      svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
    },
    'marketplace': {
      label: 'Marketplace',
      color: 'text-yellow-600',
      svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
    },
    'forum': {
      label: 'Forum',
      color: 'text-red-600',
      svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
    },
    'contact-form': {
      label: 'Contact Form',
      color: 'text-gray-600',
      svg: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    },
  };

  const icon = icons[feature];
  if (!icon) return null;

  return (
    <div className="group relative">
      <div className={`${icon.color}`}>
        {icon.svg}
      </div>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        {icon.label}
      </span>
    </div>
  );
};

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'trial' | 'brochure' | 'niche' | 'pro'>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.getAllTemplatesAdmin();
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

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter(template => {
    // Search filter (name or description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter === 'published' && !template.is_active) return false;
    if (statusFilter === 'unpublished' && template.is_active) return false;

    // Business type filter
    if (businessTypeFilter !== 'all' && template.business_type !== businessTypeFilter) return false;

    // Tier filter
    if (tierFilter !== 'all' && template.tier_category !== tierFilter) return false;

    return true;
  });

  // Get unique business types for filter dropdown
  const businessTypes = Array.from(new Set(templates.map(t => t.business_type))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading templates...</div>
      </div>
    );
  }

  const handlePurgeAll = async () => {
    // First confirmation
    const firstConfirm = confirm(
      '⚠️ WARNING: This will permanently delete ALL templates and their files!\n\n' +
      'This action cannot be undone.\n\n' +
      'Are you sure you want to continue?'
    );

    if (!firstConfirm) return;

    // Second confirmation with typing requirement
    const secondConfirm = prompt(
      'To confirm deletion, please type: DELETE ALL TEMPLATES'
    );

    if (secondConfirm !== 'DELETE ALL TEMPLATES') {
      alert('Purge cancelled. Text did not match.');
      return;
    }

    try {
      const response = await api.purgeAllTemplates();
      alert(`✅ ${response.message}\n\n${response.data?.message || ''}`);
      // Refresh the template list
      fetchTemplates();
    } catch (error: any) {
      alert(`❌ Failed to purge templates: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#4b4b4b]">Template Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePurgeAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
            title="Development only: Delete all templates"
          >
            Purge All
          </button>
          <a
            href="/template-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
          >
            Create Template
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="all">All Templates</option>
              <option value="published">Published Only</option>
              <option value="unpublished">Unpublished Only</option>
            </select>
          </div>

          {/* Business Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <select
              value={businessTypeFilter}
              onChange={(e) => setBusinessTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="all">All Types</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier Category</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            >
              <option value="all">All Tiers</option>
              <option value="trial">Trial</option>
              <option value="brochure">Brochure</option>
              <option value="niche">Niche</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        {/* Results Count & Clear Filters */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredTemplates.length}</span> of <span className="font-semibold">{templates.length}</span> templates
          </p>
          {(searchQuery || statusFilter !== 'all' || businessTypeFilter !== 'all' || tierFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setBusinessTypeFilter('all');
                setTierFilter('all');
              }}
              className="text-sm text-[#98b290] hover:text-[#88a280] font-medium transition"
            >
              Clear Filters
            </button>
          )}
        </div>
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
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No templates match your filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setBusinessTypeFilter('all');
              setTierFilter('all');
            }}
            className="inline-block px-6 py-3 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md font-medium transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg overflow-hidden transition ${
                template.is_active
                  ? 'border-[#98b290] bg-green-50'
                  : 'border-gray-300 bg-gray-50 opacity-75'
              }`}
            >
              {/* Preview Image with Badge */}
              <div className="relative">
                {template.preview_image ? (
                  <div className="w-full h-40 bg-gray-200 overflow-hidden">
                    <img
                      src={getAssetUrl(template.preview_image.startsWith('template_directory/') ? template.preview_image : `storage/${template.preview_image}`)}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Tier Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${
                    template.tier_category === 'trial'
                      ? 'bg-gradient-to-b from-[#a8c2a0] to-[#98b290] text-white'
                      : template.tier_category === 'brochure'
                      ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white'
                      : template.tier_category === 'niche'
                      ? 'bg-gradient-to-b from-gray-200 to-gray-400 text-gray-900'
                      : 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-gray-900'
                  }`}>
                    {template.tier_category === 'trial' && 'Trial'}
                    {template.tier_category === 'brochure' && 'Brochure'}
                    {template.tier_category === 'niche' && 'Niche'}
                    {template.tier_category === 'pro' && 'Pro'}
                  </span>
                </div>
              </div>

              <div className="p-4">
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

                {/* Template Type and Feature Icons */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                  {/* Template Type (HTML5 or React) */}
                  {template.technologies && template.technologies.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TechIcon tech={template.technologies.includes('react') ? 'react' : 'html5'} />
                    </div>
                  )}

                  {/* Divider */}
                  {template.technologies && template.technologies.length > 0 &&
                   template.features && template.features.length > 0 && (
                    <div className="h-5 w-px bg-gray-300"></div>
                  )}

                  {/* Features */}
                  {template.features && template.features.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {template.features.map((feature) => (
                        <FeatureIcon key={feature} feature={feature} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                    {template.business_type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {template.pages.length} page{template.pages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/template-builder?id=${template.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition text-center"
                  >
                    Edit
                  </a>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
