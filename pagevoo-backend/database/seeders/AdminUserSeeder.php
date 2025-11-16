<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin User (Pro tier - highest level)
        User::create([
            'name' => 'AJ',
            'email' => 'admin@pagevoo.com',
            'password' => Hash::make('1qaz2wsx!QAZ"WSX'),
            'business_name' => 'Pagevoo Admin',
            'business_type' => 'other',
            'phone_number' => null,
            'role' => 'admin',
            'account_status' => 'active',
            'account_tier' => 'pro',
            'email_verified_at' => now(),
        ]);

        // Trial Tier Test User
        User::create([
            'name' => 'Trial User',
            'email' => 'trial@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Trial Test Business',
            'business_type' => 'other',
            'phone_number' => null,
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'trial',
            'email_verified_at' => now(),
        ]);

        // Brochure Tier Test User
        User::create([
            'name' => 'Brochure User',
            'email' => 'brochure@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Brochure Test Business',
            'business_type' => 'small_business',
            'phone_number' => null,
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'brochure',
            'email_verified_at' => now(),
        ]);

        // Niche Tier Test User
        User::create([
            'name' => 'Niche User',
            'email' => 'niche@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Niche Test Business',
            'business_type' => 'corporate',
            'phone_number' => null,
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'niche',
            'email_verified_at' => now(),
        ]);

        // Pro Tier Test User
        User::create([
            'name' => 'Pro User',
            'email' => 'pro@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Pro Test Business',
            'business_type' => 'corporate',
            'phone_number' => null,
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'pro',
            'email_verified_at' => now(),
        ]);
    }
}
