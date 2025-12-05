import React, { useState } from 'react';
import { Mail, KeyRound, ShieldQuestion, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

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

interface ForgotPasswordPreviewProps {
  config: ForgotPasswordConfig;
  isPreview?: boolean;
}

const defaultConfig: ForgotPasswordConfig = {
  name: 'Forgot Password',
  showTitle: true,
  title: 'Reset Password',
  showBackToLogin: true,
  backToLoginText: 'Back to Login',
  emailStepTitle: 'Forgot your password?',
  emailStepDescription: 'Enter your email address and we\'ll send you a link to reset your password.',
  securityStepTitle: 'Security Verification',
  securityStepDescription: 'Answer your security questions to verify your identity.',
  newPasswordStepTitle: 'Create New Password',
  newPasswordStepDescription: 'Enter your new password. Make sure it\'s at least 8 characters.',
  successTitle: 'Password Reset Complete!',
  successMessage: 'Your password has been successfully reset. You can now log in with your new password.',
  submitButtonText: 'Continue',
  containerStyle: {
    padding: '32px',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    maxWidth: '450px',
    margin: '0 auto',
  },
};

const ForgotPasswordPreview: React.FC<ForgotPasswordPreviewProps> = ({
  config: propConfig,
  isPreview = true
}) => {
  const config = { ...defaultConfig, ...propConfig };
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const containerStyle = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || '#ffffff',
    borderRadius: config.containerStyle?.borderRadius || '8px',
    border: config.containerStyle?.border || '1px solid #e5e7eb',
    maxWidth: config.containerStyle?.maxWidth || '450px',
    margin: config.containerStyle?.margin || '0 auto',
  };

  // Preview controls
  if (isPreview) {
    return (
      <div style={{ width: '100%' }}>
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1 text-xs rounded ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            1. Email
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            className={`px-3 py-1 text-xs rounded ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            2. Security Questions
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1 text-xs rounded ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            3. New Password
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            className={`px-3 py-1 text-xs rounded ${currentStep === 4 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            4. Success
          </button>
        </div>
        <PasswordResetFlow config={config} containerStyle={containerStyle} step={currentStep} />
      </div>
    );
  }

  return <PasswordResetFlow config={config} containerStyle={containerStyle} step={1} />;
};

// Main Flow Component
const PasswordResetFlow: React.FC<{
  config: ForgotPasswordConfig;
  containerStyle: React.CSSProperties;
  step: 1 | 2 | 3 | 4;
}> = ({ config, containerStyle, step }) => {
  // Step indicator
  const StepIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          style={{
            width: '32px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: s <= step && step < 4 ? '#3b82f6' : '#e5e7eb',
            transition: 'background-color 0.2s',
          }}
        />
      ))}
    </div>
  );

  return (
    <div style={containerStyle}>
      {step < 4 && <StepIndicator />}

      {step === 1 && <EmailStep config={config} />}
      {step === 2 && <SecurityQuestionsStep config={config} />}
      {step === 3 && <NewPasswordStep config={config} />}
      {step === 4 && <SuccessStep config={config} />}
    </div>
  );
};

// Step 1: Email Entry
const EmailStep: React.FC<{ config: ForgotPasswordConfig }> = ({ config }) => {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Mail style={{ width: '28px', height: '28px', color: '#3b82f6' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          {config.emailStepTitle}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {config.emailStepDescription}
        </p>
      </div>

      <form>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
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
          type="submit"
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
          Send Reset Link
        </button>

        {config.showBackToLogin && (
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '16px',
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            {config.backToLoginText}
          </a>
        )}
      </form>
    </>
  );
};

// Step 2: Security Questions
const SecurityQuestionsStep: React.FC<{ config: ForgotPasswordConfig }> = ({ config }) => {
  // Mock security questions
  const questions = [
    { id: 1, question: "What was your childhood nickname?" },
    { id: 2, question: "In what city were you born?" },
    { id: 3, question: "What is the name of your first pet?" },
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
          {config.securityStepTitle}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {config.securityStepDescription}
        </p>
      </div>

      <form>
        {questions.map((q, index) => (
          <div key={q.id} style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500',
                color: '#374151',
                fontSize: '0.875rem',
              }}
            >
              {index + 1}. {q.question}
            </label>
            <input
              type="text"
              placeholder="Your answer"
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
        ))}

        <button
          type="submit"
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
          Verify Answers
        </button>
      </form>
    </>
  );
};

// Step 3: New Password
const NewPasswordStep: React.FC<{ config: ForgotPasswordConfig }> = ({ config }) => {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Lock style={{ width: '28px', height: '28px', color: '#16a34a' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
          {config.newPasswordStepTitle}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {config.newPasswordStepDescription}
        </p>
      </div>

      <form>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
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

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
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

        {/* Password requirements */}
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
            Password must contain:
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#6b7280' }}>
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
          </ul>
        </div>

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
          }}
        >
          Reset Password
        </button>
      </form>
    </>
  );
};

// Step 4: Success
const SuccessStep: React.FC<{ config: ForgotPasswordConfig }> = ({ config }) => {
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

      <a
        href="#"
        style={{
          display: 'inline-block',
          padding: '12px 32px',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          fontWeight: '500',
        }}
      >
        Go to Login
      </a>
    </div>
  );
};

export default ForgotPasswordPreview;
