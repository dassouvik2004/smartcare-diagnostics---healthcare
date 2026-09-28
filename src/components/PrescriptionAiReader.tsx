import React, { useState } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckSquare,
  Square,
  RefreshCw,
  ArrowRight,
  Eye,
  Plus,
} from 'lucide-react';
import { APP_IMAGES } from '../assets/imageRegistry';
import type {
  DiagnosticTest,
  PrescriptionAnalysisResult,
  User,
  Booking,
  CollectionMode,
} from '../types';

interface PrescriptionAiReaderProps {
  tests: DiagnosticTest[];
  currentUser: User;
  onBookingCreated: (booking: Booking) => void;
}

export const PrescriptionAiReader: React.FC<PrescriptionAiReaderProps> = ({
  tests,
  currentUser,
  onBookingCreated,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(APP_IMAGES.samplePrescriptionRx);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [customNotes, setCustomNotes] = useState<string>(
    'Rx: 1. CBC (Complete Blood Count) 2. Thyroid Profile (TSH) 3. HbA1c 4. Fasting Lipid Profile'
  );
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<PrescriptionAnalysisResult | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [collectionMode, setCollectionMode] = useState<CollectionMode>('HOME_COLLECTION');
  const [appointmentDate, setAppointmentDate] = useState<string>('2026-09-27');
  const [appointmentTime, setAppointmentTime] = useState<string>('08:30 AM');
  const [address, setAddress] = useState<string>(
    currentUser.address || 'House 42, Road 9A, Dhanmondi, Dhaka-1209'
  );
  const [submittingBooking, setSubmittingBooking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setPreviewUrl(resultStr);
      setImageBase64(resultStr);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const loadSamplePrescription = async () => {
    setPreviewUrl(APP_IMAGES.samplePrescriptionRx);
    setCustomNotes(
      'Rx: 1. CBC (Complete Blood Count) 2. Thyroid Profile (TSH) 3. HbA1c 4. Fasting Lipid Profile'
    );
    try {
      const res = await fetch(APP_IMAGES.samplePrescriptionRx);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setMimeType(blob.type || 'image/jpeg');
      };
      reader.readAsDataURL(blob);
    } catch {
      setImageBase64(null);
    }
  };

  const handleAnalyzePrescription = async () => {
    setAnalyzing(true);
    setErrorMessage(null);
    try {
      let base64ToSend = imageBase64;
      if (!base64ToSend && previewUrl === APP_IMAGES.samplePrescriptionRx) {
        try {
          const imgRes = await fetch(APP_IMAGES.samplePrescriptionRx);
          const blob = await imgRes.blob();
          base64ToSend = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result as string);
            r.readAsDataURL(blob);
          });
        } catch {
          base64ToSend = null;
        }
      }

      const response = await fetch('/api/prescription/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64ToSend,
          mimeType,
          prescriptionText: customNotes,
        }),
      });

      const data: PrescriptionAnalysisResult = await response.json();
      setAnalysisResult(data);

      const matchedIds = data.detectedTests
        .map((dt) => dt.matchedTestId)
        .filter((id): id is string => Boolean(id));
      setSelectedTestIds(Array.from(new Set(matchedIds)));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to analyze prescription');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleTestSelection = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const selectedTestObjects = tests.filter((t) => selectedTestIds.includes(t.id));
  const homeCollectionFee = collectionMode === 'HOME_COLLECTION' ? 200 : 0;
  const totalAmount =
    selectedTestObjects.reduce((sum, t) => sum + t.price, 0) +
    (selectedTestObjects.length > 0 ? homeCollectionFee : 0);

  const handleBookSelectedTests = async () => {
    if (selectedTestObjects.length === 0) return;
    setSubmittingBooking(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.id,
          patientName: currentUser.name,
          patientPhone: currentUser.phone,
          patientAge: currentUser.age || 34,
          bookingType: 'DIAGNOSTIC_TEST',
          testIds: selectedTestObjects.map((t) => t.id),
          testNames: selectedTestObjects.map((t) => t.name),
          collectionMode,
          address:
            collectionMode === 'HOME_COLLECTION'
              ? address
              : 'SmartCare Central Diagnostic Lab, Panthapath, Dhaka',
          appointmentDate,
          appointmentTime,
          amount: totalAmount,
          clinicalNotes: `Booked via AI Prescription Reader. ${analysisResult?.clinicalNotes || ''}`,
        }),
      });

      const newBooking = await response.json();
      if (response.ok) {
        onBookingCreated(newBooking);
      }
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Medical AI Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-950">
            AI-extracted information. Please verify with your doctor before booking.
          </p>
          <p className="text-xs text-amber-800">
            Handwritten medical prescriptions can contain ambiguous abbreviations. Review all matched diagnostic tests below before confirming your lab order.
          </p>
        </div>
      </div>

      {/* Main 2-Column OCR Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Prescription Upload & Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">1. Upload Doctor Prescription</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload a photo of your handwritten prescription or test with our clinical sample
              </p>
            </div>
            <button
              type="button"
              onClick={loadSamplePrescription}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 underline cursor-pointer whitespace-nowrap"
            >
              Reset Sample Rx
            </button>
          </div>

          {/* Image Preview Box with Zero-Broken-Image Resilience */}
          <div className="relative rounded-lg border border-slate-200 bg-slate-100 overflow-hidden aspect-3/4 max-h-80 mx-auto flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Doctor prescription for AI OCR analysis"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <span>No prescription image selected</span>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span>Prescription Image</span>
            </div>
          </div>

          {/* Upload Input */}
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 border-dashed rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Upload Prescription Photo (JPG/PNG)</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Optional Shorthand / OCR Hint Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Handwritten Shorthand / Additional Clinical Text (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Rx: CBC, TSH, HbA1c, Lipid Profile, ECG..."
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>

          <button
            type="button"
            onClick={handleAnalyzePrescription}
            disabled={analyzing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running AI OCR & Matching Test Database...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Extract & Match Diagnostic Tests</span>
              </>
            )}
          </button>

          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Right Column: Extracted Handwriting, Database Matching & Direct Booking (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                2. Detected Tests & Database Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify extracted tests matched against SmartCare Reference Catalog before booking
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {selectedTestObjects.length} selected
            </span>
          </div>

          {!analysisResult ? (
            <div className="py-12 text-center space-y-3 bg-slate-50 rounded-lg border border-slate-200/80 p-6">
              <FileText className="w-10 h-10 text-teal-600 mx-auto stroke-[1.5]" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Ready to Extract Handwritten Prescription
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click <strong>&ldquo;Extract &amp; Match Diagnostic Tests&rdquo;</strong> on the left to run OCR handwriting recognition and automatically match tests like CBC, TSH, HbA1c, and Lipid Profile with our database.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnalyzePrescription}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Analyze Sample Prescription Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* OCR Transcription Box */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Prescribing Physician: <strong className="text-slate-800">{analysisResult.doctorName}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Date: {analysisResult.date}</span>
                </div>
                <div className="text-xs font-mono text-slate-800 bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">
                  {analysisResult.rawHandwritingText}
                </div>
                <p className="text-xs text-teal-800 font-medium">
                  Clinical Preparation Note: {analysisResult.clinicalNotes}
                </p>
              </div>

              {/* Detected & Matched Tests List */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-slate-700">
                  Matched Diagnostic Tests (Click to Verify / Toggle):
                </div>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  {analysisResult.detectedTests.map((dt, index) => {
                    const isChecked = dt.matchedTestId ? selectedTestIds.includes(dt.matchedTestId) : false;
                    return (
                      <div
                        key={index}
                        onClick={() => dt.matchedTestId && toggleTestSelection(dt.matchedTestId)}
                        className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-50/40' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                {dt.matchedTestName || dt.extractedName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              <span>Written on Rx: &ldquo;{dt.extractedName}&rdquo;</span>
                              <span aria-hidden="true"> · </span>
                              <span className="font-mono tabular-nums">Code: {dt.matchedTestCode || 'N/A'}</span>
                              <span aria-hidden="true"> · </span>
                              <span>Match Confidence: {dt.confidence}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <span className="text-sm font-semibold text-slate-900">
                            BDT {(dt.price || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Manual Add Additional Test from Catalog */}
              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Need to add another test from the prescription manually?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {tests
                    .filter((t) => !selectedTestIds.includes(t.id))
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTestSelection(t.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-teal-600" />
                        <span>{t.name.split(' (')[0]}</span>
                        <span className="font-mono tabular-nums text-slate-500">({t.price})</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Collection Mode & Schedule */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sample Collection</label>
                    <select
                      value={collectionMode}
                      onChange={(e) => setCollectionMode(e.target.value as CollectionMode)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    >
                      <option value="HOME_COLLECTION">Home Blood Collection (+BDT 200)</option>
                      <option value="CENTRE_VISIT">Diagnostic Centre Visit (Free)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    >
                      <option value="07:30 AM">07:30 AM (Fasting)</option>
                      <option value="08:30 AM">08:30 AM (Fasting)</option>
                      <option value="09:30 AM">09:30 AM (Fasting)</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>
                </div>

                {collectionMode === 'HOME_COLLECTION' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Home Sample Collection Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    />
                  </div>
                )}

                {/* Reminder of AI Verification before checkout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500">
                      Total Payable ({selectedTestObjects.length} Tests
                      {collectionMode === 'HOME_COLLECTION' ? ' + Home Collection' : ''})
                    </div>
                    <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                      BDT {totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={selectedTestObjects.length === 0 || submittingBooking}
                    onClick={handleBookSelectedTests}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    {submittingBooking ? 'Creating Booking...' : 'Book Selected Tests'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
