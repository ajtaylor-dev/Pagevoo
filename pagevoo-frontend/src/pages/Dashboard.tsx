import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/services/api'

interface User {
  id: number
  name: string
  email: string
  business_name: string
  business_type: string
  role: string
  account_status: string
  package?: string
  owner_id?: number
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('user-management')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    business_name: '',
    business_type: '',
    phone_number: '',
    role: 'user',
    account_status: 'trial',
    package: '',
    owner_id: ''
  })
  const [potentialOwners, setPotentialOwners] = useState<User[]>([])

  // Fetch users from API
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await api.getAllUsers()
      if (response.success && response.data) {
        setUsers(response.data)
        // filteredUsers will be updated by the useEffect below
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.business_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  // Update potential owners when users change
  useEffect(() => {
    const owners = users.filter(u =>
      u.role === 'user' && (u.account_status === 'active' || u.account_status === 'trial')
    )
    setPotentialOwners(owners)
  }, [users])

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      business_name: '',
      business_type: '',
      phone_number: '',
      role: 'user',
      account_status: 'trial',
      package: '',
      owner_id: ''
    })
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await api.deleteUser(userId)
      if (response.success) {
        await loadUsers()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteInactiveUsers = async () => {
    if (!window.confirm('This will delete all trial users who haven\'t logged in for 30 days. Are you sure?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await api.deleteInactiveUsers()
      if (response.success && response.data) {
        const count = response.data.deleted_count
        alert(`Successfully deleted ${count} inactive user(s)`)
        await loadUsers()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete inactive users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = (userId: number) => {
    const userToEdit = users.find(u => u.id === userId)
    if (userToEdit) {
      setEditingUser(userToEdit)
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        password: '',
        business_name: userToEdit.business_name,
        business_type: userToEdit.business_type,
        phone_number: '',
        role: userToEdit.role,
        account_status: userToEdit.account_status,
        package: userToEdit.package || '',
        owner_id: userToEdit.owner_id?.toString() || ''
      })
      setIsEditModalOpen(true)
    }
  }

  const handleAddUser = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      const response = await api.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        business_name: formData.business_name,
        business_type: formData.business_type,
        phone_number: formData.phone_number,
        role: formData.role,
        account_status: formData.account_status,
        package: formData.package || undefined,
        owner_id: formData.owner_id ? parseInt(formData.owner_id) : undefined
      })

      if (response.success) {
        await loadUsers()
        setIsAddModalOpen(false)
        resetForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingUser) return

    try {
      setIsLoading(true)
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        business_name: formData.business_name,
        business_type: formData.business_type,
        phone_number: formData.phone_number,
        role: formData.role,
        account_status: formData.account_status,
        package: formData.package || null,
        owner_id: formData.owner_id ? parseInt(formData.owner_id) : null
      }

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await api.updateUser(editingUser.id, updateData)

      if (response.success) {
        await loadUsers()
        setIsEditModalOpen(false)
        setEditingUser(null)
        resetForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <img src="/Pagevoo_logo_500x200.png" alt="Pagevoo" className="h-10 cursor-pointer hover:opacity-80 transition" />
            </Link>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-[#4b4b4b]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#4b4b4b]">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation */}
        <nav className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setActiveSection('user-management')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'user-management'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveSection('website-manager')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'website-manager'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Website Manager
            </button>
            <button
              onClick={() => setActiveSection('website-settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'website-settings'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Website Settings
            </button>
            <button
              onClick={() => setActiveSection('promos-advertising')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'promos-advertising'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Promos and Advertising
            </button>
            <button
              onClick={() => setActiveSection('package-settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'package-settings'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Package Settings
            </button>
            <a
              href="/template-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-6 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition inline-block"
            >
              Template Manager
            </a>
          </div>
        </nav>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeSection === 'website-manager' && (
            <div>
              <h2 className="text-2xl font-bold text-[#4b4b4b] mb-6">Website Manager</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Websites List - Only show users (not admins or collaborators) */}
                {users.map((u) => {
                  if (u.role !== 'user') return null

                  // Count collaborators for this user
                  const collaboratorCount = users.filter(collab =>
                    collab.role === 'collaborator' && collab.owner_id === u.id
                  ).length

                  return (
                    <div key={u.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{u.business_name}</h3>
                          <p className="text-sm text-gray-500">{u.name}</p>
                          {collaboratorCount > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              + {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        {u.package && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                            {u.package}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize mb-4">{u.business_type}</p>
                      <a
                        href="/website-builder"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
                      >
                        Open Builder
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeSection === 'user-management' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4b4b4b]">User Management</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDeleteInactiveUsers}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition"
                  >
                    Delete Inactive Users
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
                  >
                    + Add User
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by name, email, or business..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Business</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Package</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.business_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 capitalize">{u.business_type}</td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : u.role === 'collaborator'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                u.account_status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : u.account_status === 'trial'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : u.account_status === 'suspended'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {u.account_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {u.package ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                                {u.package}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right space-x-2">
                            {u.role === 'admin' ? (
                              <span className="text-gray-400 font-medium">Locked</span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditUser(u.id)}
                                  className="text-[#98b290] hover:text-[#88a280] font-medium transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-red-600 hover:text-red-700 font-medium transition"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'website-settings' && (
            <div>
              <h2 className="text-2xl font-bold text-[#4b4b4b] mb-4">Website Settings</h2>
              <p className="text-gray-600">Configure website settings here...</p>
            </div>
          )}

          {activeSection === 'promos-advertising' && (
            <div>
              <h2 className="text-2xl font-bold text-[#4b4b4b] mb-4">Promos and Advertising</h2>
              <p className="text-gray-600">Manage promotions and advertising here...</p>
            </div>
          )}

          {activeSection === 'package-settings' && (
            <div>
              <h2 className="text-2xl font-bold text-[#4b4b4b] mb-4">Package Settings</h2>
              <p className="text-gray-600">Configure package settings here...</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">Add New User</h3>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="">Select type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="barbershop">Barbershop</option>
                    <option value="pizza">Pizza Shop</option>
                    <option value="cafe">Cafe</option>
                    <option value="gym">Gym</option>
                    <option value="salon">Salon</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="collaborator">Collaborator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status *</label>
                  <select
                    name="account_status"
                    value={formData.account_status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Package</label>
                <select
                  name="package"
                  value={formData.package}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                >
                  <option value="">None</option>
                  <option value="brochure">Brochure - £19/mo</option>
                  <option value="niche">Niche - £39/mo</option>
                  <option value="pro">Pro - £59/mo</option>
                </select>
              </div>
              {formData.role === 'collaborator' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <select
                    name="owner_id"
                    value={formData.owner_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="">Select owner</option>
                    {potentialOwners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.business_name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only users with active or trial subscriptions can manage collaborators
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md transition disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">Edit User</h3>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="">Select type</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="barbershop">Barbershop</option>
                    <option value="pizza">Pizza Shop</option>
                    <option value="cafe">Cafe</option>
                    <option value="gym">Gym</option>
                    <option value="salon">Salon</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="collaborator">Collaborator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status *</label>
                  <select
                    name="account_status"
                    value={formData.account_status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Package (Upgrade/Downgrade)</label>
                <select
                  name="package"
                  value={formData.package}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                >
                  <option value="">None</option>
                  <option value="brochure">Brochure - £19/mo</option>
                  <option value="niche">Niche - £39/mo</option>
                  <option value="pro">Pro - £59/mo</option>
                </select>
              </div>
              {formData.role === 'collaborator' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <select
                    name="owner_id"
                    value={formData.owner_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  >
                    <option value="">Select owner</option>
                    {potentialOwners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.business_name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only users with active or trial subscriptions can manage collaborators
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md transition disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
