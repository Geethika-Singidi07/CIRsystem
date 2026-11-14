import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { createComplaint } from '../services/cirsService';
import {
  COMPLAINT_CATEGORIES,
  ComplaintCategory,
  FIELD_LIMITS,
} from '../types/cirs';
import {
  CompressedImageResult,
  compressImageForFirestore,
} from '../utils/imageCompressor';

export function SubmitComplaintPage() {
  const { user, userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Road & Potholes');
  const [communityName, setCommunityName] = useState(userProfile?.communityName || '');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [compressedImage, setCompressedImage] = useState<CompressedImageResult | null>(null);
  const [compressing, setCompressing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    id: string;
    referenceId: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (userProfile?.communityName && !communityName) {
      setCommunityName(userProfile.communityName);
    }
  }, [userProfile, communityName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setCompressing(true);
    try {
      const result = await compressImageForFirestore(file);
      setCompressedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected image.');
      setCompressedImage(null);
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const validateForm = (): string | null => {
    const cleanTitle = title.trim();
    const cleanCommunity = communityName.trim();
    const cleanLocation = location.trim();
    const cleanDesc = description.trim();
    const cleanUrl = imageUrl.trim();

    if (cleanTitle.length < FIELD_LIMITS.title.min || cleanTitle.length > FIELD_LIMITS.title.max) {
      return `Issue title must be between ${FIELD_LIMITS.title.min} and ${FIELD_LIMITS.title.max} characters.`;
    }
    if (
      cleanCommunity.length < FIELD_LIMITS.communityName.min ||
      cleanCommunity.length > FIELD_LIMITS.communityName.max
    ) {
      return `Community name must be between ${FIELD_LIMITS.communityName.min} and ${FIELD_LIMITS.communityName.max} characters.`;
    }
    if (
      cleanLocation.length < FIELD_LIMITS.location.min ||
      cleanLocation.length > FIELD_LIMITS.location.max
    ) {
      return `Location must be between ${FIELD_LIMITS.location.min} and ${FIELD_LIMITS.location.max} characters.`;
    }
    if (
      cleanDesc.length < FIELD_LIMITS.description.min ||
      cleanDesc.length > FIELD_LIMITS.description.max
    ) {
      return `Description must be between ${FIELD_LIMITS.description.min} and ${FIELD_LIMITS.description.max} characters.`;
    }
    if (cleanUrl) {
      if (cleanUrl.length > FIELD_LIMITS.imageUrl.max) {
        return `External image URL cannot exceed ${FIELD_LIMITS.imageUrl.max} characters.`;
      }
      if (!/^https?:\/\/.+/i.test(cleanUrl)) {
        return 'External image URL must begin with http:// or https://.';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    const validationErr = validateForm();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setSubmitting(true);
    try {
      const receipt = await createComplaint({
        citizenId: user.uid,
        citizenName: userProfile?.fullName || user.displayName || 'Civic Resident',
        citizenEmail: user.email || '',
        title,
        category,
        description,
        location,
        communityName,
        imageUrl,
        compressedImage,
      });
      setSubmittedReceipt(receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = async () => {
    if (!submittedReceipt) return;
    try {
      await navigator.clipboard.writeText(submittedReceipt.referenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  if (submittedReceipt) {
    return (
      <AppShell mode="citizen" breadcrumb="Submission Confirmed">
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-8 mt-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-civic-green mb-5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-civic-navy mb-2">
            Complaint Registered Successfully
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your report has been stored securely in Cloud Firestore with status{' '}
            <span className="font-semibold text-slate-900">Pending</span>. Use the reference ID
            below to track municipal updates.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-500 font-medium">Complaint Reference ID</p>
              <p className="text-xl font-mono font-bold text-civic-navy mt-0.5 tabular-nums">
                {submittedReceipt.referenceId}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyRef}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-civic-navy bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5 text-civic-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRef ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/complaints/${submittedReceipt.id}`}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-civic-royal hover:bg-civic-royal-hover rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              View Report Details
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Back to My Complaints
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell mode="citizen" breadcrumb="Submit Issue">
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-civic-navy tracking-tight">
            Report a Community Issue
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Provide accurate street details and an optional photo so municipal crews can inspect
            and resolve the issue quickly.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-red-900">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="title" className="text-xs font-semibold text-slate-700">
                Issue Title
              </label>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {title.trim().length}/{FIELD_LIMITS.title.max}
              </span>
            </div>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={FIELD_LIMITS.title.max}
              placeholder="Deep pothole near Elm St & 4th Ave crosswalk"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issue Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="communityName"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Community / Ward Name
              </label>
              <input
                id="communityName"
                type="text"
                required
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                maxLength={FIELD_LIMITS.communityName.max}
                placeholder="Oakridge Ward 4"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Exact Street Address or Landmark
            </label>
            <input
              id="location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={FIELD_LIMITS.location.max}
              placeholder="412 Elm Street, opposite Northside Elementary"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-slate-700">
                Detailed Description
              </label>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {description.trim().length}/{FIELD_LIMITS.description.max}
              </span>
            </div>
            <textarea
              id="description"
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={FIELD_LIMITS.description.max}
              placeholder="Describe the severity, approximate size, safety impact, and how long the issue has been present..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
            />
          </div>

          {/* Optional Image Upload (Free-tier Canvas compression) */}
          <div className="pt-2 border-t border-slate-200 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Optional Evidence Photo
              </p>
              <p className="text-xs text-slate-500">
                Uploaded photos are automatically resized and compressed in your browser so
                uploads stay 100% free on the Firebase Spark tier without requiring paid Cloud
                Storage billing.
              </p>
            </div>

            {!compressedImage ? (
              <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                <UploadCloud className="w-7 h-7 text-civic-royal mb-2" aria-hidden="true" />
                <span className="text-sm font-semibold text-civic-navy">
                  {compressing ? 'Compressing image...' : 'Choose a photo to upload'}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  JPEG, PNG, or WebP (compressed automatically under 250 KB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={compressing}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img
                  src={compressedImage.dataUrl}
                  alt="Compressed issue preview"
                  className="w-28 h-20 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-civic-navy truncate">
                    {compressedImage.fileName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {compressedImage.width}x{compressedImage.height}px ·{' '}
                    {Math.round(compressedImage.sizeBytes / 1024)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCompressedImage(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="imageUrl"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5"
              >
                <ImagePlus className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <span>Or paste an external image link (optional)</span>
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                maxLength={FIELD_LIMITS.imageUrl.max}
                placeholder="https://example.com/street-issue-photo.jpg"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-royal focus:border-civic-royal"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <Link
              to="/dashboard"
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || compressing}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-civic-green hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {submitting ? 'Submitting Report...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
