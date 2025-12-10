<?php

namespace App\Models\Booking;

use Illuminate\Database\Eloquent\Model;

class BookingSettings extends Model
{
    protected $connection = 'website';
    protected $table = 'booking_settings';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting value by key
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key
     */
    public static function setValue(string $key, $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Get multiple settings as an array
     */
    public static function getMany(array $keys): array
    {
        $settings = static::whereIn('key', $keys)->pluck('value', 'key')->toArray();

        // Fill in missing keys with null
        foreach ($keys as $key) {
            if (!isset($settings[$key])) {
                $settings[$key] = null;
            }
        }

        return $settings;
    }

    /**
     * Get all settings as an associative array
     */
    public static function getAllSettings(): array
    {
        return static::pluck('value', 'key')->toArray();
    }

    /**
     * Set multiple settings at once
     */
    public static function setMany(array $settings): void
    {
        foreach ($settings as $key => $value) {
            static::setValue($key, $value);
        }
    }

    /**
     * Get a boolean setting
     */
    public static function getBool(string $key, bool $default = false): bool
    {
        $value = static::getValue($key);

        if (is_null($value)) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Get an integer setting
     */
    public static function getInt(string $key, int $default = 0): int
    {
        $value = static::getValue($key);

        if (is_null($value)) {
            return $default;
        }

        return (int) $value;
    }
}
