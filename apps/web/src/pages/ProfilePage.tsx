import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useCart } from '../context/CartContext';
import { ApiError } from '../services/api';
import { ShieldCheck, Trash2, CheckCircle2, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateUserConsent, updateProfileName, deleteAllJobs } = useApp();
  const { orders, fetchOrders } = useCart();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setIsSavingProfile(true);
    setProfileStatus(null);
    try {
      await updateProfileName(fullName.trim());
      setProfileStatus('Profile updated.');
    } catch (err) {
      setProfileStatus(err instanceof ApiError ? err.message : 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    await deleteAllJobs();
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

        {/* Profile Update Form */}
        {currentUser && (
          <form onSubmit={handleSaveProfile} className="pb-6 border-b border-canvas-subtle flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <Input
                id="fullName"
                label="Display Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <Button type="submit" variant="secondary" size="md" isLoading={isSavingProfile}>
              Save Profile
            </Button>
            {profileStatus && (
              <span className="text-xs text-emerald-700 font-medium">{profileStatus}</span>
            )}
          </form>
        )}

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

      {/* Orders History Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-canvas-dark shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-canvas-dark pb-4">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-accent" />
            <h3 className="font-serif text-lg font-medium text-charcoal">Order History & Receipts</h3>
          </div>
          <span className="text-xs text-charcoal-light font-mono">{orders.length} order(s) placed</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-charcoal-muted font-light py-4 text-center">
            No purchase orders found on your account. Items purchased through the shopping bag will appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 rounded-xl border border-canvas-dark/80 bg-canvas-subtle/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-charcoal">Order #{ord.id.slice(0, 8)}</span>
                    <span className="text-charcoal-light ml-2">{new Date(ord.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {ord.orderStatus}
                    </span>
                    <span className="font-mono font-bold text-charcoal">${ord.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="divide-y divide-canvas-dark/40 pt-1">
                  {ord.items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImageUrl || '/placeholder.png'}
                          alt={item.productTitle}
                          className="w-10 h-12 object-cover rounded bg-canvas-subtle border border-canvas-dark"
                        />
                        <div>
                          <p className="font-medium text-charcoal">{item.productTitle}</p>
                          <p className="text-[11px] text-charcoal-light">
                            Size: {item.selectedSize} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-charcoal font-medium">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
