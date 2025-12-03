import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface RegisterConfig {
  name: string;
  showTitle: boolean;
  title: string;
  subtitle: string;
  showLoginLink: boolean;
  loginLinkText: string;
  submitButtonText: string;
  verifyButtonText: string;
  completeButtonText: string;
  showSecurityQuestions: boolean;
  securityQuestionsCount: number;
  containerStyle: {
    padding: string;
    background: string;
    borderRadius: string;
    border: string;
    maxWidth: string;
    margin: string;
  };
}

interface RegisterFormPropertiesProps {
  section: {
    id: number;
    type: string;
    content: {
      registerConfig: RegisterConfig;
    };
  };
  onUpdate: (sectionId: number, updates: any) => void;
}

const RegisterFormProperties: React.FC<RegisterFormPropertiesProps> = ({ section, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    header: true,
    buttons: false,
    security: false,
    container: false,
  });

  const config = section.content?.registerConfig || {};

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (updates: Partial<RegisterConfig>) => {
    onUpdate(section.id, {
      ...section.content,
      registerConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const updateContainerStyle = (updates: Partial<RegisterConfig['containerStyle']>) => {
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
      {/* Header Section */}
      <CollapsibleSection id="header" title="Form Header">
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
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title Text</label>
              <input
                type="text"
                value={config.title || 'Create Account'}
                onChange={(e) => updateConfig({ title: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Subtitle</label>
              <input
                type="text"
                value={config.subtitle || 'Join us today'}
                onChange={(e) => updateConfig({ subtitle: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showLoginLink ?? true}
              onChange={(e) => updateConfig({ showLoginLink: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show login link</span>
          </label>

          {config.showLoginLink && (
            <input
              type="text"
              value={config.loginLinkText || 'Already have an account?'}
              onChange={(e) => updateConfig({ loginLinkText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm ml-6"
              placeholder="Login link text"
            />
          )}
        </div>
      </CollapsibleSection>

      {/* Buttons Section */}
      <CollapsibleSection id="buttons" title="Button Text">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Submit Button (Step 1)</label>
          <input
            type="text"
            value={config.submitButtonText || 'Create Account'}
            onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Verify Button (Step 2)</label>
          <input
            type="text"
            value={config.verifyButtonText || 'Verify Email'}
            onChange={(e) => updateConfig({ verifyButtonText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Complete Button (Step 3)</label>
          <input
            type="text"
            value={config.completeButtonText || 'Complete Registration'}
            onChange={(e) => updateConfig({ completeButtonText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>
      </CollapsibleSection>

      {/* Security Questions Section */}
      <CollapsibleSection id="security" title="Security Questions">
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showSecurityQuestions ?? true}
              onChange={(e) => updateConfig({ showSecurityQuestions: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Require security questions</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Users must answer security questions during registration for password recovery
          </p>
        </div>

        {config.showSecurityQuestions && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Number of Questions</label>
            <select
              value={config.securityQuestionsCount || 3}
              onChange={(e) => updateConfig({ securityQuestionsCount: parseInt(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            >
              <option value={2}>2 Questions</option>
              <option value={3}>3 Questions</option>
              <option value={4}>4 Questions</option>
              <option value={5}>5 Questions</option>
            </select>
          </div>
        )}
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
            value={config.containerStyle?.maxWidth || '450px'}
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

export default RegisterFormProperties;
