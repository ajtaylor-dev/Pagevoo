import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
}

interface DashboardConfig {
  name: string;
  showWelcome: boolean;
  welcomeText: string;
  showAvatar: boolean;
  showProfileCard: boolean;
  showQuickActions: boolean;
  quickActions: QuickAction[];
  showActivitySection: boolean;
  activitySectionTitle: string;
  showIntegrations: boolean;
  enabledIntegrations: string[];
  containerStyle: {
    padding: string;
    background: string;
    borderRadius: string;
    maxWidth: string;
    margin: string;
  };
}

interface UserDashboardPropertiesProps {
  section: {
    id: number;
    type: string;
    content: {
      dashboardConfig: DashboardConfig;
    };
  };
  onUpdate: (sectionId: number, updates: any) => void;
}

const defaultQuickActions: QuickAction[] = [
  { id: 'profile', label: 'Edit Profile', icon: 'Edit2', enabled: true },
  { id: 'security', label: 'Security Settings', icon: 'Lock', enabled: true },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', enabled: true },
  { id: 'password', label: 'Change Password', icon: 'Shield', enabled: true },
];

const UserDashboardProperties: React.FC<UserDashboardPropertiesProps> = ({ section, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    welcome: true,
    profile: false,
    quickActions: false,
    activity: false,
    integrations: false,
    container: false,
  });

  const config = section.content?.dashboardConfig || {};
  const quickActions = config.quickActions || defaultQuickActions;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (updates: Partial<DashboardConfig>) => {
    onUpdate(section.id, {
      ...section.content,
      dashboardConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const updateContainerStyle = (updates: Partial<DashboardConfig['containerStyle']>) => {
    updateConfig({
      containerStyle: {
        ...config.containerStyle,
        ...updates,
      },
    });
  };

  const updateQuickAction = (actionId: string, updates: Partial<QuickAction>) => {
    const updatedActions = quickActions.map((action) =>
      action.id === actionId ? { ...action, ...updates } : action
    );
    updateConfig({ quickActions: updatedActions });
  };

  const toggleIntegration = (integration: string) => {
    const current = config.enabledIntegrations || [];
    const updated = current.includes(integration)
      ? current.filter((i) => i !== integration)
      : [...current, integration];
    updateConfig({ enabledIntegrations: updated });
  };

  const CollapsibleSection = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-700">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-200 hover:bg-gray-700/50"
      >
        {title}
        {expandedSections[id] ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {expandedSections[id] && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="text-sm">
      {/* Welcome Section */}
      <CollapsibleSection id="welcome" title="Welcome Header">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showWelcome ?? true}
              onChange={(e) => updateConfig({ showWelcome: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show welcome message</span>
          </label>
        </div>

        {config.showWelcome && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Welcome Text</label>
            <input
              type="text"
              value={config.welcomeText || 'Welcome back'}
              onChange={(e) => updateConfig({ welcomeText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              placeholder="Welcome back"
            />
            <p className="text-xs text-gray-500 mt-1">User's name will be appended automatically</p>
          </div>
        )}
      </CollapsibleSection>

      {/* Profile Card Section */}
      <CollapsibleSection id="profile" title="Profile Card">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showProfileCard ?? true}
              onChange={(e) => updateConfig({ showProfileCard: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show profile card</span>
          </label>

          {config.showProfileCard && (
            <label className="flex items-center gap-2 cursor-pointer ml-6">
              <input
                type="checkbox"
                checked={config.showAvatar ?? true}
                onChange={(e) => updateConfig({ showAvatar: e.target.checked })}
                className="rounded border-gray-600"
              />
              <span className="text-gray-300">Show avatar</span>
            </label>
          )}
        </div>
      </CollapsibleSection>

      {/* Quick Actions Section */}
      <CollapsibleSection id="quickActions" title="Quick Actions">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showQuickActions ?? true}
              onChange={(e) => updateConfig({ showQuickActions: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show quick actions</span>
          </label>
        </div>

        {config.showQuickActions && (
          <div className="space-y-2 mt-2">
            <label className="block text-xs text-gray-400">Available Actions</label>
            {quickActions.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-2 p-2 bg-gray-800 rounded"
              >
                <GripVertical className="w-4 h-4 text-gray-500 cursor-move" />
                <input
                  type="checkbox"
                  checked={action.enabled}
                  onChange={(e) => updateQuickAction(action.id, { enabled: e.target.checked })}
                  className="rounded border-gray-600"
                />
                <input
                  type="text"
                  value={action.label}
                  onChange={(e) => updateQuickAction(action.id, { label: e.target.value })}
                  className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Activity Section */}
      <CollapsibleSection id="activity" title="Activity Section">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showActivitySection ?? true}
              onChange={(e) => updateConfig({ showActivitySection: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show activity section</span>
          </label>
        </div>

        {config.showActivitySection && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Section Title</label>
            <input
              type="text"
              value={config.activitySectionTitle || 'Recent Activity'}
              onChange={(e) => updateConfig({ activitySectionTitle: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
          </div>
        )}
      </CollapsibleSection>

      {/* Integrations Section */}
      <CollapsibleSection id="integrations" title="Feature Integrations">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showIntegrations ?? false}
              onChange={(e) => updateConfig({ showIntegrations: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show feature integrations</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Display user data from other installed features
          </p>
        </div>

        {config.showIntegrations && (
          <div className="space-y-2 mt-2">
            <label className="block text-xs text-gray-400">Available Integrations</label>

            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-800 rounded">
              <input
                type="checkbox"
                checked={config.enabledIntegrations?.includes('booking') || false}
                onChange={() => toggleIntegration('booking')}
                className="rounded border-gray-600"
              />
              <span className="text-gray-300">Booking - My Bookings</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-800 rounded">
              <input
                type="checkbox"
                checked={config.enabledIntegrations?.includes('shop') || false}
                onChange={() => toggleIntegration('shop')}
                className="rounded border-gray-600"
              />
              <span className="text-gray-300">Shop - My Orders</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 bg-gray-800 rounded">
              <input
                type="checkbox"
                checked={config.enabledIntegrations?.includes('voopress') || false}
                onChange={() => toggleIntegration('voopress')}
                className="rounded border-gray-600"
              />
              <span className="text-gray-300">VooPress - My Posts</span>
            </label>
          </div>
        )}
      </CollapsibleSection>

      {/* Container Style Section */}
      <CollapsibleSection id="container" title="Container Style">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Padding</label>
          <input
            type="text"
            value={config.containerStyle?.padding || '24px'}
            onChange={(e) => updateContainerStyle({ padding: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Background</label>
          <input
            type="text"
            value={config.containerStyle?.background || '#ffffff'}
            onChange={(e) => updateContainerStyle({ background: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Border Radius</label>
          <input
            type="text"
            value={config.containerStyle?.borderRadius || '12px'}
            onChange={(e) => updateContainerStyle({ borderRadius: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Width</label>
          <input
            type="text"
            value={config.containerStyle?.maxWidth || '900px'}
            onChange={(e) => updateContainerStyle({ maxWidth: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Margin</label>
          <input
            type="text"
            value={config.containerStyle?.margin || '0 auto'}
            onChange={(e) => updateContainerStyle({ margin: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default UserDashboardProperties;
