<section class="bg-gradient-to-b from-dark to-dark-alt py-6 md:py-24 px-6 relative">
    <div class="max-w-7xl mx-auto">
        <!-- Account Box -->
        <div
            id="account-box"
            class="mx-auto md:absolute md:top-6 md:right-6 bg-white rounded-lg shadow-lg p-4 mb-12 md:mb-0 transition-all duration-300 ease-in-out w-48"
        >
            <div class="flex flex-col items-center space-y-3">
                <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>

                <!-- Logged Out State (Initial) -->
                <div id="logged-out-initial">
                    <button
                        id="show-login-btn"
                        class="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition"
                    >
                        Login
                    </button>
                    <a
                        href="/login"
                        class="w-full border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-md text-sm font-medium transition text-center block mt-3"
                    >
                        Sign Up
                    </a>
                </div>

                <!-- Login Form (Hidden initially) -->
                <form id="login-form" class="w-full space-y-3 hidden">
                    <p id="login-error" class="text-red-600 text-xs text-center hidden"></p>
                    <input
                        type="email"
                        id="login-email"
                        placeholder="Email"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                        type="password"
                        id="login-password"
                        placeholder="Password"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        id="login-submit-btn"
                        class="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition disabled:opacity-50"
                    >
                        Sign In
                    </button>
                    <div class="flex justify-between items-center text-xs">
                        <button type="button" class="text-primary hover:text-primary-dark transition">
                            Forgot?
                        </button>
                        <button
                            type="button"
                            id="cancel-login-btn"
                            class="text-gray-600 hover:text-gray-900 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <!-- Logged In State (Hidden initially) -->
                <div id="logged-in-state" class="w-full space-y-3 hidden">
                    <p id="user-name" class="text-sm font-medium text-dark"></p>
                    <button
                        id="dashboard-btn"
                        class="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition"
                    >
                        Dashboard
                    </button>
                    <button
                        id="logout-btn"
                        class="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>

        <!-- Hero Content -->
        <div class="text-center">
            <img
                src="/Pagevoo_logo_500x500.png"
                alt="Pagevoo"
                class="mx-auto mb-6 w-[60px] h-[60px]"
            />
            <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
                Your complete business solution, ready to launch
            </p>
            <p class="text-lg text-gray-400 max-w-2xl mx-auto">
                Industry-specific websites with booking, ordering, CMS, and everything your business needs — ready to go.
            </p>
        </div>
    </div>
</section>

<script>
// Hero Account Box JavaScript
(function() {
    const API_URL = 'http://localhost:8000/api/v1';
    const accountBox = document.getElementById('account-box');
    const loggedOutInitial = document.getElementById('logged-out-initial');
    const loginForm = document.getElementById('login-form');
    const loggedInState = document.getElementById('logged-in-state');
    const showLoginBtn = document.getElementById('show-login-btn');
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    const loginError = document.getElementById('login-error');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userName = document.getElementById('user-name');

    // Check if user is logged in on page load
    checkAuthStatus();

    // Show login form
    showLoginBtn.addEventListener('click', function() {
        loggedOutInitial.classList.add('hidden');
        loginForm.classList.remove('hidden');
        accountBox.classList.remove('w-48');
        accountBox.classList.add('w-full', 'md:w-80');
    });

    // Cancel login
    cancelLoginBtn.addEventListener('click', function() {
        loginForm.classList.add('hidden');
        loggedOutInitial.classList.remove('hidden');
        loginError.classList.add('hidden');
        accountBox.classList.remove('w-full', 'md:w-80');
        accountBox.classList.add('w-48');
        loginForm.reset();
    });

    // Handle login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        loginError.classList.add('hidden');
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Signing In...';

        try {
            console.log('Attempting login to:', `${API_URL}/login`);
            console.log('Credentials:', { email, password: '***' });

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success && data.data) {
                localStorage.setItem('auth_token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                // Redirect to dashboard
                window.location.href = data.data.user.role === 'admin' ? '/dashboard' : '/my-dashboard';
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Invalid credentials';
            loginError.classList.remove('hidden');
        } finally {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = 'Sign In';
        }
    });

    // Dashboard button
    dashboardBtn.addEventListener('click', function() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        window.location.href = user.role === 'admin' ? '/dashboard' : '/my-dashboard';
    });

    // Logout
    logoutBtn.addEventListener('click', async function() {
        const token = localStorage.getItem('auth_token');
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        showLoggedOutState();
    });

    // Check auth status
    async function checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            showLoggedOutState();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // If unauthorized or error, clear token and show logged out
            if (!response.ok) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                showLoggedOutState();
                return;
            }

            const data = await response.json();
            if (data.success && data.data) {
                localStorage.setItem('user', JSON.stringify(data.data));
                showLoggedInState(data.data);
            } else {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                showLoggedOutState();
            }
        } catch (error) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            showLoggedOutState();
        }
    }

    // Show logged in state
    function showLoggedInState(user) {
        loggedOutInitial.classList.add('hidden');
        loginForm.classList.add('hidden');
        loggedInState.classList.remove('hidden');
        userName.textContent = user.name;
        accountBox.classList.remove('w-full', 'md:w-80');
        accountBox.classList.add('w-48');
    }

    // Show logged out state
    function showLoggedOutState() {
        loggedOutInitial.classList.remove('hidden');
        loginForm.classList.add('hidden');
        loggedInState.classList.add('hidden');
        accountBox.classList.remove('w-full', 'md:w-80');
        accountBox.classList.add('w-48');
        loginForm.reset();
    }
})();
</script>
