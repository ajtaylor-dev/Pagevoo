<?php

namespace App\Models;

use App\Services\WebsiteFileService;
use Illuminate\Database\Eloquent\Model;

class UserWebsite extends Model
{
    protected $fillable = [
        'user_id',
        'template_id',
        'preview_hash',
        'subdomain',
        'custom_domain',
        'is_published',
        'last_published_at',
        'published_at'
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'last_published_at' => 'datetime',
        'is_published' => 'boolean',
    ];

    // ============ Relationships ============

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    public function pages()
    {
        return $this->hasMany(UserPage::class)->orderBy('order');
    }

    // ============ Directory & URL Helpers ============

    /**
     * Get the preview URL for this website.
     *
     * @return string|null
     */
    public function getPreviewUrl(): ?string
    {
        if (!$this->preview_hash) {
            return null;
        }

        return app(WebsiteFileService::class)->getPreviewUrl($this->preview_hash);
    }

    /**
     * Get the published URL for this website.
     *
     * @return string|null
     */
    public function getPublishedUrl(): ?string
    {
        if (!$this->is_published) {
            return null;
        }

        try {
            return app(WebsiteFileService::class)->getPublishedUrl($this);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get the preview directory path.
     *
     * @return string|null
     */
    public function getPreviewPath(): ?string
    {
        if (!$this->preview_hash) {
            return null;
        }

        return app(WebsiteFileService::class)->getPreviewPath($this->preview_hash);
    }

    /**
     * Get the published directory path.
     *
     * @return string|null
     */
    public function getPublishedPath(): ?string
    {
        try {
            return app(WebsiteFileService::class)->getPublishedPath($this);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get storage usage for this website.
     *
     * @return array
     */
    public function getStorageUsage(): array
    {
        return app(WebsiteFileService::class)->getStorageUsage($this);
    }

    /**
     * Check if website can be published (user has permission).
     *
     * @return bool
     */
    public function canPublish(): bool
    {
        return $this->user && app(\App\Services\PermissionService::class)->canPublish($this->user);
    }

    /**
     * Check if website has a subdomain or custom domain configured.
     *
     * @return bool
     */
    public function hasDomain(): bool
    {
        return !empty($this->subdomain) || !empty($this->custom_domain);
    }

    /**
     * Get the primary domain (custom domain takes precedence).
     *
     * @return string|null
     */
    public function getPrimaryDomain(): ?string
    {
        return $this->custom_domain ?? $this->subdomain;
    }

    // ============ Lifecycle Events ============

    protected static function booted()
    {
        // Auto-generate preview_hash on creation
        static::creating(function ($website) {
            if (!$website->preview_hash) {
                $website->preview_hash = app(WebsiteFileService::class)->generatePreviewHash();
            }
        });

        // Clean up directories on deletion
        static::deleting(function ($website) {
            $fileService = app(WebsiteFileService::class);
            $fileService->deletePreviewDirectory($website);
            $fileService->deletePublishedDirectory($website);
        });
    }
}
