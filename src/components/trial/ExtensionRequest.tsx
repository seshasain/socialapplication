import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';

const EXTENSION_REASONS = [
  'Need more time to evaluate features',
  'Waiting for team approval',
  'Technical setup in progress',
  'Other'
];

export default function ExtensionRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    reason: '',
    customReason: '',
    requestedDays: 7,
    additionalNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // TODO: Implement API call to submit extension request
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      navigate('/dashboard', { 
        replace: true,
        state: { message: 'Extension request submitted successfully' }
      });
    } catch (err) {
      setError('Failed to submit extension request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Request Trial Extension
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Extension
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select a reason</option>
              {EXTENSION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason */}
          {formData.reason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify
              </label>
              <input
                type="text"
                value={formData.customReason}
                onChange={(e) =>
                  setFormData({ ...formData, customReason: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>
          )}

          {/* Requested Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Days Requested
            </label>
            <select
              value={formData.requestedDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requestedDays: parseInt(e.target.value)
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Any additional context that might help us evaluate your request..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Note:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Extension requests are typically reviewed within 24 hours</li>
          <li>You can also earn additional trial days by inviting friends</li>
          <li>Only one extension request can be active at a time</li>
        </ul>
      </div>
    </div>
  );
} 