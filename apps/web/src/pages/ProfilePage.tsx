import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateUserConsent, deleteAllJobs } = useApp();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  const handleConfirmDeleteAll = () => {
    deleteAllJobs();
    setDeleteModalOpen(false);
    setDeletedSuccess(true);
    setTimeout(() => setDeletedSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-1 border-b border-canvas-dark/60 pb-6">
        <Badge variant="secondary" className="text-xs uppercase tracking-wider mb-1">
          Account & Privacy
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
          Profile & Data Governance
        </h1>
        <p className="text-sm text-charcoal-muted font-light">
          Manage your personal details, AI image processing consent, and data retention settings.
        </p>
      </div>

      {deletedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All your uploaded images, generated try-on previews, and history records have been permanently purged.</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-canvas-dark/60 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-canvas-subtle">
          <div className="w-14 h-14 rounded-2xl bg-charcoal text-canvas flex items-center justify-center font-serif text-2xl font-bold">
            {currentUser?.name.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="font-serif text-xl font-medium text-charcoal">
              {currentUser?.name || 'Guest User'}
            </h2>
            <p className="text-xs text-charcoal-muted">{currentUser?.email || 'guest@vestiai.demo'}</p>
            <div className="pt-1">
              <Badge variant={currentUser?.role === 'admin' ? 'accent' : 'secondary'}>
                {currentUser?.role === 'admin' ? 'Administrator' : 'Standard Shopper'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Consent Management */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif text-base font-medium text-charcoal flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AI Image Processing Consent</span>
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed font-light max-w-xl">
                When enabled, VestiAI is permitted to temporarily pass your uploaded photograph to our 2D diffusion worker to synthesize garment draping.
              </p>
            </div>

            <button
              onClick={() => updateUserConsent(!currentUser?.consentGiven)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                currentUser?.consentGiven ? 'bg-accent' : 'bg-canvas-dark'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  currentUser?.consentGiven ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data Subject Rights & Permanent Deletion Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-sm space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-base font-medium text-red-700 flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Right to Erasure (Permanent Deletion)</span>
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed font-light">
            You retain absolute sovereignty over your uploaded photographs and generated try-on previews. Requesting data deletion immediately removes all image buffers from private storage and drops associated job records.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          className="text-xs"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          <span>Purge All My Images & Try-On History</span>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Permanent Deletion"
        description="Are you sure you want to permanently erase all your uploaded portraits and generated try-on previews? This action cannot be reversed."
      >
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmDeleteAll}>
            Yes, Permanently Purge Data
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
