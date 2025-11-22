<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DatabaseInstance extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'type',
        'reference_id',
        'database_name',
        'status',
        'size_bytes',
        'last_backup_at',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'metadata' => 'array',
        'last_backup_at' => 'datetime',
        'size_bytes' => 'integer',
    ];

    /**
     * Get the template if this is a template database.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'reference_id');
    }

    /**
     * Get the user website if this is a website database.
     */
    public function userWebsite(): BelongsTo
    {
        return $this->belongsTo(UserWebsite::class, 'reference_id');
    }

    /**
     * Check if database is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if this is a template database.
     */
    public function isTemplateDatabase(): bool
    {
        return $this->type === 'template';
    }

    /**
     * Check if this is a website database.
     */
    public function isWebsiteDatabase(): bool
    {
        return $this->type === 'website';
    }

    /**
     * Mark database as creating.
     */
    public function markAsCreating(): bool
    {
        return $this->update(['status' => 'creating']);
    }

    /**
     * Mark database as copying.
     */
    public function markAsCopying(): bool
    {
        return $this->update(['status' => 'copying']);
    }

    /**
     * Mark database as deleting.
     */
    public function markAsDeleting(): bool
    {
        return $this->update(['status' => 'deleting']);
    }

    /**
     * Mark database as active.
     */
    public function markAsActive(): bool
    {
        return $this->update(['status' => 'active']);
    }

    /**
     * Mark database as error.
     */
    public function markAsError(): bool
    {
        return $this->update(['status' => 'error']);
    }

    /**
     * Update database size.
     */
    public function updateSize(int $bytes): bool
    {
        return $this->update(['size_bytes' => $bytes]);
    }

    /**
     * Record backup timestamp.
     */
    public function recordBackup(): bool
    {
        return $this->update(['last_backup_at' => now()]);
    }

    /**
     * Get installed features from metadata.
     */
    public function getInstalledFeatures(): array
    {
        return $this->metadata['installed_features'] ?? [];
    }

    /**
     * Add installed feature to metadata.
     */
    public function addInstalledFeature(string $featureType, array $config = []): bool
    {
        $metadata = $this->metadata ?? [];
        $features = $metadata['installed_features'] ?? [];

        $features[] = [
            'type' => $featureType,
            'config' => $config,
            'installed_at' => now()->toIso8601String(),
        ];

        $metadata['installed_features'] = $features;

        return $this->update(['metadata' => $metadata]);
    }

    /**
     * Remove installed feature from metadata.
     */
    public function removeInstalledFeature(string $featureType): bool
    {
        $metadata = $this->metadata ?? [];
        $features = $metadata['installed_features'] ?? [];

        $features = array_filter($features, function ($feature) use ($featureType) {
            return $feature['type'] !== $featureType;
        });

        $metadata['installed_features'] = array_values($features);

        return $this->update(['metadata' => $metadata]);
    }
}
