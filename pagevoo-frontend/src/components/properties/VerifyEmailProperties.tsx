import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface VerifyEmailConfig {
  name: string;
  verifyingTitle: string;
  verifyingMessage: string;
  successTitle: string;
  successMessage: string;
  expiredTitle: string;
  expiredMessage: string;
  securityQuestionsTitle: string;
  securityQuestionsDescription: string;
  submitButtonText: string;
  resendLinkText: string;
  containerStyle: {
    padding: string;
    background: string;
    borderRadius: string;
    border: string;
    maxWidth: string;
    margin: string;
  };
}

interface VerifyEmailPropertiesProps {
  section: {
    id: number;
    type: string;
    content: {
      verifyEmailConfig: VerifyEmailConfig;
    };
  };
  onUpdate: (sectionId: number, updates: any) => void;
}

const VerifyEmailProperties: React.FC<VerifyEmailPropertiesProps> = ({ section, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    verifying: true,
    success: false,
    questions: false,
    expired: false,
    container: false,
  });

  const config = section.content?.verifyEmailConfig || {};

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (updates: Partial<VerifyEmailConfig>) => {
    onUpdate(section.id, {
      ...section.content,
      verifyEmailConfig: {
        ...config,
        ...updates,
      },
    });
  };

  const updateContainerStyle = (updates: Partial<VerifyEmailConfig['containerStyle']>) => {
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
      {/* Verifying State */}
      <CollapsibleSection id="verifying" title="Verifying State">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={config.verifyingTitle || 'Verifying your email...'}
            onChange={(e) => updateConfig({ verifyingTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Message</label>
          <textarea
            value={config.verifyingMessage || 'Please wait while we verify your email address.'}
            onChange={(e) => updateConfig({ verifyingMessage: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>
      </CollapsibleSection>

      {/* Success State */}
      <CollapsibleSection id="success" title="Success State">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={config.successTitle || 'Email Verified!'}
            onChange={(e) => updateConfig({ successTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Message</label>
          <textarea
            value={config.successMessage || 'Your email has been verified. Please complete the security questions below.'}
            onChange={(e) => updateConfig({ successMessage: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>
      </CollapsibleSection>

      {/* Security Questions */}
      <CollapsibleSection id="questions" title="Security Questions">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={config.securityQuestionsTitle || 'Set Up Security Questions'}
            onChange={(e) => updateConfig({ securityQuestionsTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={config.securityQuestionsDescription || 'Choose 3 security questions and provide answers.'}
            onChange={(e) => updateConfig({ securityQuestionsDescription: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Submit Button Text</label>
          <input
            type="text"
            value={config.submitButtonText || 'Complete Registration'}
            onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>
      </CollapsibleSection>

      {/* Expired State */}
      <CollapsibleSection id="expired" title="Expired State">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={config.expiredTitle || 'Link Expired'}
            onChange={(e) => updateConfig({ expiredTitle: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Message</label>
          <textarea
            value={config.expiredMessage || 'This verification link has expired. Please request a new one.'}
            onChange={(e) => updateConfig({ expiredMessage: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Resend Link Text</label>
          <input
            type="text"
            value={config.resendLinkText || 'Resend verification email'}
            onChange={(e) => updateConfig({ resendLinkText: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
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
            value={config.containerStyle?.maxWidth || '500px'}
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

export default VerifyEmailProperties;
