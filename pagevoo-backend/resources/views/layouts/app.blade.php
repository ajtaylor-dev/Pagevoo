<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="@yield('meta_description', 'Pagevoo - Your complete business solution, ready to launch. Industry-specific websites with booking, ordering, CMS, and everything your business needs.')">
    <meta name="keywords" content="@yield('meta_keywords', 'business website, online ordering, booking system, restaurant website, local business')">
    <title>@yield('title', 'Pagevoo - Complete Business Solutions')</title>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#98b290',
                        'primary-dark': '#88a280',
                        'primary-darker': '#7a9274',
                        dark: '#4b4b4b',
                        'dark-alt': '#3a3a3a',
                    }
                }
            }
        }
    </script>

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">

    @yield('styles')
</head>
<body class="min-h-screen bg-white">
    <!-- Header -->
    @include('partials.header')

    <!-- Main Content -->
    <div class="pt-[72px]">
        @yield('content')
    </div>

    <!-- Footer -->
    @include('partials.footer')

    @yield('scripts')
</body>
</html>
