import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ForgotPasswordConfig {
  name: string;
  showTitle: boolean;
  title: string;
  showBackToLogin: boolean;
  backToLoginText: string;
  emailStepTitle: string;
  emailStepDescription: string;
  securityStepTitle: string;
  securityStepDescription: string;
  newPasswordStepTitle: string;
  newPasswordStepDescription: string;
  successTitle: string;
  successMessage: string;
  submitButtonText: string;
  containerStyle: {
    padding: string;
    background: string;
    borderRadius: string;
    border: string;
    maxWidth: string;
    margin: string;
  };
}

interface ForgotPasswordPropertiesProps {
  section: {
    id: number;
    type: string;
    content: {
      forgotPasswordConfig: ForgotPasswordConfig;
    };
  };
  onUpdate: (sectionId: number, updates: any) => void;
}

const ForgotPasswordProperties: React.FC<ForgotPasswordPropertiesProps> = ({ section, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    emailStep: true,
    securityStep: false,
    passwordStep: false,
    successStep: false,
    container: false,
  });

  const config = section.content?.forgotPasswordConfig || {};

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (updates: Partial<ForgotPasswordConfig>) => {
    onUpdate(section.id, {
      ...section.content,
      forgotPasswordConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const updateContainerStyle = (updates: Partial<ForgotPasswordConfig['containerStyle']>) => {
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
      {/* Email Step Section */}
      <CollapsibleSection id="emailStep" title="Step 1: Email Entry">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Step Title</label>
          <input
            type="text"
            value={config.emailStepTitle || 'Forgot your password?'}
            onChange={(e) => updateConfig({ emailStepTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={config.emailStepDescription || "Enter your email address and we'll send you a link to reset your password."}
            onChange={(e) => updateConfig({ emailStepDescription: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showBackToLogin ?? true}
              onChange={(e) => updateConfig({ showBackToLogin: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-gray-300">Show "Back to Login"</span>
          </label>

          {config.showBackToLogin && (
            <input
              type="text"
              value={config.backToLoginText || 'Back to Login'}
              onChange={(e) => updateConfig({ backToLoginText: e.target.value })}
              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm ml-6"
              placeholder="Back to login text"
            />
          )}
        </div>
      </CollapsibleSection>

      {/* Security Step Section */}
      <CollapsibleSection id="securityStep" title="Step 2: Security Questions">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Step Title</label>
          <input
            type="text"
            value={config.securityStepTitle || 'Security Verification'}
            onChange={(e) => updateConfig({ securityStepTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={config.securityStepDescription || 'Answer your security questions to verify your identity.'}
            onChange={(e) => updateConfig({ securityStepDescription: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>
      </CollapsibleSection>

      {/* Password Step Section */}
      <CollapsibleSection id="passwordStep" title="Step 3: New Password">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Step Title</label>
          <input
            type="text"
            value={config.newPasswordStepTitle || 'Create New Password'}
            onChange={(e) => updateConfig({ newPasswordStepTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={config.newPasswordStepDescription || "Enter your new password. Make sure it's at least 8 characters."}
            onChange={(e) => updateConfig({ newPasswordStepDescription: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>
      </CollapsibleSection>

      {/* Success Step Section */}
      <CollapsibleSection id="successStep" title="Step 4: Success">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Success Title</label>
          <input
            type="text"
            value={config.successTitle || 'Password Reset Complete!'}
            onChange={(e) => updateConfig({ successTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Success Message</label>
          <textarea
            value={config.successMessage || 'Your password has been successfully reset. You can now log in with your new password.'}
            onChange={(e) => updateConfig({ successMessage: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
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

export default ForgotPasswordProperties;
