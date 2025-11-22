<?php

namespace App\Http\Controllers\Api\V1\ScriptFeatures;

use App\Http\Controllers\Controller;
use App\Models\ScriptFeatures\ContactForm;
use App\Models\ScriptFeatures\FormSubmission;
use App\Models\ScriptFeatures\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ContactFormController extends Controller
{
    /**
     * Display a listing of contact forms for a website.
     */
    public function index(Request $request): JsonResponse
    {
        $websiteId = $request->user()->current_website_id ?? $request->input('website_id');

        $forms = ContactForm::where('website_id', $websiteId)
            ->withCount('submissions')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $forms,
        ]);
    }

    /**
     * Store a newly created contact form.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'website_id' => 'required|integer',
            'name' => 'required|string|max:255',
            'form_type' => ['required', Rule::in(['general', 'support', 'mass_mailer'])],
            'recipient_email' => 'required|email',
            'spam_protection' => 'nullable|array',
            'spam_protection.honeypot' => 'nullable|boolean',
            'spam_protection.recaptcha_type' => 'nullable|string|in:v2,v3',
            'storage_options' => 'required|array',
            'storage_options.database' => 'required|boolean',
            'storage_options.email' => 'required|boolean',
            'auto_responder' => 'nullable|array',
            'auto_responder.enabled' => 'nullable|boolean',
            'auto_responder.subject' => 'nullable|string',
            'auto_responder.message' => 'nullable|string',
            'allow_attachments' => 'nullable|boolean',
            'allowed_file_types' => 'nullable|array',
            'styling' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $form = ContactForm::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Contact form created successfully',
            'data' => $form,
        ], 201);
    }

    /**
     * Display the specified contact form.
     */
    public function show(string $id): JsonResponse
    {
        $form = ContactForm::with('submissions')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $form,
        ]);
    }

    /**
     * Update the specified contact form.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $form = ContactForm::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'form_type' => ['sometimes', Rule::in(['general', 'support', 'mass_mailer'])],
            'recipient_email' => 'sometimes|email',
            'spam_protection' => 'nullable|array',
            'storage_options' => 'sometimes|array',
            'auto_responder' => 'nullable|array',
            'allow_attachments' => 'nullable|boolean',
            'allowed_file_types' => 'nullable|array',
            'styling' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $form->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Contact form updated successfully',
            'data' => $form,
        ]);
    }

    /**
     * Remove the specified contact form.
     */
    public function destroy(string $id): JsonResponse
    {
        $form = ContactForm::findOrFail($id);
        $form->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contact form deleted successfully',
        ]);
    }

    /**
     * Get submissions for a specific form.
     */
    public function getSubmissions(Request $request, string $id): JsonResponse
    {
        $form = ContactForm::findOrFail($id);

        $query = $form->submissions();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('data->email', 'like', "%{$search}%")
                  ->orWhere('data->name', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->input('per_page', 15);
        $submissions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $submissions,
        ]);
    }

    /**
     * Submit a form from the frontend.
     */
    public function submit(Request $request, string $id): JsonResponse
    {
        $form = ContactForm::findOrFail($id);

        // Validate submission data
        $validator = Validator::make($request->all(), [
            'data' => 'required|array',
            'data.name' => 'required|string|max:255',
            'data.email' => 'required|email',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // 10MB max per file
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Handle file attachments if allowed
        $attachmentPaths = [];
        if ($form->allowsAttachments() && $request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store("form_attachments/{$form->website_id}/{$form->id}", 'public');
                $attachmentPaths[] = $path;
            }
        }

        // Create submission
        $submission = FormSubmission::create([
            'contact_form_id' => $form->id,
            'data' => $request->input('data'),
            'attachments' => $attachmentPaths,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'new',
        ]);

        // Create support ticket if this is a support form
        if ($form->isSupportForm()) {
            $ticket = SupportTicket::create([
                'form_submission_id' => $submission->id,
                'ticket_number' => SupportTicket::generateTicketNumber(),
                'category' => $request->input('data.category'),
                'priority' => $request->input('data.priority', 'medium'),
                'status' => 'open',
            ]);
        }

        // TODO: Send emails (if configured)
        // TODO: Send auto-responder (if enabled)

        return response()->json([
            'success' => true,
            'message' => 'Form submitted successfully',
            'data' => [
                'submission_id' => $submission->id,
                'ticket_number' => $ticket->ticket_number ?? null,
            ],
        ], 201);
    }

    /**
     * Mark submission as read.
     */
    public function markAsRead(string $formId, string $submissionId): JsonResponse
    {
        $submission = FormSubmission::where('contact_form_id', $formId)
            ->findOrFail($submissionId);

        $submission->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Submission marked as read',
        ]);
    }

    /**
     * Mark submission as spam.
     */
    public function markAsSpam(string $formId, string $submissionId): JsonResponse
    {
        $submission = FormSubmission::where('contact_form_id', $formId)
            ->findOrFail($submissionId);

        $submission->markAsSpam();

        return response()->json([
            'success' => true,
            'message' => 'Submission marked as spam',
        ]);
    }

    /**
     * Delete a submission.
     */
    public function deleteSubmission(string $formId, string $submissionId): JsonResponse
    {
        $submission = FormSubmission::where('contact_form_id', $formId)
            ->findOrFail($submissionId);

        $submission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Submission deleted successfully',
        ]);
    }
}
