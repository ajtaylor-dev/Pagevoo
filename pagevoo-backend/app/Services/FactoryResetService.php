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
     * Get default navbar content structure
     */
    private function getNavbarContent($logoText)
    {
        return [
            'logo' => $logoText,
            'logoWidth' => 25,
            'links' => ['Home', 'About', 'Services', 'Contact'],
            'position' => 'static',
            'content_css' => '',
            'containerStyle' => [
                'paddingTop' => '16px',
                'paddingBottom' => '16px',
                'paddingLeft' => '0px',
                'paddingRight' => '0px',
                'marginTop' => '0px',
                'marginBottom' => '0px',
                'marginLeft' => '0px',
                'marginRight' => '0px',
                'width' => '100%',
                'height' => 'auto',
                'background' => '#ffffff'
            ]
        ];
    }

    /**
     * Get default grid-1x1 content structure
     */
    private function getGrid1x1Content()
    {
        return [
            'columns' => [
                [
                    'content' => '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>',
                    'colWidth' => 12
                ]
            ],
            'content_css' => [
                'columns' => [
                    '0' => "border: 2px dashed #d1d5db;\nborder-radius: 0.5rem;\nmin-height: 200px;\npadding: 1rem;"
                ]
            ],
            'section_css' => 'padding: 2rem;'
        ];
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

        // Navbar with "Trial" as logo
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => $this->getNavbarContent('Trial')
        ]);

        // 1x1 Grid section
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => '1 Column',
            'section_id' => 'grid-1x1-' . uniqid(),
            'type' => 'grid-1x1',
            'order' => 1,
            'content' => $this->getGrid1x1Content()
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

        // Navbar with "Brochure" as logo
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => $this->getNavbarContent('Brochure')
        ]);

        // 1x1 Grid section
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => '1 Column',
            'section_id' => 'grid-1x1-' . uniqid(),
            'type' => 'grid-1x1',
            'order' => 1,
            'content' => $this->getGrid1x1Content()
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

        // Navbar with "Niche" as logo
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => $this->getNavbarContent('Niche')
        ]);

        // 1x1 Grid section
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => '1 Column',
            'section_id' => 'grid-1x1-' . uniqid(),
            'type' => 'grid-1x1',
            'order' => 1,
            'content' => $this->getGrid1x1Content()
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

        // Navbar with "Pro" as logo
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => 'Navigation Bar',
            'section_id' => 'navbar-' . uniqid(),
            'type' => 'navbar',
            'order' => 0,
            'content' => $this->getNavbarContent('Pro')
        ]);

        // 1x1 Grid section
        TemplateSection::create([
            'template_page_id' => $page->id,
            'section_name' => '1 Column',
            'section_id' => 'grid-1x1-' . uniqid(),
            'type' => 'grid-1x1',
            'order' => 1,
            'content' => $this->getGrid1x1Content()
        ]);
    }
}
