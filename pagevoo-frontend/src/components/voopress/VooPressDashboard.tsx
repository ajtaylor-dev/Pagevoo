import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  FileText,
  File,
  MessageSquare,
  Palette,
  Users,
  Settings,
  PenLine,
  Eye,
  ChevronRight,
  Plus,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { api } from '../../services/api';
import ThemeSelector from './ThemeSelector';
import WidgetManager from './WidgetManager';
import MenuBuilder from './MenuBuilder';

interface VooPressDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: number;
  voopressConfig: any;
  voopressTheme: string;
  onConfigChange: (config: any) => void;
  onThemeChanged?: () => void;
  onOpenBlogManager: () => void;
  onOpenUasManager: () => void;
}

type TabType = 'dashboard' | 'posts' | 'pages' | 'comments' | 'appearance' | 'users' | 'settings';
type AppearanceSubTab = 'themes' | 'customize' | 'widgets' | 'menus';

const VooPressDashboard: React.FC<VooPressDashboardProps> = ({
  isOpen,
  onClose,
  websiteId,
  voopressConfig,
  voopressTheme,
  onConfigChange,
  onThemeChanged,
  onOpenBlogManager,
  onOpenUasManager,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [appearanceSubTab, setAppearanceSubTab] = useState<AppearanceSubTab>('themes');
  const [stats, setStats] = useState({
    posts_count: 0,
    pages_count: 0,
    comments_count: 0,
    users_count: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [siteTitle, setSiteTitle] = useState(voopressConfig?.site_title || '');
  const [tagline, setTagline] = useState(voopressConfig?.tagline || '');
  const [blogSettings, setBlogSettings] = useState(voopressConfig?.blog_settings || {});
  const [features, setFeatures] = useState(voopressConfig?.features || {});

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  useEffect(() => {
    setSiteTitle(voopressConfig?.site_title || '');
    setTagline(voopressConfig?.tagline || '');
    setBlogSettings(voopressConfig?.blog_settings || {});
    setFeatures(voopressConfig?.features || {});
  }, [voopressConfig]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/script-features/voopress/dashboard/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await api.put('/v1/script-features/voopress/config', {
        site_title: siteTitle,
        tagline: tagline,
        blog_settings: blogSettings,
        features: features,
      });

      if (response.success) {
        onConfigChange(response.data.voopress_config);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'dashboard' as TabType, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'posts' as TabType, icon: PenLine, label: 'Posts' },
    { id: 'pages' as TabType, icon: File, label: 'Pages' },
    { id: 'comments' as TabType, icon: MessageSquare, label: 'Comments' },
    { id: 'appearance' as TabType, icon: Palette, label: 'Appearance' },
    { id: 'users' as TabType, icon: Users, label: 'Users' },
    { id: 'settings' as TabType, icon: Settings, label: 'Settings' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e2d] rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Sidebar - WordPress Style */}
        <div className="w-56 bg-[#1a1a2e] border-r border-gray-700 flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-purple-400">Voo</span>Press
            </h2>
            <p className="text-xs text-gray-500 mt-1 truncate">{siteTitle || 'My Site'}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-purple-600/20 text-purple-400 border-l-2 border-purple-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.id === 'comments' && stats.comments_count > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs bg-purple-600 rounded-full">
                    {stats.comments_count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
            >
              Close Dashboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#1a1a2e]">
            <h3 className="text-lg font-medium text-white capitalize">{activeTab}</h3>
            <div className="flex items-center gap-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Open preview
                }}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View Site
              </a>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Welcome */}
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg p-6 border border-purple-500/30">
                  <h4 className="text-xl font-semibold text-white mb-2">
                    Welcome to VooPress!
                  </h4>
                  <p className="text-gray-300">
                    Manage your blog, customize your theme, and publish content - all from this WordPress-style dashboard.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[#2a2a4a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.posts_count}</p>
                    <p className="text-sm text-gray-400">Posts</p>
                  </div>

                  <div className="bg-[#2a2a4a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <File className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.pages_count}</p>
                    <p className="text-sm text-gray-400">Pages</p>
                  </div>

                  <div className="bg-[#2a2a4a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.comments_count}</p>
                    <p className="text-sm text-gray-400">Comments</p>
                  </div>

                  <div className="bg-[#2a2a4a] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.users_count}</p>
                    <p className="text-sm text-gray-400">Users</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#2a2a4a] rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Quick Draft
                    </h5>
                    <input
                      type="text"
                      placeholder="Post title"
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white text-sm mb-2"
                    />
                    <textarea
                      placeholder="What's on your mind?"
                      rows={3}
                      className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white text-sm mb-2 resize-none"
                    />
                    <button
                      onClick={onOpenBlogManager}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg"
                    >
                      Save Draft
                    </button>
                  </div>

                  <div className="bg-[#2a2a4a] rounded-lg p-4">
                    <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      At a Glance
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Theme</span>
                        <span className="text-purple-400 capitalize">{voopressTheme}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Comments</span>
                        <span className={features.comments_enabled ? 'text-green-400' : 'text-gray-500'}>
                          {features.comments_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Multi-Author</span>
                        <span className={features.multi_author ? 'text-green-400' : 'text-gray-500'}>
                          {features.multi_author ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#2a2a4a] rounded-lg p-4">
                  <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Activity
                  </h5>
                  <div className="text-sm text-gray-400 text-center py-4">
                    No recent activity to display.
                  </div>
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-400">
                    Manage your blog posts from the Blog Manager.
                  </p>
                  <button
                    onClick={onOpenBlogManager}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <PenLine className="w-4 h-4" />
                    Open Blog Manager
                  </button>
                </div>

                <div className="bg-[#2a2a4a] rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">
                    {stats.posts_count} Posts
                  </h4>
                  <p className="text-gray-400 mb-4">
                    Create, edit, and manage your blog posts in the Blog Manager.
                  </p>
                  <button
                    onClick={onOpenBlogManager}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    Manage Posts
                  </button>
                </div>
              </div>
            )}

            {/* Pages Tab */}
            {activeTab === 'pages' && (
              <div className="space-y-4">
                <p className="text-gray-400">
                  VooPress pages are managed in the Website Builder. Use the page editor to modify your About, Contact, and other pages.
                </p>

                <div className="bg-[#2a2a4a] rounded-lg p-8 text-center">
                  <File className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">
                    {stats.pages_count} Pages
                  </h4>
                  <p className="text-gray-400 mb-4">
                    Pages are created based on your VooPress theme.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    Edit Pages in Builder
                  </button>
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {features.comments_enabled ? (
                  <div className="bg-[#2a2a4a] rounded-lg p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">
                      {stats.comments_count} Comments
                    </h4>
                    <p className="text-gray-400">
                      Comments management will be available in the Blog Manager.
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400">
                      Comments are currently disabled. Enable them in Settings to allow visitors to comment on your posts.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                {/* Sub-tabs */}
                <div className="flex gap-2 border-b border-gray-700 pb-2">
                  {(['themes', 'customize', 'widgets', 'menus'] as AppearanceSubTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAppearanceSubTab(tab)}
                      className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
                        appearanceSubTab === tab
                          ? 'bg-[#2a2a4a] text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {appearanceSubTab === 'themes' && (
                  <ThemeSelector
                    currentTheme={voopressTheme}
                    onThemeChange={async (newTheme) => {
                      // Reload VooPress status to get updated config and pages
                      try {
                        const response = await api.get('/v1/script-features/voopress/status');
                        if (response.success && response.data?.voopress_config) {
                          onConfigChange(response.data.voopress_config);
                        }
                        // Reload stats since pages may have changed
                        loadStats();
                        // Notify parent to reload pages
                        if (onThemeChanged) {
                          onThemeChanged();
                        }
                      } catch (err) {
                        console.error('Failed to reload VooPress status:', err);
                      }
                    }}
                  />
                )}

                {appearanceSubTab === 'customize' && (
                  <div className="space-y-4">
                    <div className="bg-[#2a2a4a] rounded-lg p-4">
                      <h5 className="font-medium text-white mb-4">Colors</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Primary Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={voopressConfig?.colors?.primary || '#3B82F6'}
                              className="w-10 h-8 rounded cursor-pointer"
                              onChange={(e) => {
                                // Handle color change
                              }}
                            />
                            <span className="text-sm text-gray-300">
                              {voopressConfig?.colors?.primary || '#3B82F6'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {appearanceSubTab === 'widgets' && (
                  <WidgetManager
                    widgets={voopressConfig?.sidebar_widgets || []}
                    onWidgetsChange={(widgets) => {
                      // Handle widgets change
                    }}
                  />
                )}

                {appearanceSubTab === 'menus' && (
                  <MenuBuilder
                    menus={voopressConfig?.menus || {}}
                    onMenusChange={(menus) => {
                      // Handle menus change
                    }}
                  />
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {features.multi_author ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400">
                        Manage authors and users through the User Access System.
                      </p>
                      <button
                        onClick={onOpenUasManager}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Open User Manager
                      </button>
                    </div>

                    <div className="bg-[#2a2a4a] rounded-lg p-8 text-center">
                      <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-white mb-2">
                        {stats.users_count} Users
                      </h4>
                      <p className="text-gray-400 mb-4">
                        Manage user roles: Administrator, Editor, Author, Contributor, Subscriber
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 mb-2">
                      Multi-author support is disabled.
                    </p>
                    <p className="text-gray-400 text-sm">
                      Enable multi-author in Settings to allow multiple users to contribute to your blog.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-[#2a2a4a] rounded-lg p-4">
                  <h5 className="font-medium text-white mb-4">General Settings</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Site Title</label>
                      <input
                        type="text"
                        value={siteTitle}
                        onChange={(e) => setSiteTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Reading Settings */}
                <div className="bg-[#2a2a4a] rounded-lg p-4">
                  <h5 className="font-medium text-white mb-4">Reading Settings</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Posts Per Page</label>
                      <select
                        value={blogSettings.posts_per_page || 10}
                        onChange={(e) =>
                          setBlogSettings({ ...blogSettings, posts_per_page: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-600 rounded-lg text-white"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={blogSettings.show_excerpts !== false}
                        onChange={(e) =>
                          setBlogSettings({ ...blogSettings, show_excerpts: e.target.checked })
                        }
                        className="rounded border-gray-600 bg-[#1a1a2e] text-purple-500"
                      />
                      Show excerpts on homepage
                    </label>
                  </div>
                </div>

                {/* Discussion Settings */}
                <div className="bg-[#2a2a4a] rounded-lg p-4">
                  <h5 className="font-medium text-white mb-4">Discussion Settings</h5>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={features.comments_enabled}
                        onChange={(e) =>
                          setFeatures({ ...features, comments_enabled: e.target.checked })
                        }
                        className="rounded border-gray-600 bg-[#1a1a2e] text-purple-500"
                      />
                      Allow comments on posts
                    </label>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={features.multi_author}
                        onChange={(e) =>
                          setFeatures({ ...features, multi_author: e.target.checked })
                        }
                        className="rounded border-gray-600 bg-[#1a1a2e] text-purple-500"
                      />
                      Enable multi-author support
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VooPressDashboard;
