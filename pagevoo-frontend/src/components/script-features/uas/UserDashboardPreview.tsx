import React, { useState } from 'react';
import {
  User,
  Settings,
  Lock,
  Mail,
  Calendar,
  LogOut,
  ChevronRight,
  Edit2,
  Shield,
  Bell,
  CreditCard,
  FileText,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';

interface DashboardConfig {
  name: string;
  showWelcome: boolean;
  welcomeText: string;
  showAvatar: boolean;
  showProfileCard: boolean;
  showQuickActions: boolean;
  quickActions: Array<{
    id: string;
    label: string;
    icon: string;
    enabled: boolean;
  }>;
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

interface UserDashboardPreviewProps {
  config: DashboardConfig;
  isPreview?: boolean;
}

const defaultQuickActions = [
  { id: 'profile', label: 'Edit Profile', icon: 'Edit2', enabled: true },
  { id: 'security', label: 'Security Settings', icon: 'Lock', enabled: true },
  { id: 'notifications', label: 'Notifications', icon: 'Bell', enabled: true },
  { id: 'password', label: 'Change Password', icon: 'Shield', enabled: true },
];

const UserDashboardPreview: React.FC<UserDashboardPreviewProps> = ({ config, isPreview = true }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  const containerStyle = {
    padding: config.containerStyle?.padding || '24px',
    background: config.containerStyle?.background || '#ffffff',
    borderRadius: config.containerStyle?.borderRadius || '12px',
    maxWidth: config.containerStyle?.maxWidth || '900px',
    margin: config.containerStyle?.margin || '0 auto',
  };

  const quickActions = config.quickActions || defaultQuickActions;

  // Mock user data for preview
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    group: 'Members',
    joinedDate: 'Nov 15, 2024',
    lastLogin: '2 hours ago',
  };

  // Preview tab selector for builder
  if (isPreview) {
    return (
      <div style={{ width: '100%' }}>
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 text-xs rounded ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            Dashboard View
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1 text-xs rounded ${
              activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            Settings View
          </button>
        </div>
        {activeTab === 'overview' ? (
          <DashboardOverview config={config} containerStyle={containerStyle} user={mockUser} quickActions={quickActions} />
        ) : (
          <SettingsView config={config} containerStyle={containerStyle} user={mockUser} />
        )}
      </div>
    );
  }

  return <DashboardOverview config={config} containerStyle={containerStyle} user={mockUser} quickActions={quickActions} />;
};

// Dashboard Overview
const DashboardOverview: React.FC<{
  config: DashboardConfig;
  containerStyle: React.CSSProperties;
  user: any;
  quickActions: any[];
}> = ({ config, containerStyle, user, quickActions }) => {
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Edit2,
      Lock,
      Bell,
      Shield,
      Settings,
      CreditCard,
      FileText,
      ShoppingBag,
      MessageSquare,
    };
    const Icon = icons[iconName] || Settings;
    return <Icon style={{ width: '18px', height: '18px' }} />;
  };

  return (
    <div style={containerStyle}>
      {/* Welcome Header */}
      {config.showWelcome && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
            {config.welcomeText || 'Welcome back'}, {user.name}!
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Here's what's happening with your account.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: config.showProfileCard ? '280px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Profile Card */}
        {config.showProfileCard && (
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            {config.showAvatar && (
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <User style={{ width: '40px', height: '40px', color: '#6b7280' }} />
              </div>
            )}
            <h3 style={{ fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
              {user.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              {user.email}
            </p>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500',
              }}
            >
              {user.group}
            </span>

            <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.813rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem',
                }}
              >
                <Calendar style={{ width: '14px', height: '14px' }} />
                Joined {user.joinedDate}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.813rem',
                  color: '#6b7280',
                }}
              >
                <Mail style={{ width: '14px', height: '14px' }} />
                Last login: {user.lastLogin}
              </div>
            </div>

            <button
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Edit2 style={{ width: '14px', height: '14px' }} />
              Edit Profile
            </button>
          </div>
        )}

        {/* Main Content */}
        <div>
          {/* Quick Actions */}
          {config.showQuickActions && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem',
                }}
              >
                Quick Actions
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {quickActions
                  .filter((a) => a.enabled)
                  .map((action) => (
                    <button
                      key={action.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ color: '#6b7280' }}>{getIcon(action.icon)}</span>
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>{action.label}</span>
                      <ChevronRight
                        style={{ width: '14px', height: '14px', color: '#9ca3af', marginLeft: 'auto' }}
                      />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Activity Section */}
          {config.showActivitySection && (
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem',
                }}
              >
                {config.activitySectionTitle || 'Recent Activity'}
              </h3>
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                {[
                  { action: 'Logged in', time: '2 hours ago' },
                  { action: 'Updated profile', time: 'Yesterday' },
                  { action: 'Changed password', time: '3 days ago' },
                ].map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: index < 2 ? '1px solid #e5e7eb' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>{activity.action}</span>
                    <span style={{ fontSize: '0.813rem', color: '#9ca3af' }}>{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations */}
          {config.showIntegrations && config.enabledIntegrations?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.75rem',
                }}
              >
                Your Features
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {config.enabledIntegrations.includes('booking') && (
                  <FeatureCard icon={Calendar} label="My Bookings" count={3} />
                )}
                {config.enabledIntegrations.includes('shop') && (
                  <FeatureCard icon={ShoppingBag} label="My Orders" count={5} />
                )}
                {config.enabledIntegrations.includes('voopress') && (
                  <FeatureCard icon={FileText} label="My Posts" count={12} />
                )}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  label: string;
  count: number;
}> = ({ icon: Icon, label, count }) => (
  <div
    style={{
      padding: '1rem',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      textAlign: 'center',
    }}
  >
    <Icon style={{ width: '24px', height: '24px', color: '#3b82f6', margin: '0 auto 0.5rem' }} />
    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>{count}</div>
    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</div>
  </div>
);

// Settings View
const SettingsView: React.FC<{
  config: DashboardConfig;
  containerStyle: React.CSSProperties;
  user: any;
}> = ({ config, containerStyle, user }) => {
  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
        Account Settings
      </h2>

      {/* Profile Section */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
          Profile Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              First Name
            </label>
            <input
              type="text"
              defaultValue="John"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Last Name
            </label>
            <input
              type="text"
              defaultValue="Doe"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Email Address
          </label>
          <input
            type="email"
            defaultValue={user.email}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>
      </div>

      {/* Password Section */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
          Change Password
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Current Password
          </label>
          <input
            type="password"
            placeholder="Enter current password"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="New password"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.813rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
        <button
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Update Password
        </button>
      </div>

      {/* Security Questions Section */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
          Security Questions
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Your security questions are used to verify your identity when resetting your password.
        </p>
        <button
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Update Security Questions
        </button>
      </div>
    </div>
  );
};

export default UserDashboardPreview;
