import { useState, useEffect, useRef } from 'react';
import type { Intake } from '../lib/types';
import { updateIntakeDetails } from '../lib/intakeService';

interface EditIntakeModalProps {
  open: boolean;
  onClose: () => void;
  intake: Intake;
  onSaved: (updated: Intake) => void;
}

export default function EditIntakeModal({
  open,
  onClose,
  intake,
  onSaved,
}: EditIntakeModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const [brokerName, setBrokerName] = useState(intake.broker_name);
  const [firstName, setFirstName] = useState(intake.client_first_name);
  const [lastName, setLastName] = useState(intake.client_last_name);
  const [email, setEmail] = useState(intake.client_email ?? '');
  const [phone, setPhone] = useState(intake.client_phone ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Re-sync fields when intake changes or modal opens
  useEffect(() => {
    if (open) {
      setBrokerName(intake.broker_name);
      setFirstName(intake.client_first_name);
      setLastName(intake.client_last_name);
      setEmail(intake.client_email ?? '');
      setPhone(intake.client_phone ?? '');
      setError(null);
      setValidationErrors({});
    }
  }, [open, intake]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateIntakeDetails(intake.id, {
        broker_name: brokerName.trim(),
        client_first_name: firstName.trim(),
        client_last_name: lastName.trim(),
        client_email: email.trim() || undefined,
        client_phone: phone.trim() || undefined,
      });
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="relative flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-base font-semibold text-slate-900">Edit Intake Details</h3>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="edit-broker" className="block text-sm font-medium text-slate-700">
              Broker Name
            </label>
            <input
              id="edit-broker"
              type="text"
              value={brokerName}
              onChange={(e) => setBrokerName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-first-name" className="block text-sm font-medium text-slate-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-first-name"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (validationErrors.firstName) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.firstName;
                      return next;
                    });
                  }
                }}
                className={`mt-1 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  validationErrors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {validationErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-last-name" className="block text-sm font-medium text-slate-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-last-name"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (validationErrors.lastName) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.lastName;
                      return next;
                    });
                  }
                }}
                className={`mt-1 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  validationErrors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
              />
              {validationErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label htmlFor="edit-phone" className="block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
