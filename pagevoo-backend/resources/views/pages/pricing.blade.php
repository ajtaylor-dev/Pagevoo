@extends('layouts.app')

@section('title', 'Pricing - Pagevoo')
@section('meta_description', 'Simple, transparent pricing for complete business solutions.')

@section('content')
<section class="bg-dark py-16 px-6">
    <div class="max-w-7xl mx-auto">
        <h1 class="text-5xl font-bold text-primary mb-6">Pricing</h1>
        <p class="text-gray-300 text-lg leading-relaxed max-w-3xl mb-8">
            Affordable pricing with no hidden fees. Get everything your business needs in one complete package.
        </p>
        <div class="grid md:grid-cols-3 gap-8 max-w-5xl">
            <!-- Pricing cards will go here -->
            <div class="bg-white rounded-lg p-8 text-center">
                <h3 class="text-2xl font-bold text-dark mb-4">Starter</h3>
                <p class="text-4xl font-bold text-primary mb-6">$XX/mo</p>
                <ul class="text-left space-y-3 mb-8">
                    <li class="flex items-start">
                        <span class="text-primary mr-2">✓</span>
                        <span>Basic features</span>
                    </li>
                </ul>
                <a href="/register" class="block w-full bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition">
                    Get Started
                </a>
            </div>
        </div>
    </div>
</section>
@endsection
