import React, { useState } from 'react';
import { User, LogOut, Settings } from 'lucide-react';

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

interface LoginBoxPreviewProps {
  config: LoginConfig;
  isPreview?: boolean;
}

const LoginBoxPreview: React.FC<LoginBoxPreviewProps> = ({ config, isPreview = true }) => {
  // For preview, show both states
  const [showLoggedIn, setShowLoggedIn] = useState(false);

  const containerStyle = {
    padding: config.containerStyle?.padding || '32px',
    background: config.containerStyle?.background || '#ffffff',
    borderRadius: config.containerStyle?.borderRadius || '8px',
    border: config.containerStyle?.border || '1px solid #e5e7eb',
    maxWidth: config.containerStyle?.maxWidth || '400px',
    margin: config.containerStyle?.margin || '0 auto',
  };

  // Preview toggle for builder
  if (isPreview) {
    return (
      <div style={{ width: '100%' }}>
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setShowLoggedIn(false)}
            className={`px-3 py-1 text-xs rounded ${!showLoggedIn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Logged Out View
          </button>
          <button
            onClick={() => setShowLoggedIn(true)}
            className={`px-3 py-1 text-xs rounded ${showLoggedIn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            Logged In View
          </button>
        </div>
        {showLoggedIn ? (
          <LoggedInView config={config} containerStyle={containerStyle} />
        ) : (
          <LoginFormView config={config} containerStyle={containerStyle} />
        )}
      </div>
    );
  }

  // In production, show based on actual auth state
  return <LoginFormView config={config} containerStyle={containerStyle} />;
};

// Login Form View
const LoginFormView: React.FC<{ config: LoginConfig; containerStyle: React.CSSProperties }> = ({
  config,
  containerStyle,
}) => {
  return (
    <div style={containerStyle}>
      {config.showTitle && (
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
          {config.title || 'Sign In'}
        </h2>
      )}

      <form>
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
          <input
            type="email"
            placeholder="you@example.com"
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
          <input
            type="password"
            placeholder="••••••••"
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {config.showRememberMe && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '1rem', height: '1rem' }} />
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Remember me</span>
            </label>
          )}
          {config.showForgotPassword && (
            <a
              href="#"
              style={{
                fontSize: '0.875rem',
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >
              {config.forgotPasswordText || 'Forgot password?'}
            </a>
          )}
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
          }}
        >
          {config.submitButtonText || 'Sign In'}
        </button>

        {config.showRegisterLink && (
          <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
            {config.registerLinkText || "Don't have an account?"}{' '}
            <a href="#" style={{ color: '#3b82f6', textDecoration: 'none' }}>
              Sign up
            </a>
          </p>
        )}
      </form>
    </div>
  );
};

// Logged In View (Status Box)
const LoggedInView: React.FC<{ config: LoginConfig; containerStyle: React.CSSProperties }> = ({
  config,
  containerStyle,
}) => {
  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User style={{ width: '24px', height: '24px', color: '#6b7280' }} />
        </div>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {config.welcomeText || 'Welcome back,'}
          </p>
          <p style={{ fontWeight: '600', color: '#111827' }}>John Doe</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {config.showDashboardLink && (
          <a
            href="#"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.375rem',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            <Settings style={{ width: '16px', height: '16px' }} />
            {config.dashboardLinkText || 'Dashboard'}
          </a>
        )}
        {config.showLogoutButton && (
          <button
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#fee2e2',
              borderRadius: '0.375rem',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            {config.logoutButtonText || 'Sign Out'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoginBoxPreview;
