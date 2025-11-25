<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplatePage;
use App\Models\TemplateSection;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class FactoryResetService
{
    /**
     * Reset system to factory defaults with 4 test templates
     */
    public function resetToFactory()
    {
        try {
            // Temporarily disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Delete all templates and related records
            DB::table('template_sections')->truncate();
            DB::table('template_pages')->truncate();
            DB::table('templates')->truncate();

            // Delete all websites and their related records
            DB::table('user_sections')->truncate();
            DB::table('user_pages')->truncate();
            DB::table('user_websites')->truncate();

            // Delete all database instances
            \App\Models\DatabaseInstance::truncate();

            // Delete ALL users (we'll recreate the test users with correct IDs)
            DB::table('users')->truncate();

            // Reset auto-increment counters to 1
            DB::statement('ALTER TABLE templates AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE template_pages AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE template_sections AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE user_websites AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE user_pages AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE user_sections AUTO_INCREMENT = 1');
            DB::statement('ALTER TABLE users AUTO_INCREMENT = 1');

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            // Recreate test users with IDs 1-5
            $this->createTestUsers();

            // Create the 4 test templates (using admin user ID 1)
            $this->createTrialTemplate(1);
            $this->createBrochureTemplate(1);
            $this->createNicheTemplate(1);
            $this->createProTemplate(1);

            return [
                'success' => true,
                'message' => 'System reset to factory defaults successfully',
                'templates_created' => 4,
                'users_created' => 5
            ];

        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            throw $e;
        }
    }

    /**
     * Create test users with IDs 1-5
     */
    private function createTestUsers()
    {
        // ID 1: Admin
        User::create([
            'name' => 'AJ',
            'email' => 'admin@pagevoo.com',
            'password' => Hash::make('1qaz2wsx!QAZ"WSX'),
            'business_name' => 'Pagevoo Admin',
            'business_type' => 'software',
            'role' => 'admin',
            'account_status' => 'active',
            'account_tier' => 'pro', // Set as pro tier
            'email_verified_at' => now()
        ]);

        // ID 2: Trial User
        User::create([
            'name' => 'Trial User',
            'email' => 'trial@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Trial Business',
            'business_type' => 'other',
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'trial',
            'email_verified_at' => now()
        ]);

        // ID 3: Brochure User
        User::create([
            'name' => 'Brochure User',
            'email' => 'brochure@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Brochure Business',
            'business_type' => 'other',
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'brochure',
            'email_verified_at' => now()
        ]);

        // ID 4: Niche User
        User::create([
            'name' => 'Niche User',
            'email' => 'niche@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Niche Business',
            'business_type' => 'other',
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'niche',
            'email_verified_at' => now()
        ]);

        // ID 5: Pro User
        User::create([
            'name' => 'Pro User',
            'email' => 'pro@test.com',
            'password' => Hash::make('password'),
            'business_name' => 'Pro Business',
            'business_type' => 'other',
            'role' => 'user',
            'account_status' => 'active',
            'account_tier' => 'pro',
            'email_verified_at' => now()
        ]);
    }

    /**
     * Create Trial Template (ID: 1)
     */
    private function createTrialTemplate($userId)
    {
        $template = Template::create([
            'name' => 'Trial Template',
            'tier_category' => 'trial',
            'uses_trial_features_only' => true,
            'exclusive_to' => null,
            'business_type' => 'other',
            'description' => 'Basic template for trial users',
            'preview_image' => null,
            'is_active' => true,
            'created_by' => $userId
        ]);

        $page = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'index',
            'is_homepage' => true,
            'meta_title' => 'Trial Template Home',
            'meta_description' => 'Trial template homepage'
        ]);

        // Navbar
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => json_encode([
                'columns' => [[
                    'content' => '<nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #4f46e5;"><div style="font-size: 1.5rem; font-weight: bold; color: white;">TrialBrand</div><div style="display: flex; gap: 2rem;"><a href="#" style="color: white; text-decoration: none;">Home</a><a href="#" style="color: white; text-decoration: none;">About</a><a href="#" style="color: white; text-decoration: none;">Contact</a></div></nav>',
                    'colWidth' => 12
                ]],
                'cols' => 1,
                'rows' => 1,
                'col_widths' => [12]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#4f46e5', 'padding' => '0', 'margin' => '0'],
                'columns' => [['padding' => '0', 'display' => 'flex', 'alignItems' => 'center', 'justifyContent' => 'center']]
            ])
        ]);

        // Hero
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Hero Section',
            'section_id' => 'hero-' . uniqid(),
            'type' => 'hero',
            'order' => 1,
            'content' => json_encode([
                'columns' => [[
                    'content' => '<div style="text-align: center; padding: 4rem 2rem;"><h1 style="font-size: 2.5rem; font-weight: bold; color: #4f46e5; margin-bottom: 1rem;">Welcome to Trial Template</h1><p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem;">Start building your website with our easy-to-use template</p><button style="background: #4f46e5; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; cursor: pointer;">Get Started</button></div>',
                    'colWidth' => 12
                ]],
                'cols' => 1,
                'rows' => 1,
                'col_widths' => [12]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#ffffff', 'padding' => '4rem 0', 'margin' => '0'],
                'columns' => [['padding' => '2rem', 'display' => 'flex', 'alignItems' => 'center', 'justifyContent' => 'center']]
            ])
        ]);

        // Features
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Features',
            'section_id' => 'features-' . uniqid(),
            'type' => 'features',
            'order' => 2,
            'content' => json_encode([
                'columns' => [
                    ['content' => '<div style="text-align: center; padding: 2rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #4f46e5; margin-bottom: 0.5rem;">Fast Setup</h3><p style="color: #6b7280;">Get started in minutes</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">🎨</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #4f46e5; margin-bottom: 0.5rem;">Easy Customization</h3><p style="color: #6b7280;">Personalize your site</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">📱</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #4f46e5; margin-bottom: 0.5rem;">Mobile Friendly</h3><p style="color: #6b7280;">Works on all devices</p></div>', 'colWidth' => 4]
                ],
                'cols' => 3,
                'rows' => 1,
                'col_widths' => [4, 4, 4]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#f9fafb', 'padding' => '3rem 2rem', 'margin' => '0'],
                'columns' => [['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem']]
            ])
        ]);
    }

    /**
     * Create Brochure Template (ID: 2)
     */
    private function createBrochureTemplate($userId)
    {
        $template = Template::create([
            'name' => 'Brochure Template',
            'tier_category' => 'brochure',
            'uses_trial_features_only' => false,
            'exclusive_to' => 'brochure',
            'business_type' => 'other',
            'description' => 'Professional brochure template',
            'preview_image' => null,
            'is_active' => true,
            'created_by' => $userId
        ]);

        $page = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'index',
            'is_homepage' => true,
            'meta_title' => 'Brochure Template Home',
            'meta_description' => 'Brochure template homepage'
        ]);

        // Navbar
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => json_encode([
                'columns' => [[
                    'content' => '<nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #059669;"><div style="font-size: 1.5rem; font-weight: bold; color: white;">BrochureBrand</div><div style="display: flex; gap: 2rem;"><a href="#" style="color: white; text-decoration: none;">Home</a><a href="#" style="color: white; text-decoration: none;">Services</a><a href="#" style="color: white; text-decoration: none;">About</a><a href="#" style="color: white; text-decoration: none;">Contact</a></div></nav>',
                    'colWidth' => 12
                ]],
                'cols' => 1,
                'rows' => 1,
                'col_widths' => [12]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#059669', 'padding' => '0', 'margin' => '0'],
                'columns' => [['padding' => '0', 'display' => 'flex', 'alignItems' => 'center', 'justifyContent' => 'center']]
            ])
        ]);

        // Hero
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Hero Section',
            'section_id' => 'hero-' . uniqid(),
            'type' => 'hero',
            'order' => 1,
            'content' => json_encode([
                'columns' => [
                    ['content' => '<div style="padding: 3rem 2rem;"><h1 style="font-size: 2.5rem; font-weight: bold; color: #059669; margin-bottom: 1rem;">Professional Business Solutions</h1><p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 2rem;">Grow your business with our comprehensive services</p><button style="background: #059669; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; cursor: pointer;">Learn More</button></div>', 'colWidth' => 6],
                    ['content' => '<div style="padding: 3rem 2rem; background: linear-gradient(135deg, #059669 0%, #10b981 100%); min-height: 300px; display: flex; align-items: center; justify-content: center;"><div style="font-size: 4rem; color: white;">💼</div></div>', 'colWidth' => 6]
                ],
                'cols' => 2,
                'rows' => 1,
                'col_widths' => [6, 6]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#ffffff', 'padding' => '3rem 0', 'margin' => '0'],
                'columns' => [['padding' => '2rem'], ['padding' => '2rem']]
            ])
        ]);

        // Services
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Services Grid',
            'section_id' => 'services-' . uniqid(),
            'type' => 'services',
            'order' => 2,
            'content' => json_encode([
                'columns' => [
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #059669; margin-bottom: 0.5rem;">Consulting</h3><p style="color: #6b7280;">Expert business advice</p></div>', 'colWidth' => 6],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">🎯</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #059669; margin-bottom: 0.5rem;">Strategy</h3><p style="color: #6b7280;">Business planning</p></div>', 'colWidth' => 6],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">💻</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #059669; margin-bottom: 0.5rem;">Digital Services</h3><p style="color: #6b7280;">Online solutions</p></div>', 'colWidth' => 6],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">📈</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #059669; margin-bottom: 0.5rem;">Growth Support</h3><p style="color: #6b7280;">Scale your business</p></div>', 'colWidth' => 6]
                ],
                'cols' => 2,
                'rows' => 2,
                'col_widths' => [6, 6]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#f9fafb', 'padding' => '3rem 2rem', 'margin' => '0'],
                'columns' => [['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem']]
            ])
        ]);
    }

    /**
     * Create Niche Template (ID: 3)
     */
    private function createNicheTemplate($userId)
    {
        $template = Template::create([
            'name' => 'Niche Template',
            'tier_category' => 'niche',
            'uses_trial_features_only' => false,
            'exclusive_to' => 'niche',
            'business_type' => 'other',
            'description' => 'Specialized niche template',
            'preview_image' => null,
            'is_active' => true,
            'created_by' => $userId
        ]);

        $page = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'index',
            'is_homepage' => true,
            'meta_title' => 'Niche Template Home',
            'meta_description' => 'Niche template homepage'
        ]);

        // Navbar
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => json_encode([
                'columns' => [[
                    'content' => '<nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #ea580c;"><div style="font-size: 1.5rem; font-weight: bold; color: white;">NicheBrand</div><div style="display: flex; gap: 2rem;"><a href="#" style="color: white; text-decoration: none;">Home</a><a href="#" style="color: white; text-decoration: none;">Features</a><a href="#" style="color: white; text-decoration: none;">Pricing</a><a href="#" style="color: white; text-decoration: none;">Contact</a></div></nav>',
                    'colWidth' => 12
                ]],
                'cols' => 1,
                'rows' => 1,
                'col_widths' => [12]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#ea580c', 'padding' => '0', 'margin' => '0'],
                'columns' => [['padding' => '0', 'display' => 'flex', 'alignItems' => 'center', 'justifyContent' => 'center']]
            ])
        ]);

        // Hero
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Hero Section',
            'section_id' => 'hero-' . uniqid(),
            'type' => 'hero',
            'order' => 1,
            'content' => json_encode([
                'columns' => [[
                    'content' => '<div style="text-align: center; padding: 4rem 2rem;"><h1 style="font-size: 3rem; font-weight: bold; color: #ea580c; margin-bottom: 1.5rem;">Specialized Solutions for Your Industry</h1><p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem;">Tailored features designed specifically for your niche market</p><button style="background: #ea580c; color: white; padding: 1rem 2rem; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer;">Explore Features</button></div>',
                    'colWidth' => 12
                ]],
                'cols' => 1,
                'rows' => 1,
                'col_widths' => [12]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#ffffff', 'padding' => '4rem 0', 'margin' => '0'],
                'columns' => [['padding' => '2rem', 'display' => 'flex', 'alignItems' => 'center', 'justifyContent' => 'center']]
            ])
        ]);

        // Features Grid
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Features Grid',
            'section_id' => 'features-' . uniqid(),
            'type' => 'features',
            'order' => 2,
            'content' => json_encode([
                'columns' => [
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">🎯</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem;">Targeted Solutions</h3><p style="color: #6b7280;">Built for your specific needs</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">⚙️</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem;">Automation</h3><p style="color: #6b7280;">Streamline workflows</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem;">Analytics</h3><p style="color: #6b7280;">Track performance</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">🔧</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem;">Customization</h3><p style="color: #6b7280;">Adapt to your workflow</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">🚀</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem;">Performance</h3><p style="color: #6b7280;">Optimized for speed</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="font-size: 2.5rem; margin-bottom: 1rem;">🔒</div><h3 style="font-size: 1.25rem; font-weight: bold; color: #ea580c; margin-bottom: 0.5rem;">Security</h3><p style="color: #6b7280;">Enterprise-grade protection</p></div>', 'colWidth' => 4]
                ],
                'cols' => 3,
                'rows' => 2,
                'col_widths' => [4, 4, 4]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#f9fafb', 'padding' => '3rem 2rem', 'margin' => '0'],
                'columns' => [['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem']]
            ])
        ]);
    }

    /**
     * Create Pro Template (ID: 4)
     */
    private function createProTemplate($userId)
    {
        $template = Template::create([
            'name' => 'Pro Template',
            'tier_category' => 'pro',
            'uses_trial_features_only' => false,
            'exclusive_to' => 'pro',
            'business_type' => 'other',
            'description' => 'Professional template with advanced features',
            'preview_image' => null,
            'is_active' => true,
            'created_by' => $userId
        ]);

        $page = TemplatePage::create([
            'template_id' => $template->id,
            'name' => 'Home',
            'slug' => 'index',
            'is_homepage' => true,
            'meta_title' => 'Pro Template Home',
            'meta_description' => 'Professional template homepage'
        ]);

        // Navbar
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => json_encode([
                'columns' => [[
                    'content' => '<nav style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #7c3aed;"><div style="font-size: 1.5rem; font-weight: bold; color: white;">ProBrand</div><div style="display: flex; gap: 2rem;"><a href="#" style="color: white; text-decoration: none;">Home</a><a href="#" style="color: white; text-decoration: none;">Services</a><a href="#" style="color: white; text-decoration: none;">Portfolio</a><a href="#" style="color: white; text-decoration: none;">Contact</a></div></nav>',
                    'colWidth' => 12
                ]],
                'cols' => 1,
                'rows' => 1,
                'col_widths' => [12]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#7c3aed', 'padding' => '0', 'margin' => '0'],
                'columns' => [['padding' => '0', 'display' => 'flex', 'alignItems' => 'center', 'justifyContent' => 'center']]
            ])
        ]);

        // Hero
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Hero Section',
            'section_id' => 'hero-' . uniqid(),
            'type' => 'hero',
            'order' => 1,
            'content' => json_encode([
                'columns' => [
                    ['content' => '<div style="padding: 4rem 2rem;"><h1 style="font-size: 3rem; font-weight: bold; color: #7c3aed; margin-bottom: 1.5rem;">Premium Professional Solutions</h1><p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem;">Elevate your business with enterprise-grade solutions tailored for success</p><button style="background: #7c3aed; color: white; padding: 1rem 2rem; border: none; border-radius: 0.5rem; font-size: 1.125rem; cursor: pointer;">Get Started</button></div>', 'colWidth' => 6],
                    ['content' => '<div style="padding: 4rem 2rem; background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); min-height: 400px; display: flex; align-items: center; justify-content: center;"><div style="font-size: 4rem; color: white;">🚀</div></div>', 'colWidth' => 6]
                ],
                'cols' => 2,
                'rows' => 1,
                'col_widths' => [6, 6]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#ffffff', 'padding' => '4rem 0', 'margin' => '0'],
                'columns' => [['padding' => '2rem'], ['padding' => '2rem']]
            ])
        ]);

        // Features Grid
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Features Grid',
            'section_id' => 'features-' . uniqid(),
            'type' => 'features',
            'order' => 2,
            'content' => json_encode([
                'columns' => [
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="font-size: 3rem; margin-bottom: 1rem;">💼</div><h3 style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-bottom: 1rem;">Enterprise Solutions</h3><p style="color: #6b7280;">Scalable solutions for large organizations</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div><h3 style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-bottom: 1rem;">Advanced Security</h3><p style="color: #6b7280;">Bank-grade encryption and protection</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="font-size: 3rem; margin-bottom: 1rem;">📊</div><h3 style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-bottom: 1rem;">Analytics Dashboard</h3><p style="color: #6b7280;">Real-time insights and reporting</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div><h3 style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-bottom: 1rem;">Lightning Fast</h3><p style="color: #6b7280;">Optimized performance guaranteed</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="font-size: 3rem; margin-bottom: 1rem;">🌐</div><h3 style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-bottom: 1rem;">Global CDN</h3><p style="color: #6b7280;">Worldwide content delivery network</p></div>', 'colWidth' => 4],
                    ['content' => '<div style="text-align: center; padding: 2rem; background: white; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div><h3 style="font-size: 1.5rem; font-weight: bold; color: #7c3aed; margin-bottom: 1rem;">Custom Solutions</h3><p style="color: #6b7280;">Tailored to your specific needs</p></div>', 'colWidth' => 4]
                ],
                'cols' => 3,
                'rows' => 2,
                'col_widths' => [4, 4, 4]
            ]),
            'css' => json_encode([
                'section' => ['backgroundColor' => '#f9fafb', 'padding' => '4rem 2rem', 'margin' => '0'],
                'columns' => [['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem'], ['padding' => '1rem']]
            ])
        ]);
    }
}
