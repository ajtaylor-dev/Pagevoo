import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LoginConfig {
  name: string;
  showTitle: boolean;
  title: string;
  showRememberMe: boolean;
  showForgotPassword: boolean;
  showRegisterLink: boolean;
  registerLinkText: string;
  forgotPasswordText: string;
  submitButtonText: string;
  welcomeText: string;
  showDashboardLink: boolean;
  dashboardLinkText: string;
  showLogoutButton: boolean;
  logoutButtonText: string;
  containerStyle: {
    padding: string;
    background: string;
    borderRadius: string;
    border: string;
    maxWidth: string;
    margin: string;
  };
}

interface LoginBoxPropertiesProps {
  section: {
    id: string;
    type: string;
    content: {
      loginConfig: LoginConfig;
    };
  };
  onUpdate: (sectionId: string, updates: any) => void;
}

const LoginBoxProperties: React.FC<LoginBoxPropertiesProps> = ({ section, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    loginForm: true,
    loggedInDisplay: false,
    container: false,
  });

  const config = section.content?.loginConfig || {};

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (updates: Partial<LoginConfig>) => {
    onUpdate(section.id, {
      content: {
        ...section.content,
        loginConfig: {
          ...config,
          ...updates,
        },
      },
    });
  };

  const updateContainerStyle = (updates: Partial<LoginConfig['containerStyle']>) => {
    updateConfig({
      containerStyle: {
        ...config.containerStyle,
        ...updates,
      },
    });
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
      {/* Login Form Section */}
      <CollapsibleSection id="loginForm" title="Login Form">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Show Title</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showTitle ?? true}
              onChange={(e) => updateConfig({ showTitle: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Display form title</span>
          </label>
        </div>

        {config.showTitle && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title Text</label>
            <input
              type="text"
              value={config.title || 'Sign In'}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-400 mb-1">Submit Button Text</label>
          <input
            type="text"
            value={config.submitButtonText || 'Sign In'}
            onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showRememberMe ?? true}
              onChange={(e) => updateConfig({ showRememberMe: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show "Remember me"</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showForgotPassword ?? true}
              onChange={(e) => updateConfig({ showForgotPassword: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show "Forgot password"</span>
          </label>

          {config.showForgotPassword && (
            <input
              type="text"
              value={config.forgotPasswordText || 'Forgot your password?'}
              onChange={(e) => updateConfig({ forgotPasswordText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm ml-6"
              placeholder="Forgot password link text"
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showRegisterLink ?? true}
              onChange={(e) => updateConfig({ showRegisterLink: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show register link</span>
          </label>

          {config.showRegisterLink && (
            <input
              type="text"
              value={config.registerLinkText || "Don't have an account? Sign up"}
              onChange={(e) => updateConfig({ registerLinkText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm ml-6"
              placeholder="Register link text"
            />
          )}
        </div>
      </CollapsibleSection>

      {/* Logged In Display Section */}
      <CollapsibleSection id="loggedInDisplay" title="Logged In Display">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Welcome Text</label>
          <input
            type="text"
            value={config.welcomeText || 'Welcome back,'}
            onChange={(e) => updateConfig({ welcomeText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showDashboardLink ?? true}
              onChange={(e) => updateConfig({ showDashboardLink: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show Dashboard link</span>
          </label>

          {config.showDashboardLink && (
            <input
              type="text"
              value={config.dashboardLinkText || 'Dashboard'}
              onChange={(e) => updateConfig({ dashboardLinkText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm ml-6"
              placeholder="Dashboard link text"
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showLogoutButton ?? true}
              onChange={(e) => updateConfig({ showLogoutButton: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show Logout button</span>
          </label>

          {config.showLogoutButton && (
            <input
              type="text"
              value={config.logoutButtonText || 'Sign Out'}
              onChange={(e) => updateConfig({ logoutButtonText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm ml-6"
              placeholder="Logout button text"
            />
          )}
        </div>
      </CollapsibleSection>

      {/* Container Style Section */}
      <CollapsibleSection id="container" title="Container Style">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Padding</label>
          <input
            type="text"
            value={config.containerStyle?.padding || '32px'}
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
            value={config.containerStyle?.borderRadius || '8px'}
            onChange={(e) => updateContainerStyle({ borderRadius: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Border</label>
          <input
            type="text"
            value={config.containerStyle?.border || '1px solid #e5e7eb'}
            onChange={(e) => updateContainerStyle({ border: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Max Width</label>
          <input
            type="text"
            value={config.containerStyle?.maxWidth || '400px'}
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

export default LoginBoxProperties;
