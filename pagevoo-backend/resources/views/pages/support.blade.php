@extends('layouts.app')

@section('title', 'Support - Pagevoo')
@section('meta_description', 'Get help and support for your Pagevoo business solution.')

@section('content')
<section class="bg-dark py-16 px-6">
    <div class="max-w-7xl mx-auto">
        <h1 class="text-5xl font-bold text-primary mb-6">Support</h1>
        <p class="text-gray-300 text-lg leading-relaxed max-w-3xl mb-8">
            We're here to help you succeed. Get in touch with our support team.
        </p>
        <div class="max-w-2xl">
            <form class="space-y-6">
                <div>
                    <label class="block text-gray-300 mb-2">Name</label>
                    <input type="text" class="w-full px-4 py-2 rounded-lg border border-gray-600 bg-dark-alt text-white focus:outline-none focus:ring-2 focus:ring-primary" required>
                </div>
                <div>
                    <label class="block text-gray-300 mb-2">Email</label>
                    <input type="email" class="w-full px-4 py-2 rounded-lg border border-gray-600 bg-dark-alt text-white focus:outline-none focus:ring-2 focus:ring-primary" required>
                </div>
                <div>
                    <label class="block text-gray-300 mb-2">Message</label>
                    <textarea rows="6" class="w-full px-4 py-2 rounded-lg border border-gray-600 bg-dark-alt text-white focus:outline-none focus:ring-2 focus:ring-primary" required></textarea>
                </div>
                <button type="submit" class="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition">
                    Send Message
                </button>
            </form>
        </div>
    </div>
</section>
@endsection
