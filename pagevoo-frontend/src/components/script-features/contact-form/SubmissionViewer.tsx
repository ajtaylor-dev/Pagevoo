import React, { useState, useEffect } from 'react'
import { contactFormService } from '@/services/contactFormService'
import type { FormSubmission } from '@/services/contactFormService'

interface SubmissionViewerProps {
  formId: number
  isOpen: boolean
  onClose: () => void
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({ formId, isOpen, onClose }) => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'archived' | 'spam'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadSubmissions()
    }
  }, [isOpen, formId, currentPage, statusFilter, searchQuery])

  const loadSubmissions = async () => {
    setLoading(true)
    try {
      const response = await contactFormService.getSubmissions(formId, {
        page: currentPage,
        per_page: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      })

      setSubmissions(response.data)
      setTotalPages(response.last_page)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (submissionId: number) => {
    try {
      await contactFormService.markSubmissionAsRead(formId, submissionId)
      await loadSubmissions()
    } catch (error) {
      console.error('Failed to mark as read:', error)
      alert('Failed to mark submission as read')
    }
  }

  const handleMarkAsSpam = async (submissionId: number) => {
    if (!confirm('Are you sure you want to mark this submission as spam?')) return

    try {
      await contactFormService.markSubmissionAsSpam(formId, submissionId)
      await loadSubmissions()
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Failed to mark as spam:', error)
      alert('Failed to mark submission as spam')
    }
  }

  const handleDelete = async (submissionId: number) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return

    try {
      await contactFormService.deleteSubmission(formId, submissionId)
      await loadSubmissions()
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error('Failed to delete submission:', error)
      alert('Failed to delete submission')
    }
  }

  const handleViewSubmission = async (submission: FormSubmission) => {
    setSelectedSubmission(submission)

    // Mark as read if it's new
    if (submission.status === 'new') {
      await handleMarkAsRead(submission.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-gray-100 text-gray-800',
      archived: 'bg-purple-100 text-purple-800',
      spam: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Form Submissions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#98b290]"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
            <option value="spam">Spam</option>
          </select>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Submissions List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No submissions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => handleViewSubmission(submission)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-gray-900">
                        {submission.data.name || 'Unknown'}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{submission.data.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">{formatDate(submission.created_at)}</p>
                    {submission.support_ticket && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          #{submission.support_ticket.ticket_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {submission.support_ticket.priority}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Submission Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedSubmission ? (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedSubmission.data.name || 'Unknown Submitter'}
                    </h3>
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusBadge(selectedSubmission.status)}`}>
                      {selectedSubmission.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedSubmission.data.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(selectedSubmission.created_at)}</p>
                </div>

                {/* Support Ticket Info */}
                {selectedSubmission.support_ticket && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-medium text-amber-900 mb-2">Support Ticket</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-amber-700">Ticket #:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.support_ticket.ticket_number}</span>
                      </div>
                      <div>
                        <span className="text-amber-700">Status:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.support_ticket.status}</span>
                      </div>
                      <div>
                        <span className="text-amber-700">Priority:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.support_ticket.priority}</span>
                      </div>
                      <div>
                        <span className="text-amber-700">Category:</span>
                        <span className="ml-2 font-medium">{selectedSubmission.support_ticket.category}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Data */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Submission Data</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedSubmission.data).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 pb-2">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedSubmission.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={`/storage/${attachment}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <span>📎</span>
                          <span>{attachment.split('/').pop()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Submission Info</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>IP Address: {selectedSubmission.ip_address}</p>
                    <p>User Agent: {selectedSubmission.user_agent || 'Unknown'}</p>
                    <p>Submitted: {formatDate(selectedSubmission.created_at)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedSubmission.status !== 'spam' && (
                    <button
                      onClick={() => handleMarkAsSpam(selectedSubmission.id)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100"
                    >
                      Mark as Spam
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedSubmission.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
