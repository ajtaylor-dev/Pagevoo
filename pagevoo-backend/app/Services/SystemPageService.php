<?php

namespace App\Services;

use App\Models\TemplatePage;
use App\Models\TemplateSection;
use App\Models\UserPage;
use App\Models\UserSection;
use App\Models\Template;
use App\Models\UserWebsite;
use Illuminate\Support\Str;

class SystemPageService
{
    /**
     * System page definitions for each feature.
     * Each feature type maps to an array of system pages with their required sections.
     */
    protected array $systemPageDefinitions = [
        'user_access_system' => [
            [
                'system_type' => 'uas_login',
                'name' => 'Login',
                'slug' => 'login',
                'sections' => [
                    [
                        'type' => 'login-box',
                        'lock_type' => 'uas_login_form',
                        'section_name' => 'Login Form',
                        'content' => [
                            'loginConfig' => [
                                'title' => 'Welcome Back',
                                'subtitle' => 'Sign in to your account',
                                'showRememberMe' => true,
                                'showForgotPassword' => true,
                                'showRegisterLink' => true,
                                'registerText' => "Don't have an account?",
                                'registerLinkText' => 'Sign up',
                                'buttonText' => 'Sign In',
                                'theme' => 'default',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'system_type' => 'uas_register',
                'name' => 'Register',
                'slug' => 'register',
                'sections' => [
                    [
                        'type' => 'register-form',
                        'lock_type' => 'uas_register_form',
                        'section_name' => 'Registration Form',
                        'content' => [
                            'registerConfig' => [
                                'title' => 'Create Account',
                                'subtitle' => 'Join us today',
                                'showLoginLink' => true,
                                'loginText' => 'Already have an account?',
                                'loginLinkText' => 'Sign in',
                                'buttonText' => 'Create Account',
                                'requireEmailVerification' => true,
                                'requireSecurityQuestions' => true,
                                'theme' => 'default',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'system_type' => 'uas_dashboard',
                'name' => 'Dashboard',
                'slug' => 'dashboard',
                'sections' => [
                    [
                        'type' => 'user-dashboard',
                        'lock_type' => 'uas_dashboard_widget',
                        'section_name' => 'User Dashboard',
                        'content' => [
                            'dashboardConfig' => [
                                'title' => 'Welcome, {user_name}',
                                'showProfileLink' => true,
                                'showLogoutButton' => true,
                                'widgets' => ['profile_summary', 'recent_activity'],
                                'theme' => 'default',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'system_type' => 'uas_profile',
                'name' => 'Profile',
                'slug' => 'profile',
                'sections' => [
                    [
                        'type' => 'user-dashboard',
                        'lock_type' => 'uas_profile_editor',
                        'section_name' => 'Profile Editor',
                        'content' => [
                            'dashboardConfig' => [
                                'title' => 'My Profile',
                                'allowAvatarUpload' => true,
                                'allowPasswordChange' => true,
                                'allowSecurityQuestionsUpdate' => true,
                                'showSessionManagement' => true,
                                'theme' => 'default',
                                'mode' => 'profile',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'system_type' => 'uas_forgot_password',
                'name' => 'Forgot Password',
                'slug' => 'forgot-password',
                'sections' => [
                    [
                        'type' => 'forgot-password',
                        'lock_type' => 'uas_forgot_password_form',
                        'section_name' => 'Password Reset',
                        'content' => [
                            'forgotPasswordConfig' => [
                                'title' => 'Reset Password',
                                'subtitle' => 'Enter your email to receive reset instructions',
                                'useSecurityQuestions' => true,
                                'buttonText' => 'Reset Password',
                                'theme' => 'default',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'system_type' => 'uas_verify_email',
                'name' => 'Verify Email',
                'slug' => 'verify-email',
                'sections' => [
                    [
                        'type' => 'verify-email',
                        'lock_type' => 'uas_verify_email_handler',
                        'section_name' => 'Email Verification',
                        'content' => [
                            'verifyEmailConfig' => [
                                'verifyingTitle' => 'Verifying your email...',
                                'successTitle' => 'Email Verified!',
                                'successMessage' => 'Your email has been verified successfully.',
                                'expiredTitle' => 'Link Expired',
                                'expiredMessage' => 'This verification link has expired.',
                                'theme' => 'default',
                            ],
                        ],
                    ],
                ],
            ],
            [
                'system_type' => 'uas_logout',
                'name' => 'Logout',
                'slug' => 'logout',
                'sections' => [
                    [
                        'type' => 'grid-1x1',
                        'lock_type' => 'uas_logout_handler',
                        'section_name' => 'Logout Handler',
                        'content' => [
                            'columns' => [
                                [
                                    'html' => '<div class="text-center py-12"><h2 class="text-2xl font-bold mb-4">Logging out...</h2><p class="text-gray-600">You are being logged out. Please wait.</p></div>',
                                ],
                            ],
                            'logoutConfig' => [
                                'redirectTo' => '/',
                                'showConfirmation' => false,
                                'confirmationMessage' => 'Are you sure you want to log out?',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];

    /**
     * Get system page definitions for a feature.
     */
    public function getPageDefinitions(string $featureType): array
    {
        return $this->systemPageDefinitions[$featureType] ?? [];
    }

    /**
     * Get all supported feature types.
     */
    public function getSupportedFeatures(): array
    {
        return array_keys($this->systemPageDefinitions);
    }

    /**
     * Create system pages for a template.
     */
    public function createTemplateSystemPages(Template $template, string $featureType): array
    {
        $definitions = $this->getPageDefinitions($featureType);
        $createdPages = [];
        $maxOrder = $template->pages()->max('order') ?? 0;

        foreach ($definitions as $pageDef) {
            // Check if page already exists
            $existingPage = $template->pages()
                ->where('system_type', $pageDef['system_type'])
                ->first();

            if ($existingPage) {
                $createdPages[] = $existingPage;
                continue;
            }

            $maxOrder++;

            // Create the page
            $page = $template->pages()->create([
                'name' => $pageDef['name'],
                'slug' => $pageDef['slug'],
                'page_id' => 'page_' . Str::random(8),
                'is_homepage' => false,
                'order' => $maxOrder,
                'is_system' => true,
                'system_type' => $pageDef['system_type'],
                'feature_type' => $featureType,
            ]);

            // Create locked sections
            $sectionOrder = 0;
            foreach ($pageDef['sections'] as $sectionDef) {
                $page->sections()->create([
                    'section_name' => $sectionDef['section_name'],
                    'section_id' => 'section_' . Str::random(8),
                    'type' => $sectionDef['type'],
                    'content' => $sectionDef['content'],
                    'css' => [],
                    'order' => $sectionOrder++,
                    'is_locked' => true,
                    'lock_type' => $sectionDef['lock_type'],
                ]);
            }

            $createdPages[] = $page->fresh(['sections']);
        }

        return $createdPages;
    }

    /**
     * Create system pages for a user website.
     */
    public function createUserWebsiteSystemPages(UserWebsite $website, string $featureType): array
    {
        $definitions = $this->getPageDefinitions($featureType);
        $createdPages = [];
        $maxOrder = $website->pages()->max('order') ?? 0;

        foreach ($definitions as $pageDef) {
            // Check if page already exists
            $existingPage = $website->pages()
                ->where('system_type', $pageDef['system_type'])
                ->first();

            if ($existingPage) {
                $createdPages[] = $existingPage;
                continue;
            }

            $maxOrder++;

            // Create the page
            $page = $website->pages()->create([
                'name' => $pageDef['name'],
                'slug' => $pageDef['slug'],
                'page_id' => 'page_' . Str::random(8),
                'is_homepage' => false,
                'order' => $maxOrder,
                'is_system' => true,
                'system_type' => $pageDef['system_type'],
                'feature_type' => $featureType,
            ]);

            // Create locked sections
            $sectionOrder = 0;
            foreach ($pageDef['sections'] as $sectionDef) {
                $page->sections()->create([
                    'section_name' => $sectionDef['section_name'],
                    'section_id' => 'section_' . Str::random(8),
                    'type' => $sectionDef['type'],
                    'content' => $sectionDef['content'],
                    'css' => [],
                    'order' => $sectionOrder++,
                    'is_locked' => true,
                    'lock_type' => $sectionDef['lock_type'],
                ]);
            }

            $createdPages[] = $page->fresh(['sections']);
        }

        return $createdPages;
    }

    /**
     * Remove system pages for a template.
     */
    public function removeTemplateSystemPages(Template $template, string $featureType): int
    {
        // First delete sections for system pages
        $systemPageIds = $template->pages()
            ->where('feature_type', $featureType)
            ->where('is_system', true)
            ->pluck('id');

        TemplateSection::whereIn('template_page_id', $systemPageIds)->delete();

        // Then delete the pages
        return $template->pages()
            ->where('feature_type', $featureType)
            ->where('is_system', true)
            ->delete();
    }

    /**
     * Remove system pages for a user website.
     */
    public function removeUserWebsiteSystemPages(UserWebsite $website, string $featureType): int
    {
        // First delete sections for system pages
        $systemPageIds = $website->pages()
            ->where('feature_type', $featureType)
            ->where('is_system', true)
            ->pluck('id');

        UserSection::whereIn('user_page_id', $systemPageIds)->delete();

        // Then delete the pages
        return $website->pages()
            ->where('feature_type', $featureType)
            ->where('is_system', true)
            ->delete();
    }

    /**
     * Get system pages for a template.
     */
    public function getTemplateSystemPages(Template $template, ?string $featureType = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = $template->pages()->where('is_system', true);

        if ($featureType) {
            $query->where('feature_type', $featureType);
        }

        return $query->with('sections')->orderBy('order')->get();
    }

    /**
     * Get system pages for a user website.
     */
    public function getUserWebsiteSystemPages(UserWebsite $website, ?string $featureType = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = $website->pages()->where('is_system', true);

        if ($featureType) {
            $query->where('feature_type', $featureType);
        }

        return $query->with('sections')->orderBy('order')->get();
    }

    /**
     * Check if a page can be deleted (not a system page).
     */
    public function canDeletePage(TemplatePage|UserPage $page): bool
    {
        return !$page->is_system;
    }

    /**
     * Check if a section can be deleted (not locked).
     */
    public function canDeleteSection(TemplateSection|UserSection $section): bool
    {
        return !$section->is_locked;
    }

    /**
     * Get feature display name.
     */
    public function getFeatureDisplayName(string $featureType): string
    {
        $names = [
            'user_access_system' => 'User Access System',
            'booking' => 'Booking System',
            'shop' => 'E-Commerce Shop',
        ];

        return $names[$featureType] ?? ucwords(str_replace('_', ' ', $featureType));
    }

    /**
     * Get system type display name.
     */
    public function getSystemTypeDisplayName(string $systemType): string
    {
        $names = [
            'uas_login' => 'Login Page',
            'uas_register' => 'Registration Page',
            'uas_dashboard' => 'User Dashboard',
            'uas_profile' => 'Profile Page',
            'uas_forgot_password' => 'Password Reset',
            'uas_verify_email' => 'Email Verification',
            'uas_logout' => 'Logout Handler',
        ];

        return $names[$systemType] ?? ucwords(str_replace('_', ' ', $systemType));
    }
}
