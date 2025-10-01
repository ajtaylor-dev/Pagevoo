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
        User::create([
            'name' => 'AJ',
            'email' => 'admin@pagevoo.com',
            'password' => Hash::make('1qaz2wsx!QAZ"WSX'),
            'business_name' => 'Pagevoo Admin',
            'business_type' => 'other',
            'phone_number' => null,
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}
