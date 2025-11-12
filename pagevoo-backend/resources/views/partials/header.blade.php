<header class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-6 py-4 z-50">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo -->
        <a href="/" class="flex items-center">
            <img src="/Pagevoo_logo_500x500.png" alt="Pagevoo" class="w-[60px] h-[60px]">
        </a>

        <!-- Navigation Links and User Menu -->
        <div class="flex items-center space-x-8">
            <nav class="hidden md:flex items-center space-x-8">
                <a href="/solutions" class="text-gray-600 hover:text-gray-900 transition">Solutions</a>
                <a href="/whats-included" class="text-gray-600 hover:text-gray-900 transition">What's Included</a>
                <a href="/pricing" class="text-gray-600 hover:text-gray-900 transition">Pricing</a>
                <a href="/support" class="text-gray-600 hover:text-gray-900 transition">Support</a>
            </nav>

            <!-- User Menu -->
            <div class="flex items-center space-x-4">
                <!-- User Icon - Shows when scrolled past account box -->
                <button
                    id="scroll-to-account"
                    class="w-9 h-9 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition hidden"
                    onclick="window.scrollTo({ top: 0, behavior: 'smooth' })"
                >
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </button>

                <!-- Mobile Menu Icon -->
                <button
                    id="mobile-menu-btn"
                    class="md:hidden w-9 h-9 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition"
                >
                    <svg id="menu-icon" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg id="close-icon" class="w-5 h-5 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div id="mobile-menu" class="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg hidden">
        <nav class="flex flex-col py-4 px-6 space-y-4">
            <a href="/solutions" class="text-gray-600 hover:text-gray-900 transition">Solutions</a>
            <a href="/whats-included" class="text-gray-600 hover:text-gray-900 transition">What's Included</a>
            <a href="/pricing" class="text-gray-600 hover:text-gray-900 transition">Pricing</a>
            <a href="/support" class="text-gray-600 hover:text-gray-900 transition">Support</a>
        </nav>
    </div>
</header>

<script>
// Header JavaScript
(function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');

    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
        menuIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
    });

    // Close mobile menu on link click
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
            menuIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
        });
    });

    // Show account button when scrolled past account box
    const scrollToAccountBtn = document.getElementById('scroll-to-account');
    window.addEventListener('scroll', function() {
        const accountBox = document.getElementById('account-box');
        if (accountBox) {
            const rect = accountBox.getBoundingClientRect();
            if (rect.bottom < 0) {
                scrollToAccountBtn.classList.remove('hidden');
            } else {
                scrollToAccountBtn.classList.add('hidden');
            }
        }
    });
})();
</script>
