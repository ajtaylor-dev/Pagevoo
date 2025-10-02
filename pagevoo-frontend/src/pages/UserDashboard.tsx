import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')

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
        </div>
      </div>
    </div>
  )
}
