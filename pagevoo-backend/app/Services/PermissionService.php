<?php

namespace App\Services;

use App\Models\User;

/**
 * Permission Service
 *
 * Centralized service for checking user feature permissions
 * based on account tier (trial, brochure, niche, pro).
 */
class PermissionService
{
    /**
     * Check if a user has access to a specific feature.
     *
     * @param User $user
     * @param string $feature Feature key from pagevoo_permissions config/database
     * @return bool
     */
    public function can(User $user, string $feature): bool
    {
        $tier = $this->getAccountTier($user);
        $permissions = $this->getTierPermissions($tier);

        // Return false if permission not found, otherwise return the value
        return $permissions[$feature] ?? false;
    }

    /**
     * Get all permissions for a specific tier (cached).
     *
     * @param string $tier
     * @return array
     */
    protected function getTierPermissions(string $tier): array
    {
        // Try to get from database first
        $tierPermission = \DB::table('tier_permissions')->where('tier', $tier)->first();

        if ($tierPermission) {
            return json_decode($tierPermission->permissions, true);
        }

        // Fallback to config file
        return config("pagevoo_permissions.{$tier}", []);
    }

    /**
     * Check if a user can access multiple features (requires ALL).
     *
     * @param User $user
     * @param array $features
     * @return bool
     */
    public function canAll(User $user, array $features): bool
    {
        foreach ($features as $feature) {
            if (!$this->can($user, $feature)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if a user can access any of the features (requires ONE).
     *
     * @param User $user
     * @param array $features
     * @return bool
     */
    public function canAny(User $user, array $features): bool
    {
        foreach ($features as $feature) {
            if ($this->can($user, $feature)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get a numeric limit value for a user (e.g., max_pages, max_images).
     *
     * @param User $user
     * @param string $limit Limit key from pagevoo_permissions config/database
     * @return mixed (int|null for unlimited)
     */
    public function getLimit(User $user, string $limit)
    {
        $tier = $this->getAccountTier($user);
        $permissions = $this->getTierPermissions($tier);
        return $permissions[$limit] ?? 0;
    }

    /**
     * Check if user has reached a numeric limit.
     *
     * @param User $user
     * @param string $limit Limit key (e.g., 'max_pages')
     * @param int $currentCount Current count of items
     * @return bool True if limit exceeded
     */
    public function hasExceededLimit(User $user, string $limit, int $currentCount): bool
    {
        $maxLimit = $this->getLimit($user, $limit);

        // If limit is null, it's unlimited (pro users)
        if ($maxLimit === null) {
            return false;
        }

        return $currentCount >= $maxLimit;
    }

    /**
     * Get all permissions for a specific account tier.
     *
     * @param User $user
     * @return array
     */
    public function getAllPermissions(User $user): array
    {
        $tier = $this->getAccountTier($user);
        return $this->getTierPermissions($tier);
    }

    /**
     * Get the account tier for a user.
     *
     * @param User $user
     * @return string (trial|brochure|niche|pro)
     */
    public function getAccountTier(User $user): string
    {
        // Use account_tier field if set, otherwise default to 'trial'
        return $user->account_tier ?? 'trial';
    }

    /**
     * Check if user can publish their website.
     *
     * @param User $user
     * @return bool
     */
    public function canPublish(User $user): bool
    {
        return $this->can($user, 'publish_website');
    }

    /**
     * Check if user can use custom domain.
     *
     * @param User $user
     * @return bool
     */
    public function canUseCustomDomain(User $user): bool
    {
        return $this->can($user, 'custom_domain');
    }

    /**
     * Check if user has access to a template tier.
     *
     * @param User $user
     * @param string $templateTier (trial|brochure|niche|pro)
     * @return bool
     */
    public function canAccessTemplate(User $user, string $templateTier): bool
    {
        $featureKey = "access_{$templateTier}_templates";
        return $this->can($user, $featureKey);
    }

    /**
     * Get available template tiers for user.
     *
     * @param User $user
     * @return array
     */
    public function getAvailableTemplateTiers(User $user): array
    {
        $tiers = [];
        $allTiers = ['trial', 'brochure', 'niche', 'pro'];

        foreach ($allTiers as $tier) {
            if ($this->canAccessTemplate($user, $tier)) {
                $tiers[] = $tier;
            }
        }

        return $tiers;
    }

    /**
     * Check if user can access a script feature.
     *
     * @param User $user
     * @param string $scriptName (contact_form, blog_news, booking_system, etc.)
     * @return bool
     */
    public function canAccessScript(User $user, string $scriptName): bool
    {
        $featureKey = "script_{$scriptName}";
        return $this->can($user, $featureKey);
    }

    /**
     * Get tier-specific usage information.
     *
     * @param User $user
     * @return array
     */
    public function getUsageInfo(User $user): array
    {
        return [
            'tier' => $this->getAccountTier($user),
            'limits' => [
                'max_pages' => $this->getLimit($user, 'max_pages'),
                'max_sections_per_page' => $this->getLimit($user, 'max_sections_per_page'),
                'max_images' => $this->getLimit($user, 'max_images'),
                'max_storage_mb' => $this->getLimit($user, 'max_storage_mb'),
            ],
            'features' => [
                'can_publish' => $this->canPublish($user),
                'can_use_custom_domain' => $this->canUseCustomDomain($user),
                'can_remove_branding' => $this->can($user, 'remove_branding'),
                'has_priority_support' => $this->can($user, 'priority_support'),
            ],
        ];
    }

    /**
     * Get upgrade suggestion for a locked feature.
     *
     * @param string $feature Feature key
     * @return string|null Minimum tier required (null if not found)
     */
    public function getRequiredTierForFeature(string $feature): ?string
    {
        $tiers = ['trial', 'brochure', 'niche', 'pro'];

        foreach ($tiers as $tier) {
            if (config("pagevoo_permissions.{$tier}.{$feature}") === true) {
                return $tier;
            }
        }

        return null;
    }
}
