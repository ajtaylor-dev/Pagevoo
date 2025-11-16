<?php

namespace App\Exceptions;

use Exception;

class SecurityException extends Exception
{
    /**
     * Report the exception.
     *
     * @return bool|null
     */
    public function report()
    {
        \Log::error('Security Exception: ' . $this->getMessage(), [
            'file' => $this->getFile(),
            'line' => $this->getLine(),
            'trace' => $this->getTraceAsString(),
            'user_id' => auth()->id(),
            'ip' => request()->ip(),
            'url' => request()->fullUrl(),
        ]);

        return false;
    }

    /**
     * Render the exception into an HTTP response.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function render($request)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Security violation detected',
                'error' => app()->environment('local') ? $this->getMessage() : 'Security violation'
            ], 403);
        }

        return response()->view('errors.403', [
            'message' => 'Security violation detected'
        ], 403);
    }
}