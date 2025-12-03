import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  Lock,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Search,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Ban,
  Check,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { databaseService } from '../services/databaseService';

interface UasManagerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'template' | 'website';
  referenceId: number;
}

interface UasUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  group_id: number;
  group?: UasGroup;
  status: 'pending' | 'active' | 'suspended';
  email_verified: boolean;
  permission_overrides: Record<string, boolean> | null;
  created_at: string;
  last_login_at: string | null;
}

interface UasGroup {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  hierarchy_level: number;
  permissions: Record<string, boolean>;
  is_default: boolean;
  is_system: boolean;
  users_count?: number;
}

interface UasPageAccess {
  id: number;
  page_id: string;
  page_name: string;
  is_locked: boolean;
  allowed_groups: number[] | null;
  allowed_users: number[] | null;
  denied_users: number[] | null;
  redirect_to: 'login' | 'home' | 'custom';
  custom_redirect_url: string | null;
}

interface Permission {
  id: number;
  key: string;
  name: string;
  category: string;
  description: string | null;
}

type TabType = 'users' | 'groups' | 'page-access' | 'settings';

const UasManager: React.FC<UasManagerProps> = ({
  isOpen,
  onClose,
  type,
  referenceId,
}) => {
  const [databaseId, setDatabaseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<UasUser[]>([]);
  const [groups, setGroups] = useState<UasGroup[]>([]);
  const [pageAccess, setPageAccess] = useState<UasPageAccess[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit states
  const [editingUser, setEditingUser] = useState<UasUser | null>(null);
  const [editingGroup, setEditingGroup] = useState<UasGroup | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    pending_users: 0,
    suspended_users: 0,
    total_groups: 0,
    locked_pages: 0,
    recent_logins: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (referenceId && referenceId > 0) {
        loadData();
      } else {
        // Invalid reference ID - stop loading and show error
        setLoading(false);
        setError('Invalid reference ID. Please ensure you have a valid website or template selected.');
      }
    }
  }, [isOpen, referenceId, type]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First get the database instance
      const instance = await databaseService.getInstance(type, referenceId);
      if (!instance) {
        console.error('No database found for UAS');
        setError('No database found. Please ensure the User Access System feature is installed.');
        setLoading(false);
        return;
      }
      const dbId = instance.id;
      setDatabaseId(dbId);

      const [usersRes, groupsRes, pageAccessRes, permissionsRes, statsRes] = await Promise.all([
        api.get(`/v1/script-features/uas/users?db=${dbId}`),
        api.get(`/v1/script-features/uas/groups?db=${dbId}`),
        api.get(`/v1/script-features/uas/page-access?db=${dbId}`),
        api.get(`/v1/script-features/uas/permissions?db=${dbId}`),
        api.get(`/v1/script-features/uas/dashboard?db=${dbId}`),
      ]);

      // Handle paginated users response (has .data property) or direct array
      setUsers(usersRes.data?.data || usersRes.data || []);
      // api.get() returns axios response.data, and backend returns arrays directly
      // So if backend returns [...], then groupsRes IS the array (not groupsRes.data)
      setGroups(Array.isArray(groupsRes) ? groupsRes : (groupsRes.data || []));
      setPageAccess(Array.isArray(pageAccessRes) ? pageAccessRes : (pageAccessRes.data || []));
      setPermissions(Array.isArray(permissionsRes) ? permissionsRes : (permissionsRes.data || []));
      const statsData = statsRes.data || statsRes;
      setStats({
        total_users: statsData?.total_users || 0,
        active_users: statsData?.active_users || 0,
        pending_users: statsData?.pending_users || 0,
        suspended_users: statsData?.suspended_users || 0,
        total_groups: statsData?.total_groups || 0,
        locked_pages: statsData?.locked_pages || 0,
        recent_logins: statsData?.recent_logins || 0,
      });
    } catch (err) {
      console.error('Failed to load UAS data:', err);
      setError('Failed to load UAS data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // User CRUD
  const handleCreateUser = async (userData: Partial<UasUser> & { password: string }) => {
    try {
      await api.post(`/v1/script-features/uas/users?db=${databaseId}`, userData);
      loadData();
      setShowUserForm(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (id: number, userData: Partial<UasUser>) => {
    try {
      await api.put(`/v1/script-features/uas/users/${id}?db=${databaseId}`, userData);
      loadData();
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/v1/script-features/uas/users/${id}?db=${databaseId}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Group CRUD
  const handleCreateGroup = async (groupData: Partial<UasGroup>) => {
    try {
      await api.post(`/v1/script-features/uas/groups?db=${databaseId}`, groupData);
      loadData();
      setShowGroupForm(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleUpdateGroup = async (id: number, groupData: Partial<UasGroup>) => {
    try {
      await api.put(`/v1/script-features/uas/groups/${id}?db=${databaseId}`, groupData);
      loadData();
      setEditingGroup(null);
    } catch (error) {
      console.error('Failed to update group:', error);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await api.delete(`/v1/script-features/uas/groups/${id}?db=${databaseId}`);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  // Page Access
  const handleTogglePageLock = async (pageId: string, isLocked: boolean) => {
    try {
      await api.put(`/v1/script-features/uas/page-access/${pageId}?db=${databaseId}`, {
        is_locked: isLocked,
      });
      loadData();
    } catch (error) {
      console.error('Failed to update page access:', error);
    }
  };

  const handleUpdatePageAccess = async (pageId: string, data: Partial<UasPageAccess>) => {
    try {
      await api.put(`/v1/script-features/uas/page-access/${pageId}?db=${databaseId}`, data);
      loadData();
    } catch (error) {
      console.error('Failed to update page access:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1e1e1e] rounded-lg w-[90vw] max-w-6xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">User Access System</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-[#252525] border-b border-gray-700 flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats?.total_users ?? 0}</div>
            <div className="text-xs text-gray-400">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats?.active_users ?? 0}</div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats?.pending_users ?? 0}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats?.suspended_users ?? 0}</div>
            <div className="text-xs text-gray-400">Suspended</div>
          </div>
          <div className="border-l border-gray-600 pl-6 text-center">
            <div className="text-2xl font-bold text-white">{stats?.total_groups ?? 0}</div>
            <div className="text-xs text-gray-400">Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{stats?.locked_pages ?? 0}</div>
            <div className="text-xs text-gray-400">Locked Pages</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'groups', label: 'Groups', icon: Shield },
            { id: 'page-access', label: 'Page Access', icon: Lock },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Unable to Load</h3>
              <p className="text-gray-400 max-w-md">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Users Tab */}
              {activeTab === 'users' && (
                <UsersTab
                  users={filteredUsers}
                  groups={groups}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onCreateUser={() => setShowUserForm(true)}
                  onEditUser={setEditingUser}
                  onDeleteUser={handleDeleteUser}
                  onUpdateUser={handleUpdateUser}
                />
              )}

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <GroupsTab
                  groups={groups}
                  permissions={permissions}
                  onCreateGroup={() => setShowGroupForm(true)}
                  onEditGroup={setEditingGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onUpdateGroup={handleUpdateGroup}
                />
              )}

              {/* Page Access Tab */}
              {activeTab === 'page-access' && (
                <PageAccessTab
                  pageAccess={pageAccess}
                  groups={groups}
                  users={users}
                  onToggleLock={handleTogglePageLock}
                  onUpdateAccess={handleUpdatePageAccess}
                />
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <SettingsTab databaseId={databaseId} />
              )}
            </>
          )}
        </div>

        {/* User Form Modal */}
        {(showUserForm || editingUser) && (
          <UserFormModal
            user={editingUser}
            groups={groups}
            onSave={(data) => {
              if (editingUser) {
                handleUpdateUser(editingUser.id, data);
              } else {
                handleCreateUser(data as any);
              }
            }}
            onClose={() => {
              setShowUserForm(false);
              setEditingUser(null);
            }}
          />
        )}

        {/* Group Form Modal */}
        {(showGroupForm || editingGroup) && (
          <GroupFormModal
            group={editingGroup}
            permissions={permissions}
            onSave={(data) => {
              if (editingGroup) {
                handleUpdateGroup(editingGroup.id, data);
              } else {
                handleCreateGroup(data);
              }
            }}
            onClose={() => {
              setShowGroupForm(false);
              setEditingGroup(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab: React.FC<{
  users: UasUser[];
  groups: UasGroup[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCreateUser: () => void;
  onEditUser: (user: UasUser) => void;
  onDeleteUser: (id: number) => void;
  onUpdateUser: (id: number, data: Partial<UasUser>) => void;
}> = ({ users, groups, searchTerm, onSearchChange, onCreateUser, onEditUser, onDeleteUser, onUpdateUser }) => {
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      suspended: 'bg-red-500/20 text-red-400',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white text-sm w-64"
          />
        </div>
        <button
          onClick={onCreateUser}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Group</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Last Login</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                <td className="px-4 py-3">
                  <div>
                    <div className="text-white font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.group_id}
                    onChange={(e) => onUpdateUser(user.id, { group_id: parseInt(e.target.value) })}
                    className="bg-[#1e1e1e] border border-gray-600 rounded px-2 py-1 text-sm text-white"
                  >
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-sm">
                  {user.last_login_at
                    ? new Date(user.last_login_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEditUser(user)}
                      className="p-1 hover:bg-gray-600 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => onUpdateUser(user.id, {
                        status: user.status === 'suspended' ? 'active' : 'suspended'
                      })}
                      className="p-1 hover:bg-gray-600 rounded"
                      title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                    >
                      {user.status === 'suspended' ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Ban className="w-4 h-4 text-orange-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="p-1 hover:bg-gray-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Groups Tab Component
const GroupsTab: React.FC<{
  groups: UasGroup[];
  permissions: Permission[];
  onCreateGroup: () => void;
  onEditGroup: (group: UasGroup) => void;
  onDeleteGroup: (id: number) => void;
  onUpdateGroup: (id: number, data: Partial<UasGroup>) => void;
}> = ({ groups, permissions, onCreateGroup, onEditGroup, onDeleteGroup, onUpdateGroup }) => {
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">User Groups</h3>
        <button
          onClick={onCreateGroup}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.id} className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700/20"
              onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
            >
              <div className="flex items-center gap-3">
                {expandedGroup === group.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{group.name}</span>
                    {group.is_system && (
                      <span className="text-xs px-2 py-0.5 bg-gray-600 text-gray-300 rounded">
                        System
                      </span>
                    )}
                    {group.is_default && (
                      <span className="text-xs px-2 py-0.5 bg-blue-600 text-blue-100 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Level {group.hierarchy_level} • {group.users_count || 0} users
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditGroup(group);
                  }}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </button>
                {!group.is_system && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteGroup(group.id);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>

            {expandedGroup === group.id && (
              <div className="px-4 py-3 border-t border-gray-700 bg-[#252525]">
                <div className="text-sm text-gray-400 mb-2">
                  {group.description || 'No description'}
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Permissions: </span>
                  {group.permissions && Object.keys(group.permissions).length > 0 ? (
                    <span className="text-white">
                      {Object.entries(group.permissions)
                        .filter(([_, v]) => v)
                        .map(([k]) => k)
                        .join(', ') || 'None'}
                    </span>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Page Access Tab Component
const PageAccessTab: React.FC<{
  pageAccess: UasPageAccess[];
  groups: UasGroup[];
  users: UasUser[];
  onToggleLock: (pageId: string, isLocked: boolean) => void;
  onUpdateAccess: (pageId: string, data: Partial<UasPageAccess>) => void;
}> = ({ pageAccess, groups, users, onToggleLock, onUpdateAccess }) => {
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-2">Page Access Control</h3>
        <p className="text-sm text-gray-400">
          Lock pages to require login. Configure which groups or users can access each page.
        </p>
      </div>

      <div className="space-y-2">
        {pageAccess.map((page) => (
          <div key={page.page_id} className="bg-[#2a2a2a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedPage(expandedPage === page.page_id ? null : page.page_id)}
                  className="p-1 hover:bg-gray-600 rounded"
                >
                  {expandedPage === page.page_id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <span className="text-white">{page.page_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-400">
                    {page.is_locked ? 'Locked' : 'Public'}
                  </span>
                  <div
                    onClick={() => onToggleLock(page.page_id, !page.is_locked)}
                    className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      page.is_locked ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        page.is_locked ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {expandedPage === page.page_id && page.is_locked && (
              <div className="px-4 py-3 border-t border-gray-700 bg-[#252525] space-y-4">
                {/* Allowed Groups */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Allowed Groups</label>
                  <div className="flex flex-wrap gap-2">
                    {groups.filter(g => g.slug !== 'banned').map((group) => (
                      <label
                        key={group.id}
                        className={`flex items-center gap-2 px-3 py-1 rounded cursor-pointer ${
                          page.allowed_groups?.includes(group.id)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={page.allowed_groups?.includes(group.id) || false}
                          onChange={(e) => {
                            const current = page.allowed_groups || [];
                            const updated = e.target.checked
                              ? [...current, group.id]
                              : current.filter(id => id !== group.id);
                            onUpdateAccess(page.page_id, { allowed_groups: updated });
                          }}
                        />
                        {group.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave all unchecked to allow any logged-in user
                  </p>
                </div>

                {/* Redirect Option */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    When Access Denied, Redirect To
                  </label>
                  <select
                    value={page.redirect_to}
                    onChange={(e) => onUpdateAccess(page.page_id, {
                      redirect_to: e.target.value as 'login' | 'home' | 'custom'
                    })}
                    className="bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="login">Login Page</option>
                    <option value="home">Home Page</option>
                    <option value="custom">Custom URL</option>
                  </select>
                  {page.redirect_to === 'custom' && (
                    <input
                      type="text"
                      placeholder="/custom-page"
                      value={page.custom_redirect_url || ''}
                      onChange={(e) => onUpdateAccess(page.page_id, {
                        custom_redirect_url: e.target.value
                      })}
                      className="mt-2 w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC<{ databaseId: string }> = ({ databaseId }) => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get(`/v1/script-features/uas/settings?db=${databaseId}`);
      // Handle both wrapped response and direct object
      const settingsData = res.data || res || {};
      setSettings(typeof settingsData === 'object' ? settingsData : {});
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.put(`/v1/script-features/uas/settings?db=${databaseId}`, { [key]: value });
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-medium text-white mb-4">UAS Settings</h3>

      <div className="space-y-6">
        {/* Registration */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Registration</h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Allow Registration</span>
              <div
                onClick={() => updateSetting('registration_enabled',
                  settings.registration_enabled === 'true' ? 'false' : 'true'
                )}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  settings.registration_enabled === 'true' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.registration_enabled === 'true' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Require Email Verification</span>
              <div
                onClick={() => updateSetting('email_verification_required',
                  settings.email_verification_required === 'true' ? 'false' : 'true'
                )}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  settings.email_verification_required === 'true' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.email_verification_required === 'true' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-gray-300">Require Security Questions</span>
              <div
                onClick={() => updateSetting('security_questions_required',
                  settings.security_questions_required === 'true' ? 'false' : 'true'
                )}
                className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  settings.security_questions_required === 'true' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.security_questions_required === 'true' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Session */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Session</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Session Lifetime (minutes)</label>
              <input
                type="number"
                value={settings.session_lifetime_minutes || '120'}
                onChange={(e) => updateSetting('session_lifetime_minutes', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Remember Me Duration (days)</label>
              <input
                type="number"
                value={settings.remember_me_days || '30'}
                onChange={(e) => updateSetting('remember_me_days', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4">Security</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Max Login Attempts</label>
              <input
                type="number"
                value={settings.max_login_attempts || '5'}
                onChange={(e) => updateSetting('max_login_attempts', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Lockout Duration (minutes)</label>
              <input
                type="number"
                value={settings.lockout_duration_minutes || '15'}
                onChange={(e) => updateSetting('lockout_duration_minutes', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Password Reset Expiry (hours)</label>
              <input
                type="number"
                value={settings.password_reset_expiry_hours || '24'}
                onChange={(e) => updateSetting('password_reset_expiry_hours', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Form Modal
const UserFormModal: React.FC<{
  user: UasUser | null;
  groups: UasGroup[];
  onSave: (data: Partial<UasUser> & { password?: string }) => void;
  onClose: () => void;
}> = ({ user, groups, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    display_name: user?.display_name || '',
    group_id: user?.group_id || groups.find(g => g.is_default)?.id || groups[0]?.id || 0,
    status: user?.status || 'active',
  });

  // Update group_id when groups load if not set
  useEffect(() => {
    if (groups.length > 0 && !formData.group_id) {
      const defaultGroup = groups.find(g => g.is_default) || groups[0];
      setFormData(prev => ({ ...prev, group_id: defaultGroup.id }));
    }
  }, [groups]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-[#1e1e1e] rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-medium text-white mb-4">
          {user ? 'Edit User' : 'Add User'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Display Name (optional)</label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Group</label>
            <select
              value={formData.group_id}
              onChange={(e) => setFormData({ ...formData, group_id: parseInt(e.target.value) })}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
          >
            {user ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Group Form Modal
const GroupFormModal: React.FC<{
  group: UasGroup | null;
  permissions: Permission[];
  onSave: (data: Partial<UasGroup>) => void;
  onClose: () => void;
}> = ({ group, permissions, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    hierarchy_level: group?.hierarchy_level || 50,
    permissions: group?.permissions || {},
    is_default: group?.is_default || false,
  });

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-[#1e1e1e] rounded-lg w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-white mb-4">
          {group ? 'Edit Group' : 'Add Group'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={group?.is_system}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Hierarchy Level (lower = more power)
            </label>
            <input
              type="number"
              value={formData.hierarchy_level}
              onChange={(e) => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })}
              disabled={group?.is_system}
              min={1}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded px-3 py-2 text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Permissions</label>
            <div className="space-y-4 bg-[#2a2a2a] rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h5 className="text-sm font-medium text-gray-300 capitalize mb-2">
                    {category}
                  </h5>
                  <div className="space-y-2 pl-2">
                    {perms.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions[perm.key] || false}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: {
                              ...formData.permissions,
                              [perm.key]: e.target.checked,
                            },
                          })}
                          className="rounded border-gray-600"
                        />
                        <span className="text-sm text-white">{perm.name}</span>
                        {perm.description && (
                          <span className="text-xs text-gray-500">- {perm.description}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="rounded border-gray-600"
            />
            <span className="text-sm text-white">Set as default group for new users</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
          >
            {group ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UasManager;

