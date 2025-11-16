<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\File;
use App\Exceptions\SecurityException;

/**
 * Path Validator Service
 * Validates and sanitizes file paths to prevent directory traversal attacks
 */
class PathValidator
{
    /**
     * Validate that a path is within allowed boundaries
     *
     * @param string $path The path to validate
     * @param string $basePath The base directory that path must be within
     * @throws SecurityException
     * @return string The validated real path
     */
    public function validatePath(string $path, string $basePath): string
    {
        // Get real paths to prevent symlink attacks
        $realPath = realpath($path);
        $realBasePath = realpath($basePath);

        // If path doesn't exist yet (for new files), validate the directory
        if ($realPath === false) {
            $directory = dirname($path);
            $realDirectory = realpath($directory);

            if ($realDirectory === false) {
                throw new SecurityException("Invalid path: Directory does not exist");
            }

            // Check if directory is within base path
            if (strpos($realDirectory, $realBasePath) !== 0) {
                throw new SecurityException("Path traversal attempt detected");
            }

            // Validate filename
            $filename = basename($path);
            if (!$this->isValidFilename($filename)) {
                throw new SecurityException("Invalid filename");
            }

            return $realDirectory . DIRECTORY_SEPARATOR . $filename;
        }

        // Check if the real path is within the base path
        if (strpos($realPath, $realBasePath) !== 0) {
            throw new SecurityException("Path traversal attempt detected");
        }

        return $realPath;
    }

    /**
     * Validate a filename
     *
     * @param string $filename
     * @return bool
     */
    public function isValidFilename(string $filename): bool
    {
        // Check for directory traversal patterns
        $dangerousPatterns = [
            '..',
            './',
            '..\\',
            '.\\',
            '%2e%2e',
            '%252e%252e',
            '..;',
            '..%00',
            '..%01',
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (stripos($filename, $pattern) !== false) {
                return false;
            }
        }

        // Check for null bytes
        if (strpos($filename, chr(0)) !== false) {
            return false;
        }

        // Check for control characters
        if (preg_match('/[\x00-\x1f\x7f]/', $filename)) {
            return false;
        }

        // Validate filename format (alphanumeric, dash, underscore, dot)
        if (!preg_match('/^[a-zA-Z0-9\-_.]+$/', $filename)) {
            return false;
        }

        // Check for double extensions that might hide true file type
        $doubleExtensions = [
            '.php.',
            '.phtml.',
            '.php3.',
            '.php4.',
            '.php5.',
            '.asp.',
            '.aspx.',
            '.jsp.',
        ];

        foreach ($doubleExtensions as $ext) {
            if (stripos($filename, $ext) !== false) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sanitize a path by removing dangerous characters
     *
     * @param string $path
     * @return string
     */
    public function sanitizePath(string $path): string
    {
        // Remove null bytes
        $path = str_replace(chr(0), '', $path);

        // Remove directory traversal attempts
        $path = str_replace(['../', '..\\', '..'], '', $path);

        // Normalize directory separators
        $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);

        // Remove multiple consecutive separators
        $path = preg_replace('/[\/\\\]+/', DIRECTORY_SEPARATOR, $path);

        // Remove trailing separators (except for root)
        if (strlen($path) > 1) {
            $path = rtrim($path, DIRECTORY_SEPARATOR);
        }

        return $path;
    }

    /**
     * Get safe filename from user input
     *
     * @param string $filename
     * @param array $allowedExtensions
     * @return string
     */
    public function getSafeFilename(string $filename, array $allowedExtensions = []): string
    {
        // Get the extension
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        // Validate extension if whitelist provided
        if (!empty($allowedExtensions) && !in_array($extension, $allowedExtensions)) {
            throw new SecurityException("File type not allowed");
        }

        // Generate safe filename
        $name = pathinfo($filename, PATHINFO_FILENAME);
        $name = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $name);
        $name = substr($name, 0, 100); // Limit length

        // Ensure name is not empty
        if (empty($name)) {
            $name = 'file_' . time();
        }

        return $name . '.' . $extension;
    }

    /**
     * Validate image file
     *
     * @param string $path
     * @return bool
     */
    public function isValidImage(string $path): bool
    {
        // Check if file exists
        if (!File::exists($path)) {
            return false;
        }

        // Get mime type
        $mimeType = mime_content_type($path);

        $allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
        ];

        if (!in_array($mimeType, $allowedMimeTypes)) {
            return false;
        }

        // Additional check using getimagesize for non-SVG images
        if ($mimeType !== 'image/svg+xml') {
            $imageInfo = @getimagesize($path);
            if ($imageInfo === false) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create safe directory path
     *
     * @param string $basePath
     * @param string $directory
     * @return string
     */
    public function createSafeDirectory(string $basePath, string $directory): string
    {
        $safeName = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $directory);
        $safePath = $basePath . DIRECTORY_SEPARATOR . $safeName;

        // Validate the path is within base
        $this->validatePath($safePath, $basePath);

        // Create directory if it doesn't exist
        if (!File::exists($safePath)) {
            File::makeDirectory($safePath, 0755, true);
        }

        return $safePath;
    }

    /**
     * Get allowed file upload extensions by type
     *
     * @param string $type
     * @return array
     */
    public function getAllowedExtensions(string $type = 'image'): array
    {
        $extensions = [
            'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            'document' => ['pdf', 'doc', 'docx', 'txt', 'rtf'],
            'video' => ['mp4', 'avi', 'mov', 'wmv', 'webm'],
            'audio' => ['mp3', 'wav', 'ogg', 'm4a'],
            'archive' => ['zip', 'rar', '7z', 'tar', 'gz'],
        ];

        return $extensions[$type] ?? [];
    }

    /**
     * Validate file size
     *
     * @param string $path
     * @param int $maxSize Size in MB
     * @return bool
     */
    public function validateFileSize(string $path, int $maxSize = 10): bool
    {
        if (!File::exists($path)) {
            return false;
        }

        $fileSize = filesize($path);
        $maxSizeBytes = $maxSize * 1024 * 1024;

        return $fileSize <= $maxSizeBytes;
    }
}