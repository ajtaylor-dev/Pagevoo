import React, { useState } from 'react';
import { User, Mail, Lock, Shield, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

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

interface RegisterFormPreviewProps {
  config: RegisterConfig;
  isPreview?: boolean;
}

type RegistrationStep = 'form' | 'verify' | 'security' | 'success';

const RegisterFormPreview: React.FC<RegisterFormPreviewProps> = ({ config, isPreview = true }) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');

  const containerStyle = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || '#ffffff',
    borderRadius: config.containerStyle?.borderRadius || '8px',
    border: config.containerStyle?.border || '1px solid #e5e7eb',
    maxWidth: config.containerStyle?.maxWidth || '450px',
    margin: config.containerStyle?.margin || '0 auto',
  };

  // Preview step selector for builder
  if (isPreview) {
    return (
      <div style={{ width: '100%' }}>
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {[
            { id: 'form', label: 'Registration Form' },
            { id: 'verify', label: 'Email Verification' },
            { id: 'security', label: 'Security Questions' },
            { id: 'success', label: 'Success' },
          ].map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as RegistrationStep)}
              className={`px-3 py-1 text-xs rounded ${
                currentStep === step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
        {currentStep === 'form' && <RegistrationFormStep config={config} containerStyle={containerStyle} />}
        {currentStep === 'verify' && <EmailVerificationStep config={config} containerStyle={containerStyle} />}
        {currentStep === 'security' && <SecurityQuestionsStep config={config} containerStyle={containerStyle} />}
        {currentStep === 'success' && <SuccessStep config={config} containerStyle={containerStyle} />}
      </div>
    );
  }

  // Production - show based on actual registration state
  return <RegistrationFormStep config={config} containerStyle={containerStyle} />;
};

// Step 1: Registration Form
const RegistrationFormStep: React.FC<{
  config: RegisterConfig;
  containerStyle: React.CSSProperties;
}> = ({ config, containerStyle }) => {
  return (
    <div style={containerStyle}>
      {config.showTitle && (
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            {config.title || 'Create Account'}
          </h2>
          {config.subtitle && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {config.subtitle || 'Join us today'}
            </p>
          )}
        </div>
      )}

      <form>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151',
                fontSize: '0.875rem',
              }}
            >
              First Name
            </label>
            <div style={{ position: 'relative' }}>
              <User
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#9ca3af',
                }}
              />
              <input
                type="text"
                placeholder="John"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingLeft: '2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151',
                fontSize: '0.875rem',
              }}
            >
              Last Name
            </label>
            <input
              type="text"
              placeholder="Doe"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af',
              }}
            />
            <input
              type="email"
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingLeft: '2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af',
              }}
            />
            <input
              type="password"
              placeholder="Min. 8 characters"
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingLeft: '2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
            }}
          >
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#9ca3af',
              }}
            />
            <input
              type="password"
              placeholder="Confirm password"
              style={{
                width: '100%',
                padding: '0.75rem',
                paddingLeft: '2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {config.submitButtonText || 'Create Account'}
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </button>

        {config.showLoginLink && (
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
            {config.loginLinkText || 'Already have an account?'}{' '}
            <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Sign in
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

// Step 2: Email Verification
const EmailVerificationStep: React.FC<{
  config: RegisterConfig;
  containerStyle: React.CSSProperties;
}> = ({ config, containerStyle }) => {
  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <Mail style={{ width: '32px', height: '32px', color: '#3b82f6' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Verify Your Email
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          We've sent a verification code to your email address. Please enter it below.
        </p>
      </div>

      <form>
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            Verification Code
          </label>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            maxLength={6}
            style={{
              width: '100%',
              padding: '1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {config.verifyButtonText || 'Verify Email'}
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </button>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          Didn't receive the code?{' '}
          <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            Resend
          </a>
        </p>
      </form>
    </div>
  );
};

// Step 3: Security Questions
const SecurityQuestionsStep: React.FC<{
  config: RegisterConfig;
  containerStyle: React.CSSProperties;
}> = ({ config, containerStyle }) => {
  const sampleQuestions = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "In what city were you born?",
  ];

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <Shield style={{ width: '32px', height: '32px', color: '#16a34a' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Security Questions
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Please answer these security questions. They will be used to verify your identity if you need to reset your password.
        </p>
      </div>

      <form>
        {sampleQuestions.map((question, index) => (
          <div key={index} style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151',
                fontSize: '0.875rem',
              }}
            >
              {question}
            </label>
            <input
              type="text"
              placeholder="Your answer"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
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
            padding: '0.75rem',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '1.5rem',
          }}
        >
          {config.completeButtonText || 'Complete Registration'}
          <CheckCircle style={{ width: '16px', height: '16px' }} />
        </button>

        <button
          type="button"
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          Go Back
        </button>
      </form>
    </div>
  );
};

// Step 4: Success
const SuccessStep: React.FC<{
  config: RegisterConfig;
  containerStyle: React.CSSProperties;
}> = ({ config, containerStyle }) => {
  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <CheckCircle style={{ width: '48px', height: '48px', color: '#16a34a' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Registration Complete!
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          Your account has been created successfully. You can now sign in with your credentials.
        </p>

        <a
          href="#"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: '500',
            textDecoration: 'none',
          }}
        >
          Go to Login
          <ArrowRight style={{ width: '16px', height: '16px' }} />
        </a>
      </div>
    </div>
  );
};

export default RegisterFormPreview;
