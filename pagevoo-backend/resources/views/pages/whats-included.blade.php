@extends('layouts.app')

@section('title', 'What\'s Included - Pagevoo')
@section('meta_description', 'See everything that comes with your Pagevoo business solution.')

@section('content')
<section class="bg-dark py-16 px-6">
    <div class="max-w-7xl mx-auto">
        <h1 class="text-5xl font-bold text-primary mb-6">What's Included</h1>
        <div class="text-gray-300 text-lg leading-relaxed max-w-3xl space-y-4">
            <p>Every Pagevoo solution includes:</p>
            <ul class="space-y-3">
                <li class="flex items-start">
                    <span class="text-primary mr-2">✓</span>
                    <span>Fully responsive website design</span>
                </li>
                <li class="flex items-start">
                    <span class="text-primary mr-2">✓</span>
                    <span>Online booking and reservation system</span>
                </li>
                <li class="flex items-start">
                    <span class="text-primary mr-2">✓</span>
                    <span>E-commerce and online ordering</span>
                </li>
                <li class="flex items-start">
                    <span class="text-primary mr-2">✓</span>
                    <span>Customer management tools</span>
                </li>
                <li class="flex items-start">
                    <span class="text-primary mr-2">✓</span>
                    <span>Content management system (CMS)</span>
                </li>
                <li class="flex items-start">
                    <span class="text-primary mr-2">✓</span>
                    <span>SEO optimization</span>
                </li>
            </ul>
        </div>
    </div>
</section>
@endsection
