import React, { useState } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, ShieldQuestion } from 'lucide-react';

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

interface VerifyEmailPreviewProps {
  config: VerifyEmailConfig;
  isPreview?: boolean;
}

const defaultConfig: VerifyEmailConfig = {
  name: 'Verify Email',
  verifyingTitle: 'Verifying your email...',
  verifyingMessage: 'Please wait while we verify your email address.',
  successTitle: 'Email Verified!',
  successMessage: 'Your email has been verified. Please complete the security questions below.',
  expiredTitle: 'Link Expired',
  expiredMessage: 'This verification link has expired. Please request a new one.',
  securityQuestionsTitle: 'Set Up Security Questions',
  securityQuestionsDescription: 'Choose 3 security questions and provide answers. These will be used to verify your identity if you forget your password.',
  submitButtonText: 'Complete Registration',
  resendLinkText: 'Resend verification email',
  containerStyle: {
    padding: '32px',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    maxWidth: '500px',
    margin: '0 auto',
  },
};

const VerifyEmailPreview: React.FC<VerifyEmailPreviewProps> = ({
  config: propConfig,
  isPreview = true,
}) => {
  const config = { ...defaultConfig, ...propConfig };
  const [currentView, setCurrentView] = useState<'verifying' | 'success' | 'expired' | 'questions'>('verifying');

  const containerStyle = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || '#ffffff',
    borderRadius: config.containerStyle?.borderRadius || '8px',
    border: config.containerStyle?.border || '1px solid #e5e7eb',
    maxWidth: config.containerStyle?.maxWidth || '500px',
    margin: config.containerStyle?.margin || '0 auto',
  };

  // Preview controls
  if (isPreview) {
    return (
      <div style={{ width: '100%' }}>
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setCurrentView('verifying')}
            className={`px-3 py-1 text-xs rounded ${currentView === 'verifying' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Verifying
          </button>
          <button
            onClick={() => setCurrentView('success')}
            className={`px-3 py-1 text-xs rounded ${currentView === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Success
          </button>
          <button
            onClick={() => setCurrentView('questions')}
            className={`px-3 py-1 text-xs rounded ${currentView === 'questions' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Security Questions
          </button>
          <button
            onClick={() => setCurrentView('expired')}
            className={`px-3 py-1 text-xs rounded ${currentView === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Expired
          </button>
        </div>
        <VerifyEmailView config={config} containerStyle={containerStyle} view={currentView} />
      </div>
    );
  }

  return <VerifyEmailView config={config} containerStyle={containerStyle} view="verifying" />;
};

// Main View Component
const VerifyEmailView: React.FC<{
  config: VerifyEmailConfig;
  containerStyle: React.CSSProperties;
  view: 'verifying' | 'success' | 'expired' | 'questions';
}> = ({ config, containerStyle, view }) => {
  return (
    <div style={containerStyle}>
      {view === 'verifying' && <VerifyingView config={config} />}
      {view === 'success' && <SuccessView config={config} />}
      {view === 'questions' && <SecurityQuestionsView config={config} />}
      {view === 'expired' && <ExpiredView config={config} />}
    </div>
  );
};

// Verifying State
const VerifyingView: React.FC<{ config: VerifyEmailConfig }> = ({ config }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#dbeafe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <Loader2
          style={{
            width: '40px',
            height: '40px',
            color: '#3b82f6',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        {config.verifyingTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        {config.verifyingMessage}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Success State
const SuccessView: React.FC<{ config: VerifyEmailConfig }> = ({ config }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <CheckCircle style={{ width: '40px', height: '40px', color: '#16a34a' }} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        {config.successTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px' }}>
        {config.successMessage}
      </p>
      <button
        style={{
          padding: '12px 32px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        Continue to Security Questions
      </button>
    </div>
  );
};

// Security Questions Step
const SecurityQuestionsView: React.FC<{ config: VerifyEmailConfig }> = ({ config }) => {
  // Mock security questions
  const availableQuestions = [
    "What was your childhood nickname?",
    "In what city were you born?",
    "What is the name of your first pet?",
    "What was your first car?",
    "What elementary school did you attend?",
    "What is your mother's maiden name?",
    "What was the name of your first employer?",
    "What is the name of the street you grew up on?",
  ];

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <ShieldQuestion style={{ width: '28px', height: '28px', color: '#d97706' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          {config.securityQuestionsTitle}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {config.securityQuestionsDescription}
        </p>
      </div>

      <form>
        {[1, 2, 3].map((num) => (
          <div key={num} style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#374151',
                fontSize: '0.875rem',
              }}
            >
              Question {num}
            </label>
            <select
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                marginBottom: '8px',
                boxSizing: 'border-box',
                backgroundColor: 'white',
              }}
            >
              <option value="">Select a question...</option>
              {availableQuestions.map((q, i) => (
                <option key={i} value={i}>{q}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Your answer"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '8px',
          }}
        >
          {config.submitButtonText}
        </button>
      </form>
    </>
  );
};

// Expired State
const ExpiredView: React.FC<{ config: VerifyEmailConfig }> = ({ config }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
        }}
      >
        <XCircle style={{ width: '40px', height: '40px', color: '#dc2626' }} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
        {config.expiredTitle}
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '24px' }}>
        {config.expiredMessage}
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontWeight: '500',
            color: '#374151',
            fontSize: '0.875rem',
            textAlign: 'left',
          }}
        >
          Email Address
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer',
        }}
      >
        {config.resendLinkText}
      </button>
    </div>
  );
};

export default VerifyEmailPreview;
