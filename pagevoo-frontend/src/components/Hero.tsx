import { useState } from 'react'

export default function Hero() {
  const [isLoginExpanded, setIsLoginExpanded] = useState(false)

  return (
    <section className="bg-gradient-to-b from-[#4b4b4b] to-[#3a3a3a] py-6 md:py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Account Box - Positioned at top on mobile, top-right on desktop */}
        <div
          id="account-box"
          className={`mx-auto md:absolute md:top-6 md:right-6 bg-white rounded-lg shadow-lg p-4 mb-12 md:mb-0 transition-all duration-300 ease-in-out ${
            isLoginExpanded
              ? 'w-full md:w-80'
              : 'w-48'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-[#98b290] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* Login Form - Shows when expanded */}
            {isLoginExpanded && (
              <div className="w-full space-y-3 animate-in fade-in duration-300">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#98b290]"
                />
                <button className="w-full bg-[#98b290] hover:bg-[#88a280] text-white px-4 py-2 rounded-md text-sm font-medium transition">
                  Sign In
                </button>
                <div className="flex justify-between items-center text-xs">
                  <button className="text-[#98b290] hover:text-[#88a280] transition">
                    Forgot?
                  </button>
                  <button
                    onClick={() => setIsLoginExpanded(false)}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Initial Buttons - Shows when not expanded */}
            {!isLoginExpanded && (
              <>
                <button
                  onClick={() => setIsLoginExpanded(true)}
                  className="w-full bg-[#98b290] hover:bg-[#88a280] text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </button>
                <button className="w-full border border-[#98b290] text-[#98b290] hover:bg-[#98b290] hover:text-white px-4 py-2 rounded-md text-sm font-medium transition">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero Content */}
        <div className="text-center">
          <img
            src="/Pagevoo_logo_wide.png"
            alt="Pagevoo"
            className="mx-auto mb-6 max-w-md md:max-w-2xl w-full"
          />
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Beautiful websites and content management is our forte.
          </p>
        </div>
      </div>
    </section>
  )
}
