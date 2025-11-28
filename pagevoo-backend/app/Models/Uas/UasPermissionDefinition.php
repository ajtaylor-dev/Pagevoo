<?php

namespace App\Models\Uas;

use Illuminate\Database\Eloquent\Model;

class UasPermissionDefinition extends Model
{
    protected $table = 'uas_permission_definitions';

    protected $fillable = [
        'key',
        'name',
        'category',
        'description',
        'feature',
        'order',
    ];

    /**
     * Scope for core permissions (not feature-specific)
     */
    public function scopeCore($query)
    {
        return $query->whereNull('feature');
    }

    /**
     * Scope for a specific feature's permissions
     */
    public function scopeForFeature($query, string $feature)
    {
        return $query->where('feature', $feature);
    }

    /**
     * Get permissions grouped by category
     */
    public static function getGroupedByCategory(): array
    {
        return static::orderBy('category')
            ->orderBy('order')
            ->get()
            ->groupBy('category')
            ->toArray();
    }
}
