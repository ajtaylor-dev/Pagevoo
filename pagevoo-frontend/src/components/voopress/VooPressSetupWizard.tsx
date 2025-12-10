import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Palette,
  Type,
  Settings,
  Layout,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

interface VooPressTheme {
  id: string;
  name: string;
  description: string;
  preview_image: string | null;
  tier_required: string;
  accessible: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  layout: {
    type: string;
  };
}

interface VooPressSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (websiteId: number) => void;
}

const VooPressSetupWizard: React.FC<VooPressSetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [themes, setThemes] = useState<VooPressTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedTheme, setSelectedTheme] = useState<string>('classic');
  const [siteTitle, setSiteTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [blogName, setBlogName] = useState('Blog');
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [showExcerpts, setShowExcerpts] = useState(true);
  const [features, setFeatures] = useState({
    comments_enabled: true,
    multi_author: false,
    categories_enabled: true,
    tags_enabled: true,
    featured_images: true,
    social_sharing: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadThemes();
    }
  }, [isOpen]);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/script-features/voopress/themes');
      setThemes(response.data || []);

      // Set default colors from first accessible theme
      const accessibleTheme = (response.data || []).find((t: VooPressTheme) => t.accessible);
      if (accessibleTheme) {
        setSelectedTheme(accessibleTheme.id);
        setPrimaryColor(accessibleTheme.colors?.primary || '#3B82F6');
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
      setError('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await api.post('/v1/script-features/voopress/create', {
        theme: selectedTheme,
        site_title: siteTitle || 'My Blog',
        tagline: tagline,
        colors: {
          primary: primaryColor,
        },
        blog_settings: {
          blog_name: blogName,
          posts_per_page: postsPerPage,
          show_excerpts: showExcerpts,
        },
        features: features,
      });

      if (response.success && response.data) {
        onComplete(response.data.id);
      } else {
        setError(response.message || 'Failed to create VooPress site');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create VooPress site');
    } finally {
      setCreating(false);
    }
  };

  const selectedThemeData = themes.find((t) => t.id === selectedTheme);

  const steps = [
    { number: 1, title: 'Choose Theme', icon: Layout },
    { number: 2, title: 'Site Identity', icon: Type },
    { number: 3, title: 'Customize', icon: Palette },
    { number: 4, title: 'Features', icon: Settings },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a2e] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Create VooPress Site</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 p-4 bg-[#0f0f1a] border-b border-gray-700">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  step === s.number
                    ? 'bg-purple-600 text-white'
                    : step > s.number
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-gray-700/50 text-gray-400'
                }`}
                onClick={() => step > s.number && setStep(s.number)}
              >
                {step > s.number ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {/* Step 1: Choose Theme */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Choose a Theme</h3>
                    <p className="text-gray-400 text-sm">
                      Select a theme that matches your content style. You can customize colors and
                      settings later.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTheme === theme.id
                            ? 'border-purple-500 bg-purple-500/10'
                            : theme.accessible
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-700 opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => theme.accessible && setSelectedTheme(theme.id)}
                      >
                        {/* Theme Preview */}
                        <div
                          className="h-32 rounded-lg mb-3 flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                          }}
                        >
                          <span className="text-white font-medium">{theme.name}</span>
                        </div>

                        <h4 className="font-medium text-white">{theme.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">{theme.description}</p>

                        {!theme.accessible && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                            {theme.tier_required.charAt(0).toUpperCase() + theme.tier_required.slice(1)}+
                          </div>
                        )}

                        {selectedTheme === theme.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Site Identity */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Site Identity</h3>
                    <p className="text-gray-400 text-sm">
                      Enter your site name and tagline. These will appear in your header and browser
                      tab.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Site Title *
                      </label>
                      <input
                        type="text"
                        value={siteTitle}
                        onChange={(e) => setSiteTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        placeholder="My Awesome Blog"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        className="w-full px-4 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        placeholder="A few words about your site"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        In a few words, explain what this site is about.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Blog Section Name
                      </label>
                      <select
                        value={blogName}
                        onChange={(e) => setBlogName(e.target.value)}
                        className="w-full px-4 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Blog">Blog</option>
                        <option value="News">News</option>
                        <option value="Articles">Articles</option>
                        <option value="Stories">Stories</option>
                        <option value="Posts">Posts</option>
                      </select>
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="p-4 bg-[#0f0f1a] rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Preview</p>
                    <h4 className="text-xl font-semibold text-white">
                      {siteTitle || 'Your Site Title'}
                    </h4>
                    <p className="text-gray-400">{tagline || 'Your tagline will appear here'}</p>
                  </div>
                </div>
              )}

              {/* Step 3: Customize */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Customize Appearance</h3>
                    <p className="text-gray-400 text-sm">
                      Customize the colors and display settings for your site.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 px-3 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Posts Per Page
                        </label>
                        <select
                          value={postsPerPage}
                          onChange={(e) => setPostsPerPage(Number(e.target.value))}
                          className="w-full px-4 py-2 bg-[#2a2a4a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value={5}>5 posts</option>
                          <option value={10}>10 posts</option>
                          <option value={15}>15 posts</option>
                          <option value={20}>20 posts</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={showExcerpts}
                            onChange={(e) => setShowExcerpts(e.target.checked)}
                            className="rounded border-gray-600 bg-[#2a2a4a] text-purple-500 focus:ring-purple-500"
                          />
                          Show excerpts on homepage
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Display a summary instead of full posts
                        </p>
                      </div>
                    </div>

                    {/* Theme Preview */}
                    <div className="p-4 bg-[#0f0f1a] rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 mb-3">Color Preview</p>
                      <div className="space-y-2">
                        <div
                          className="h-10 rounded flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Primary Button
                        </div>
                        <div
                          className="p-3 rounded border-l-4"
                          style={{ borderColor: primaryColor }}
                        >
                          <p className="text-sm text-gray-300">
                            Links and accents will use this color
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Features */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Enable Features</h3>
                    <p className="text-gray-400 text-sm">
                      Choose which features to enable for your VooPress site.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 bg-[#2a2a4a] rounded-lg cursor-pointer hover:bg-[#3a3a5a] transition-colors">
                      <input
                        type="checkbox"
                        checked={features.comments_enabled}
                        onChange={(e) =>
                          setFeatures({ ...features, comments_enabled: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-600 bg-[#1a1a2e] text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-white">Enable Comments</p>
                        <p className="text-sm text-gray-400">
                          Allow visitors to leave comments on your posts
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-[#2a2a4a] rounded-lg cursor-pointer hover:bg-[#3a3a5a] transition-colors">
                      <input
                        type="checkbox"
                        checked={features.multi_author}
                        onChange={(e) =>
                          setFeatures({ ...features, multi_author: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-600 bg-[#1a1a2e] text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-white">Multi-Author Support</p>
                        <p className="text-sm text-gray-400">
                          Allow multiple authors to contribute (requires User Access System)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-[#2a2a4a] rounded-lg cursor-pointer hover:bg-[#3a3a5a] transition-colors">
                      <input
                        type="checkbox"
                        checked={features.categories_enabled}
                        onChange={(e) =>
                          setFeatures({ ...features, categories_enabled: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-600 bg-[#1a1a2e] text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-white">Categories & Tags</p>
                        <p className="text-sm text-gray-400">
                          Organize your posts with categories and tags
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-[#2a2a4a] rounded-lg cursor-pointer hover:bg-[#3a3a5a] transition-colors">
                      <input
                        type="checkbox"
                        checked={features.featured_images}
                        onChange={(e) =>
                          setFeatures({ ...features, featured_images: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-600 bg-[#1a1a2e] text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-white">Featured Images</p>
                        <p className="text-sm text-gray-400">
                          Display featured images on posts and listings
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-[#2a2a4a] rounded-lg cursor-pointer hover:bg-[#3a3a5a] transition-colors">
                      <input
                        type="checkbox"
                        checked={features.social_sharing}
                        onChange={(e) =>
                          setFeatures({ ...features, social_sharing: e.target.checked })
                        }
                        className="mt-1 rounded border-gray-600 bg-[#1a1a2e] text-purple-500 focus:ring-purple-500"
                      />
                      <div>
                        <p className="font-medium text-white">Social Sharing</p>
                        <p className="text-sm text-gray-400">
                          Add social sharing buttons to your posts
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-[#0f0f1a] rounded-lg border border-gray-700">
                    <h4 className="font-medium text-white mb-3">Setup Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Theme</p>
                        <p className="text-white">{selectedThemeData?.name || selectedTheme}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Site Title</p>
                        <p className="text-white">{siteTitle || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Blog Name</p>
                        <p className="text-white">{blogName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Posts Per Page</p>
                        <p className="text-white">{postsPerPage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-[#0f0f1a]">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && !siteTitle}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating || !siteTitle}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create VooPress Site
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VooPressSetupWizard;
