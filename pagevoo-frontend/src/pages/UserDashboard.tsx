import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/services/api'

interface Collaborator {
  id: number
  name: string
  email: string
  phone_number?: string
  groups?: Group[]
}

interface Group {
  id: number
  name: string
  description?: string
  permissions?: any
  users?: Collaborator[]
}

interface Note {
  id: number
  user_id: number
  title: string
  content?: string
  created_at: string
  updated_at: string
  user?: any
  shared_with_users?: Collaborator[]
  shared_with_groups?: Group[]
}

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')

  // Collaborator state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isAddCollaboratorOpen, setIsAddCollaboratorOpen] = useState(false)
  const [isEditCollaboratorOpen, setIsEditCollaboratorOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  const [collaboratorFormData, setCollaboratorFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: ''
  })

  // Group state
  const [groups, setGroups] = useState<Group[]>([])
  const [activeTab, setActiveTab] = useState<'collaborators' | 'groups'>('collaborators')
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    permissions: {
      can_edit_content: false,
      can_manage_pages: false,
      can_view_analytics: false,
      can_manage_media: false,
      can_view_journal: false,
      can_edit_journal: false
    }
  })
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Note/Journal state
  const [notes, setNotes] = useState<Note[]>([])
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteFormData, setNoteFormData] = useState({
    title: '',
    content: '',
    share_with_users: [] as number[],
    share_with_groups: [] as number[]
  })
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  const isProUser = user?.package === 'pro' && (user?.account_status === 'active' || user?.account_status === 'trial')
  const hasJournalAccess = user?.package === 'niche' || user?.package === 'pro'

  // Load collaborators
  useEffect(() => {
    if (isProUser && activeSection === 'collaborators') {
      loadCollaborators()
      loadGroups()
    }
  }, [activeSection, isProUser])

  // Load notes
  useEffect(() => {
    if (hasJournalAccess && activeSection === 'journal') {
      loadNotes()
      if (isProUser) {
        loadCollaborators()
        loadGroups()
      }
    }
  }, [activeSection, hasJournalAccess, isProUser])

  const loadCollaborators = async () => {
    try {
      const response = await api.getAllCollaborators()
      if (response.success && response.data) {
        setCollaborators(response.data)
      }
    } catch (error) {
      console.error('Error loading collaborators:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await api.getAllGroups()
      if (response.success && response.data) {
        setGroups(response.data)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const resetCollaboratorForm = () => {
    setCollaboratorFormData({
      name: '',
      email: '',
      password: '',
      phone_number: ''
    })
  }

  const resetGroupForm = () => {
    setGroupFormData({
      name: '',
      description: '',
      permissions: {
        can_edit_content: false,
        can_manage_pages: false,
        can_view_analytics: false,
        can_manage_media: false,
        can_view_journal: false,
        can_edit_journal: false
      }
    })
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await api.createCollaborator(collaboratorFormData)
      if (response.success) {
        await loadCollaborators()
        setIsAddCollaboratorOpen(false)
        resetCollaboratorForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create collaborator')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollaborator) return

    try {
      setIsLoading(true)
      const updateData: any = {
        name: collaboratorFormData.name,
        email: collaboratorFormData.email,
        phone_number: collaboratorFormData.phone_number
      }
      if (collaboratorFormData.password) {
        updateData.password = collaboratorFormData.password
      }

      const response = await api.updateCollaborator(editingCollaborator.id, updateData)
      if (response.success) {
        await loadCollaborators()
        setIsEditCollaboratorOpen(false)
        setEditingCollaborator(null)
        resetCollaboratorForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update collaborator')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCollaborator = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this collaborator?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await api.deleteCollaborator(id)
      if (response.success) {
        await loadCollaborators()
        await loadGroups() // Reload groups to update member counts
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete collaborator')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditCollaborator = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setCollaboratorFormData({
      name: collaborator.name,
      email: collaborator.email,
      password: '',
      phone_number: collaborator.phone_number || ''
    })
    setIsEditCollaboratorOpen(true)
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await api.createGroup(groupFormData)
      if (response.success) {
        await loadGroups()
        setIsAddGroupOpen(false)
        resetGroupForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return

    try {
      setIsLoading(true)
      const response = await api.updateGroup(editingGroup.id, groupFormData)
      if (response.success) {
        await loadGroups()
        setIsEditGroupOpen(false)
        setEditingGroup(null)
        resetGroupForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await api.deleteGroup(id)
      if (response.success) {
        await loadGroups()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete group')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditGroup = (group: Group) => {
    setEditingGroup(group)
    setGroupFormData({
      name: group.name,
      description: group.description || '',
      permissions: group.permissions || {
        can_edit_content: false,
        can_manage_pages: false,
        can_view_analytics: false,
        can_manage_media: false,
        can_view_journal: false,
        can_edit_journal: false
      }
    })
    setIsEditGroupOpen(true)
  }

  const handleToggleGroupMember = async (groupId: number, userId: number, isCurrentlyMember: boolean) => {
    try {
      setIsLoading(true)
      if (isCurrentlyMember) {
        await api.removeUsersFromGroup(groupId, [userId])
      } else {
        await api.addUsersToGroup(groupId, [userId])
      }
      const response = await api.getAllGroups()
      if (response.success && response.data) {
        setGroups(response.data)
        // Update selectedGroupForMembers with the fresh data
        const updatedGroup = response.data.find((g: Group) => g.id === groupId)
        if (updatedGroup) {
          setSelectedGroupForMembers(updatedGroup)
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update group membership')
    } finally {
      setIsLoading(false)
    }
  }

  // Note/Journal functions
  const loadNotes = async () => {
    try {
      const response = await api.getAllNotes()
      if (response.success && response.data) {
        setNotes(response.data)
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  const resetNoteForm = () => {
    setNoteFormData({
      title: '',
      content: '',
      share_with_users: [],
      share_with_groups: []
    })
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await api.createNote(noteFormData)
      if (response.success) {
        await loadNotes()
        setIsAddNoteOpen(false)
        resetNoteForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create note')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return

    try {
      setIsLoading(true)
      const response = await api.updateNote(editingNote.id, noteFormData)
      if (response.success) {
        await loadNotes()
        setIsEditNoteOpen(false)
        setEditingNote(null)
        resetNoteForm()
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update note')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await api.deleteNote(id)
      if (response.success) {
        await loadNotes()
        setSelectedNote(null)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete note')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditNote = (note: Note) => {
    setEditingNote(note)
    setNoteFormData({
      title: note.title,
      content: note.content || '',
      share_with_users: note.shared_with_users?.map(u => u.id) || [],
      share_with_groups: note.shared_with_groups?.map(g => g.id) || []
    })
    setIsEditNoteOpen(true)
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
            <h1 className="text-xl font-semibold text-[#4b4b4b]">My Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[#4b4b4b]">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.business_name}</p>
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
              onClick={() => setActiveSection('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'overview'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('account-settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeSection === 'account-settings'
                  ? 'bg-gray-100 text-[#4b4b4b]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Account Settings
            </button>
            {isProUser && (
              <button
                onClick={() => setActiveSection('collaborators')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeSection === 'collaborators'
                    ? 'bg-gray-100 text-[#4b4b4b]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Collaborators
              </button>
            )}
            {hasJournalAccess && (
              <button
                onClick={() => setActiveSection('journal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  activeSection === 'journal'
                    ? 'bg-gray-100 text-[#4b4b4b]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Journal
              </button>
            )}
            <a
              href="/website-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto px-6 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition inline-block"
            >
              Website Builder
            </a>
          </div>
        </nav>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-[#4b4b4b] mb-6">Welcome back, {user?.name}!</h2>

              {/* Business Info Card */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#4b4b4b] mb-4">Business Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Business Name</p>
                      <p className="text-sm font-medium text-gray-900">{user?.business_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Business Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{user?.business_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#4b4b4b] mb-4">Account Status</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          user?.account_status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : user?.account_status === 'trial'
                            ? 'bg-yellow-100 text-yellow-700'
                            : user?.account_status === 'suspended'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user?.account_status}
                      </span>
                    </div>
                    {user?.package && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Package</p>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 capitalize">
                          {user.package}
                        </span>
                      </div>
                    )}
                    {user?.account_status === 'trial' && !user?.package && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Features limited!</p>
                        <p className="text-sm text-red-600 mb-3">Upgrade your trial account to unlock the full features of Pagevoo.</p>
                        <Link
                          to="/pricing"
                          className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
                        >
                          Upgrade Now
                        </Link>
                      </div>
                    )}
                    {user?.account_status === 'inactive' && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-3">Activate your account to start building your website</p>
                        <Link
                          to="/pricing"
                          className="inline-block px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
                        >
                          View Packages
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-[#4b4b4b] mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <a
                    href="/website-builder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 border border-gray-200 rounded-lg hover:border-[#98b290] hover:shadow-md transition text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <svg className="w-12 h-12 text-[#98b290]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#4b4b4b] mb-1">Build Website</h4>
                    <p className="text-xs text-gray-600">Create and edit your website</p>
                  </a>
                  <button
                    onClick={() => setActiveSection('account-settings')}
                    className="block p-6 border border-gray-200 rounded-lg hover:border-[#98b290] hover:shadow-md transition text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <svg className="w-12 h-12 text-[#98b290]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#4b4b4b] mb-1">Account Settings</h4>
                    <p className="text-xs text-gray-600">Manage your account</p>
                  </button>
                  <Link
                    to="/support"
                    className="block p-6 border border-gray-200 rounded-lg hover:border-[#98b290] hover:shadow-md transition text-center"
                  >
                    <div className="flex justify-center mb-3">
                      <svg className="w-12 h-12 text-[#98b290]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-[#4b4b4b] mb-1">Support</h4>
                    <p className="text-xs text-gray-600">Get help and support</p>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account-settings' && (
            <div>
              <h2 className="text-2xl font-bold text-[#4b4b4b] mb-6">Account Settings</h2>
              <div className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      defaultValue={user?.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      defaultValue={user?.business_name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                    <select
                      defaultValue={user?.business_type}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="barbershop">Barbershop</option>
                      <option value="pizza">Pizza Shop</option>
                      <option value="cafe">Cafe</option>
                      <option value="gym">Gym</option>
                      <option value="salon">Salon</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="pt-4">
                    <button className="px-6 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md font-medium transition">
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-[#4b4b4b] mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                      />
                    </div>
                    <div className="pt-2">
                      <button className="px-6 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md font-medium transition">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'collaborators' && isProUser && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4b4b4b]">Collaborator Management</h2>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('collaborators')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === 'collaborators'
                        ? 'border-[#98b290] text-[#98b290]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Collaborators
                  </button>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === 'groups'
                        ? 'border-[#98b290] text-[#98b290]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Groups
                  </button>
                </div>
              </div>

              {/* Collaborators Tab */}
              {activeTab === 'collaborators' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-600">Manage team members who can help manage your website</p>
                    <button
                      onClick={() => {
                        resetCollaboratorForm()
                        setIsAddCollaboratorOpen(true)
                      }}
                      className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
                    >
                      Add Collaborator
                    </button>
                  </div>

                  {/* Collaborators List */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Groups</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collaborators.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              No collaborators yet. Add your first team member!
                            </td>
                          </tr>
                        ) : (
                          collaborators.map((collab) => (
                            <tr key={collab.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="px-4 py-3 text-sm text-gray-900">{collab.name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{collab.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{collab.phone_number || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                {collab.groups && collab.groups.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {collab.groups.map((group) => (
                                      <span key={group.id} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                        {group.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No groups</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-right space-x-2">
                                <button
                                  onClick={() => openEditCollaborator(collab)}
                                  className="text-[#98b290] hover:text-[#88a280] font-medium transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteCollaborator(collab.id)}
                                  className="text-red-600 hover:text-red-700 font-medium transition"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-gray-600">Organize collaborators into groups with specific permissions</p>
                    <button
                      onClick={() => {
                        resetGroupForm()
                        setIsAddGroupOpen(true)
                      }}
                      className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
                    >
                      Create Group
                    </button>
                  </div>

                  {/* Groups List */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {groups.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        No groups yet. Create your first group to organize collaborators!
                      </div>
                    ) : (
                      groups.map((group) => (
                        <div key={group.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-[#4b4b4b] text-lg">{group.name}</h3>
                              {group.description && (
                                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openEditGroup(group)}
                                className="text-[#98b290] hover:text-[#88a280] text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Permissions */}
                          {group.permissions && (
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Permissions</p>
                              <div className="flex flex-wrap gap-2">
                                {group.permissions.can_edit_content && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Edit Content</span>
                                )}
                                {group.permissions.can_manage_pages && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Manage Pages</span>
                                )}
                                {group.permissions.can_view_analytics && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">View Analytics</span>
                                )}
                                {group.permissions.can_manage_media && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Manage Media</span>
                                )}
                                {group.permissions.can_view_journal && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">View Journal</span>
                                )}
                                {group.permissions.can_edit_journal && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Edit Journal</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Members */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Members ({group.users?.length || 0})</p>
                            <button
                              onClick={() => setSelectedGroupForMembers(group)}
                              className="text-sm text-[#98b290] hover:text-[#88a280] font-medium"
                            >
                              Manage Members
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Journal Section */}
          {activeSection === 'journal' && hasJournalAccess && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#4b4b4b]">Journal</h2>
                <button
                  onClick={() => {
                    resetNoteForm()
                    setIsAddNoteOpen(true)
                  }}
                  className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md text-sm font-medium transition"
                >
                  Add Note
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Notes List */}
                <div className="md:col-span-1 space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No notes yet. Create your first note!
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNote(note)}
                        className={`p-4 border rounded-lg cursor-pointer transition ${
                          selectedNote?.id === note.id
                            ? 'border-[#98b290] bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{note.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString()}
                        </p>
                        {note.user_id !== user?.id && note.user && (
                          <p className="text-xs text-indigo-600 mt-1">Shared by {note.user.name}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Note Detail View */}
                <div className="md:col-span-2">
                  {selectedNote ? (
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-[#4b4b4b] mb-2">{selectedNote.title}</h2>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(selectedNote.created_at).toLocaleString()}
                          </p>
                          {selectedNote.user_id !== user?.id && selectedNote.user && (
                            <p className="text-sm text-indigo-600 mt-1">Shared by {selectedNote.user.name}</p>
                          )}
                        </div>
                        {selectedNote.user_id === user?.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditNote(selectedNote)}
                              className="text-[#98b290] hover:text-[#88a280] font-medium transition text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(selectedNote.id)}
                              className="text-red-600 hover:text-red-700 font-medium transition text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedNote.content || 'No content'}</p>
                      </div>
                      {isProUser && selectedNote.user_id === user?.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">Shared With:</h3>
                          <div className="space-y-2">
                            {selectedNote.shared_with_users && selectedNote.shared_with_users.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Collaborators:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedNote.shared_with_users.map(u => (
                                    <span key={u.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                      {u.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedNote.shared_with_groups && selectedNote.shared_with_groups.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Groups:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedNote.shared_with_groups.map(g => (
                                    <span key={g.id} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                      {g.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(!selectedNote.shared_with_users || selectedNote.shared_with_users.length === 0) &&
                             (!selectedNote.shared_with_groups || selectedNote.shared_with_groups.length === 0) && (
                              <p className="text-sm text-gray-500">This note is private</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-12 text-center text-gray-500">
                      Select a note to view its contents
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Collaborator Modal */}
      {isAddCollaboratorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">Add Collaborator</h3>
            </div>
            <form onSubmit={handleAddCollaborator} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={collaboratorFormData.name}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={collaboratorFormData.email}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={collaboratorFormData.password}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={collaboratorFormData.phone_number}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCollaboratorOpen(false)
                    resetCollaboratorForm()
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
                  {isLoading ? 'Adding...' : 'Add Collaborator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collaborator Modal */}
      {isEditCollaboratorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">Edit Collaborator</h3>
            </div>
            <form onSubmit={handleEditCollaborator} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={collaboratorFormData.name}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={collaboratorFormData.email}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={collaboratorFormData.password}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={collaboratorFormData.phone_number}
                    onChange={(e) => setCollaboratorFormData({ ...collaboratorFormData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCollaboratorOpen(false)
                    setEditingCollaborator(null)
                    resetCollaboratorForm()
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
                  {isLoading ? 'Updating...' : 'Update Collaborator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Group Modal */}
      {(isAddGroupOpen || isEditGroupOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">{isAddGroupOpen ? 'Create Group' : 'Edit Group'}</h3>
            </div>
            <form onSubmit={isAddGroupOpen ? handleAddGroup : handleEditGroup} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                  <input
                    type="text"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={groupFormData.description}
                    onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groupFormData.permissions.can_edit_content}
                        onChange={(e) => setGroupFormData({
                          ...groupFormData,
                          permissions: { ...groupFormData.permissions, can_edit_content: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can edit content</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groupFormData.permissions.can_manage_pages}
                        onChange={(e) => setGroupFormData({
                          ...groupFormData,
                          permissions: { ...groupFormData.permissions, can_manage_pages: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can manage pages</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groupFormData.permissions.can_view_analytics}
                        onChange={(e) => setGroupFormData({
                          ...groupFormData,
                          permissions: { ...groupFormData.permissions, can_view_analytics: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can view analytics</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groupFormData.permissions.can_manage_media}
                        onChange={(e) => setGroupFormData({
                          ...groupFormData,
                          permissions: { ...groupFormData.permissions, can_manage_media: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can manage media</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groupFormData.permissions.can_view_journal}
                        onChange={(e) => setGroupFormData({
                          ...groupFormData,
                          permissions: { ...groupFormData.permissions, can_view_journal: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can view journal</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={groupFormData.permissions.can_edit_journal}
                        onChange={(e) => setGroupFormData({
                          ...groupFormData,
                          permissions: { ...groupFormData.permissions, can_edit_journal: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Can edit journal</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddGroupOpen(false)
                    setIsEditGroupOpen(false)
                    setEditingGroup(null)
                    resetGroupForm()
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
                  {isLoading ? (isAddGroupOpen ? 'Creating...' : 'Updating...') : (isAddGroupOpen ? 'Create Group' : 'Update Group')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Members Modal */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">Manage Members - {selectedGroupForMembers.name}</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Select collaborators to add to this group</p>
              <div className="space-y-2">
                {collaborators.map((collab) => {
                  const isMember = selectedGroupForMembers.users?.some(u => u.id === collab.id) || false
                  return (
                    <label key={collab.id} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMember}
                        onChange={() => handleToggleGroupMember(selectedGroupForMembers.id, collab.id, isMember)}
                        className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{collab.name}</p>
                        <p className="text-xs text-gray-500">{collab.email}</p>
                      </div>
                    </label>
                  )
                })}
                {collaborators.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No collaborators available. Add collaborators first!</p>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedGroupForMembers(null)}
                  className="px-4 py-2 bg-[#98b290] hover:bg-[#88a280] text-white rounded-md transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {(isAddNoteOpen || isEditNoteOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-[#4b4b4b]">
                {isEditNoteOpen ? 'Edit Note' : 'Add Note'}
              </h3>
            </div>
            <form onSubmit={isEditNoteOpen ? handleEditNote : handleAddNote} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={noteFormData.title}
                    onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={noteFormData.content}
                    onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                  />
                </div>

                {isProUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Share with Collaborators</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                        {collaborators.length === 0 ? (
                          <p className="text-sm text-gray-500">No collaborators available</p>
                        ) : (
                          collaborators.map((collab) => (
                            <label key={collab.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={noteFormData.share_with_users.includes(collab.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNoteFormData({
                                      ...noteFormData,
                                      share_with_users: [...noteFormData.share_with_users, collab.id]
                                    })
                                  } else {
                                    setNoteFormData({
                                      ...noteFormData,
                                      share_with_users: noteFormData.share_with_users.filter(id => id !== collab.id)
                                    })
                                  }
                                }}
                                className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                              />
                              <span className="ml-2 text-sm text-gray-700">{collab.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Share with Groups</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                        {groups.length === 0 ? (
                          <p className="text-sm text-gray-500">No groups available</p>
                        ) : (
                          groups.map((group) => (
                            <label key={group.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={noteFormData.share_with_groups.includes(group.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNoteFormData({
                                      ...noteFormData,
                                      share_with_groups: [...noteFormData.share_with_groups, group.id]
                                    })
                                  } else {
                                    setNoteFormData({
                                      ...noteFormData,
                                      share_with_groups: noteFormData.share_with_groups.filter(id => id !== group.id)
                                    })
                                  }
                                }}
                                className="rounded border-gray-300 text-[#98b290] focus:ring-[#98b290]"
                              />
                              <span className="ml-2 text-sm text-gray-700">{group.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddNoteOpen(false)
                    setIsEditNoteOpen(false)
                    setEditingNote(null)
                    resetNoteForm()
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
                  {isLoading ? 'Saving...' : isEditNoteOpen ? 'Update Note' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
