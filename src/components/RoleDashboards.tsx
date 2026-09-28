import React, { useState } from 'react';
import {
  User as UserIcon,
  Calendar,
  FlaskConical,
  Home,
  FileText,
  CreditCard,
  FileCheck2,
  Bell,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Lock,
  Upload,
  Eye,
  ArrowRight,
} from 'lucide-react';
import type {
  User,
  Doctor,
  DiagnosticTest,
  HomeService,
  Booking,
  Payment,
  MedicalReport,
  Prescription,
  NotificationItem,
  BookingStatus,
} from '../types';
import { PrescriptionAiReader } from './PrescriptionAiReader';

const LIFECYCLE_STEPS: BookingStatus[] = [
  'Booking Created',
  'Payment Completed',
  'Confirmed',
  'Sample Collected / Appointment Done',
  'Processing',
  'Completed',
  'Report Available',
];

interface RoleDashboardsProps {
  currentUser: User;
  doctors: Doctor[];
  tests: DiagnosticTest[];
  homeServices: HomeService[];
  bookings: Booking[];
  payments: Payment[];
  reports: MedicalReport[];
  prescriptions: Prescription[];
  notifications: NotificationItem[];
  patients: User[];
  onOpenPayment: (booking: Booking) => void;
  onOpenReport: (report: MedicalReport) => void;
  onRefreshData: () => Promise<void>;
}

export const RoleDashboards: React.FC<RoleDashboardsProps> = ({
  currentUser,
  doctors,
  tests,
  homeServices,
  bookings,
  payments,
  reports,
  prescriptions,
  notifications,
  patients,
  onOpenPayment,
  onOpenReport,
  onRefreshData,
}) => {
  // Patient Dashboard Active Tab
  const [patientTab, setPatientTab] = useState<
    | 'OVERVIEW'
    | 'PROFILE'
    | 'DOCTORS'
    | 'TESTS'
    | 'HOME_SERVICES'
    | 'AI_RX'
    | 'PAYMENTS'
    | 'REPORTS'
    | 'NOTIFICATIONS'
  >('OVERVIEW');

  // Doctor Dashboard Active Tab
  const [doctorTab, setDoctorTab] = useState<
    'TODAY' | 'UPCOMING' | 'AVAILABILITY' | 'PATIENTS' | 'PRESCRIPTION' | 'PROFILE'
  >('TODAY');

  // Admin Dashboard Active Tab
  const [adminTab, setAdminTab] = useState<
    | 'OVERVIEW'
    | 'BOOKINGS'
    | 'REPORTS'
    | 'DOCTORS'
    | 'TESTS'
    | 'HOME_SERVICES'
    | 'PATIENTS'
    | 'PAYMENTS'
    | 'NOTIFICATIONS'
  >('OVERVIEW');

  // Booking ID Tracker Lookup
  const [trackedBookingId, setTrackedBookingId] = useState<string>('DIAG-2026-00025');
  const [secureReportQuery, setSecureReportQuery] = useState<string>('DIAG-2026-00025');
  const [secureLookupError, setSecureLookupError] = useState<string | null>(null);

  // Doctor Prescription Form State
  const [rxPatientId, setRxPatientId] = useState<string>(patients[0]?.id || 'PAT-1001');
  const [rxDiagnosis, setRxDiagnosis] = useState<string>('Type 2 Diabetes Mellitus & Hypertension Evaluation');
  const [rxMedications, setRxMedications] = useState<string>(
    'Tab. Metformin 500mg — 0+1+1 (After Meal)\nTab. Losartan Potassium 50mg — 1+0+0'
  );
  const [rxSelectedTests, setRxSelectedTests] = useState<string[]>([
    'CBC (Complete Blood Count with ESR)',
    'HbA1c (Glycosylated Hemoglobin)',
    'Lipid Profile (Complete Fasting Panel)',
  ]);
  const [rxNotes, setRxNotes] = useState<string>('10-12 hours overnight fasting required. Review with reports in 7 days.');
  const [rxSavedMsg, setRxSavedMsg] = useState<string | null>(null);

  // Admin Upload Report Form State
  const [reportBookingId, setReportBookingId] = useState<string>(
    bookings.find((b) => b.bookingType !== 'DOCTOR_APPOINTMENT')?.id || bookings[0]?.id || 'DIAG-2026-00002'
  );
  const [reportRemarks, setReportRemarks] = useState<string>(
    'Automated analyzer parameters verified by Senior Clinical Pathologist. Correlate clinically.'
  );
  const [uploadingReport, setUploadingReport] = useState<boolean>(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // Admin Add Doctor State
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('');
  const [newDocQual, setNewDocQual] = useState('MBBS, FCPS, MD');
  const [newDocFee, setNewDocFee] = useState('1200');

  // Admin Add Test State
  const [newTestName, setNewTestName] = useState('');
  const [newTestCode, setNewTestCode] = useState('');
  const [newTestCat, setNewTestCat] = useState('Biochemistry');
  const [newTestPrice, setNewTestPrice] = useState('800');

  // Admin Add Home Service State
  const [newHsName, setNewHsName] = useState('');
  const [newHsCategory, setNewHsCategory] = useState<'BLOOD_COLLECTION' | 'HOME_ECG' | 'HOME_DRESSING'>('BLOOD_COLLECTION');
  const [newHsPrice, setNewHsPrice] = useState('600');

  // Secure Report Lookup Handler
  const handleSecureReportLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecureLookupError(null);
    try {
      const res = await fetch(
        `/api/reports/${encodeURIComponent(secureReportQuery.trim())}?patientId=${currentUser.id}&role=${currentUser.role}`
      );
      const data = await res.json();
      if (!res.ok) {
        setSecureLookupError(data.error || 'Report not found');
        return;
      }
      onOpenReport(data);
    } catch {
      setSecureLookupError('Unable to verify report ownership.');
    }
  };

  // Admin Update Booking Status
  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await onRefreshData();
  };

  // Admin Upload Lab Report
  const handleAdminUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingReport(true);
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reportBookingId,
          remarks: reportRemarks,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback(`Report ${data.report.id} linked to Booking ${reportBookingId} and published to Patient Dashboard.`);
        await onRefreshData();
      }
    } finally {
      setUploadingReport(false);
    }
  };

  // Doctor Toggle Slot
  const handleToggleDoctorSlot = async (doc: Doctor, slotId: string) => {
    const updatedSlots = doc.slots.map((s) =>
      s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s
    );
    await fetch(`/api/doctors/${doc.id}/slots`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: updatedSlots }),
    });
    await onRefreshData();
  };

  // Doctor Submit Prescription
  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatient = patients.find((p) => p.id === rxPatientId) || patients[0];
    const res = await fetch('/api/prescription/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: targetPatient?.id || 'PAT-1001',
        patientName: targetPatient?.name || 'Arifur Rahman',
        doctorId: currentUser.doctorId || 'DOC-01',
        doctorName: currentUser.name,
        diagnosis: rxDiagnosis,
        medications: rxMedications.split('\n').filter(Boolean),
        recommendedTests: rxSelectedTests,
        notes: rxNotes,
      }),
    });
    if (res.ok) {
      setRxSavedMsg('Digital Prescription uploaded and linked to patient record.');
      await onRefreshData();
      setTimeout(() => setRxSavedMsg(null), 4000);
    }
  };

  // Admin Create Doctor
  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpec) return;
    await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newDocName,
        specialization: newDocSpec,
        qualification: newDocQual,
        consultationFee: Number(newDocFee),
      }),
    });
    setNewDocName('');
    setNewDocSpec('');
    await onRefreshData();
  };

  // Admin Create Test
  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName || !newTestPrice) return;
    await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTestName,
        code: newTestCode || `TST-${tests.length + 1}`,
        category: newTestCat,
        price: Number(newTestPrice),
      }),
    });
    setNewTestName('');
    setNewTestCode('');
    await onRefreshData();
  };

  // Admin Create Home Service
  const handleAddHomeService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHsName || !newHsPrice) return;
    await fetch('/api/home-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newHsName,
        category: newHsCategory,
        price: Number(newHsPrice),
      }),
    });
    setNewHsName('');
    await onRefreshData();
  };

  // ============================================================================
  // 10. PATIENT DASHBOARD VIEW
  // ============================================================================
  if (currentUser.role === 'PATIENT') {
    const myBookings = bookings.filter((b) => b.patientId === currentUser.id);
    const myDoctorBookings = myBookings.filter((b) => b.bookingType === 'DOCTOR_APPOINTMENT');
    const myTestBookings = myBookings.filter((b) => b.bookingType === 'DIAGNOSTIC_TEST');
    const myHomeBookings = myBookings.filter((b) => b.bookingType === 'HOME_SERVICE');
    const myPayments = payments.filter((p) => p.patientId === currentUser.id);
    const myReports = reports.filter((r) => r.patientId === currentUser.id);
    const myPrescriptions = prescriptions.filter((rx) => rx.patientId === currentUser.id);
    const myNotifications = notifications.filter((n) => n.userId === currentUser.id);

    const trackedBooking =
      myBookings.find((b) => b.id.toUpperCase() === trackedBookingId.toUpperCase()) || myBookings[0];
    const currentStepIdx = trackedBooking
      ? LIFECYCLE_STEPS.indexOf(trackedBooking.status)
      : 0;

    const navItems = [
      { id: 'OVERVIEW', label: 'Overview & Tracker', icon: Clock },
      { id: 'PROFILE', label: 'My Profile', icon: UserIcon },
      { id: 'DOCTORS', label: `Doctor Appointments (${myDoctorBookings.length})`, icon: Calendar },
      { id: 'TESTS', label: `Test Bookings (${myTestBookings.length})`, icon: FlaskConical },
      { id: 'HOME_SERVICES', label: `Home Service Bookings (${myHomeBookings.length})`, icon: Home },
      { id: 'AI_RX', label: 'AI Prescription', icon: FileText },
      { id: 'PAYMENTS', label: `Payments (${myPayments.length})`, icon: CreditCard },
      { id: 'REPORTS', label: `Reports (${myReports.length})`, icon: FileCheck2 },
      { id: 'NOTIFICATIONS', label: `Notifications (${myNotifications.length})`, icon: Bell },
    ] as const;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <div className="text-xs text-slate-500">Authenticated Patient Portal</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">{currentUser.name}</div>
            <div className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
              ID: {currentUser.id} · Blood: {currentUser.bloodGroup || 'O+'}
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = patientTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPatientTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                    active
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {patientTab === 'OVERVIEW' && (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Active Bookings</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                    {myBookings.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Unique DIAG-2026 IDs</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Verified Reports</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-teal-700 mt-1">
                    {myReports.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Ready for PDF Download</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Doctor Prescriptions</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                    {myPrescriptions.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">AI OCR Compatible</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs text-slate-500">Total Paid</div>
                  <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                    BDT {myPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{myPayments.length} Transactions</div>
                </div>
              </div>

              {/* Section 8: Booking ID Lifecycle Tracker */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Booking ID Lifecycle Tracker
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track any booking from creation and payment through sample processing and online report release
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={trackedBooking?.id || ''}
                      onChange={(e) => setTrackedBookingId(e.target.value)}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    >
                      {myBookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id} — {b.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {trackedBooking && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-slate-500">Booking Reference</span>
                        <div className="text-sm font-mono font-semibold text-teal-700">
                          {trackedBooking.id}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-slate-500">Service / Investigation</span>
                        <div className="font-semibold text-slate-900">
                          {trackedBooking.doctorName ||
                            trackedBooking.testNames?.join(', ') ||
                            trackedBooking.homeServiceName}
                        </div>
                      </div>
                      <div className="space-y-0.5 font-mono tabular-nums">
                        <span className="text-slate-500 font-sans">Date & Time</span>
                        <div className="text-slate-900">
                          {trackedBooking.appointmentDate} · {trackedBooking.appointmentTime}
                        </div>
                      </div>
                      <div className="space-y-0.5 font-mono tabular-nums">
                        <span className="text-slate-500 font-sans">Payment Status</span>
                        <div className="font-semibold text-emerald-700">
                          {trackedBooking.paymentStatus} (BDT {trackedBooking.amount})
                        </div>
                      </div>
                    </div>

                    {/* 7-Stage Progress Stepper */}
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                      {LIFECYCLE_STEPS.map((step, index) => {
                        const completed = index <= currentStepIdx;
                        const isCurrent = index === currentStepIdx;
                        return (
                          <div
                            key={step}
                            className={`p-3 rounded-lg border text-xs transition-colors ${
                              isCurrent
                                ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold'
                                : completed
                                ? 'bg-white border-emerald-200 text-slate-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-[11px]">0{index + 1}</span>
                              {completed && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                            </div>
                            <div className="leading-snug text-[11px]">{step}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {patientTab === 'PROFILE' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                My Patient Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Full Name</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">{currentUser.name}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Patient ID</div>
                  <div className="text-sm font-mono font-semibold text-teal-700 mt-0.5">{currentUser.id}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Email Address</div>
                  <div className="text-sm text-slate-900 mt-0.5">{currentUser.email}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Phone Number</div>
                  <div className="text-sm font-mono text-slate-900 mt-0.5">{currentUser.phone}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Demographics & Blood Group</div>
                  <div className="text-sm text-slate-900 mt-0.5">
                    {currentUser.age || 34} Years · {currentUser.gender || 'Male'} · Blood Group {currentUser.bloodGroup || 'O+'}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Default Home Collection Address</div>
                  <div className="text-sm text-slate-900 mt-0.5">{currentUser.address}</div>
                </div>
              </div>
            </div>
          )}

          {(patientTab === 'DOCTORS' || patientTab === 'TESTS' || patientTab === 'HOME_SERVICES') && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                {patientTab === 'DOCTORS'
                  ? 'My Doctor Appointments'
                  : patientTab === 'TESTS'
                  ? 'My Diagnostic Test Bookings'
                  : 'My Home Healthcare Bookings'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Details</th>
                      <th className="py-2.5 px-3">Schedule & Mode</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Lifecycle Stage</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(patientTab === 'DOCTORS'
                      ? myDoctorBookings
                      : patientTab === 'TESTS'
                      ? myTestBookings
                      : myHomeBookings
                    ).map((b) => {
                      const linkedReport = reports.find((r) => r.bookingId === b.id);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-mono tabular-nums font-semibold text-teal-700">
                            {b.id}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-900">
                            {b.doctorName || b.testNames?.join(', ') || b.homeServiceName}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-slate-600">
                            {b.appointmentDate} · {b.appointmentTime}
                            {b.collectionMode && (
                              <span className="block font-sans text-[11px] text-slate-500">
                                {b.collectionMode === 'HOME_COLLECTION' ? 'Home Collection' : 'Centre Visit'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                            BDT {b.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-slate-700">{b.status}</td>
                          <td className="py-3 px-3 text-right">
                            {b.paymentStatus !== 'SUCCESS' ? (
                              <button
                                onClick={() => onOpenPayment(b)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md cursor-pointer"
                              >
                                Pay Now
                              </button>
                            ) : linkedReport ? (
                              <button
                                onClick={() => onOpenReport(linkedReport)}
                                className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md cursor-pointer"
                              >
                                View Report
                              </button>
                            ) : (
                              <span className="text-slate-400 font-mono">Confirmed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {patientTab === 'AI_RX' && (
            <div className="space-y-6">
              <PrescriptionAiReader
                tests={tests}
                currentUser={currentUser}
                onBookingCreated={(newBooking) => {
                  onRefreshData();
                  onOpenPayment(newBooking);
                }}
              />
              {/* Doctor Issued Digital Prescriptions */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                  Doctor-Uploaded Digital Prescriptions ({myPrescriptions.length})
                </h3>
                <div className="space-y-3">
                  {myPrescriptions.map((rx) => (
                    <div key={rx.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {rx.doctorName} · <span className="font-mono text-teal-700">{rx.id}</span>
                        </span>
                        <span className="font-mono text-slate-500">Date: {rx.date}</span>
                      </div>
                      <div className="text-slate-700">
                        <strong>Diagnosis:</strong> {rx.diagnosis}
                      </div>
                      <div className="text-slate-700">
                        <strong>Recommended Tests:</strong> {rx.recommendedTests.join(' · ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {patientTab === 'PAYMENTS' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                My Payment Records
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Payment ID</th>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {myPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-3 font-semibold text-slate-900">{p.id}</td>
                        <td className="py-3 px-3 text-teal-700">{p.bookingId}</td>
                        <td className="py-3 px-3 text-slate-600">{p.transactionId}</td>
                        <td className="py-3 px-3 font-sans text-slate-700">{p.paymentMethod}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900">
                          BDT {p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-emerald-700 font-semibold">{p.paymentStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {patientTab === 'REPORTS' && (
            <div className="space-y-6">
              {/* Authenticated Report Security Verification Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal-600" />
                      <span>Authenticated Online Report Retrieval</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Reports are strictly bound to Patient Authentication. Entering another patient&apos;s Booking ID will be blocked.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSecureReportLookup} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={secureReportQuery}
                    onChange={(e) => setSecureReportQuery(e.target.value)}
                    placeholder="Enter Booking ID (e.g. DIAG-2026-00025)"
                    className="flex-1 px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Verify Auth & Open Report
                  </button>
                </form>
                {secureLookupError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    {secureLookupError}
                  </p>
                )}
              </div>

              {/* My Verified Reports List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                  My Available Pathology Reports ({myReports.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5 text-xs font-mono tabular-nums">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Booking ID :</span>
                          <span className="font-semibold text-slate-900">{rep.bookingId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Report ID  :</span>
                          <span className="font-semibold text-teal-700">{rep.id}</span>
                        </div>
                        <div className="flex justify-between font-sans">
                          <span className="text-slate-500 font-mono">Patient    :</span>
                          <span className="font-medium text-slate-900">{rep.patientName}</span>
                        </div>
                        <div className="flex justify-between font-sans">
                          <span className="text-slate-500 font-mono">Test       :</span>
                          <span className="font-semibold text-slate-900">{rep.testName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Date       :</span>
                          <span className="text-slate-800">{rep.reportDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Status     :</span>
                          <span className="text-emerald-700 font-semibold">{rep.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => onOpenReport(rep)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report & Download PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {patientTab === 'NOTIFICATIONS' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                Notifications & Alerts
              </h3>
              {myNotifications.map((n) => (
                <div key={n.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <p className="text-slate-600">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 11. DOCTOR DASHBOARD VIEW
  // ============================================================================
  if (currentUser.role === 'DOCTOR') {
    const activeDoctor =
      doctors.find((d) => d.id === currentUser.doctorId) || doctors[0];
    const doctorBookings = bookings.filter(
      (b) => b.bookingType === 'DOCTOR_APPOINTMENT' && (!b.doctorId || b.doctorId === activeDoctor.id)
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <div className="text-xs text-teal-700 font-medium">Consultant Physician Console</div>
            <div className="text-base font-semibold text-slate-900 mt-0.5">{activeDoctor.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{activeDoctor.specialization}</div>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'TODAY', label: "Today's Appointments" },
              { id: 'UPCOMING', label: 'Upcoming Appointments' },
              { id: 'AVAILABILITY', label: 'Manage Availability & Slots' },
              { id: 'PATIENTS', label: 'Patient Details & Reports' },
              { id: 'PRESCRIPTION', label: 'Upload Digital Prescription' },
              { id: 'PROFILE', label: 'Doctor Profile' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setDoctorTab(item.id as typeof doctorTab)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  doctorTab === item.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-75" />
              </button>
            ))}
          </nav>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {(doctorTab === 'TODAY' || doctorTab === 'UPCOMING') && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                {doctorTab === 'TODAY' ? "Today's Consultation Queue" : 'All Scheduled Doctor Appointments'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Slot Date & Time</th>
                      <th className="py-2.5 px-3">Clinical Notes</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {doctorBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="py-3 px-3 font-mono font-semibold text-teal-700">{b.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">
                          {b.patientName} ({b.patientAge || 34}y)
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {b.appointmentDate} · {b.appointmentTime}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{b.clinicalNotes || 'General Consultation'}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{b.status}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              handleUpdateBookingStatus(b.id, 'Sample Collected / Appointment Done')
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-md cursor-pointer"
                          >
                            Mark Consulted
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {doctorTab === 'AVAILABILITY' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Manage Chamber Time Slots</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any slot to toggle availability for patient appointment booking
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeDoctor.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleToggleDoctorSlot(activeDoctor, slot.id)}
                    className={`p-4 rounded-lg border text-left transition-colors cursor-pointer ${
                      slot.isAvailable
                        ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="text-xs text-slate-500">{slot.day}</div>
                    <div className="text-sm font-mono font-semibold mt-0.5">{slot.time}</div>
                    <div className="text-xs mt-2 font-medium">
                      {slot.isAvailable ? 'Available for Booking' : 'Blocked / Booked'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {doctorTab === 'PATIENTS' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                Patient Directory & Diagnostic Reports
              </h3>
              <div className="space-y-3">
                {patients.map((pat) => {
                  const patReports = reports.filter((r) => r.patientId === pat.id);
                  return (
                    <div key={pat.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {pat.name} ({pat.age}y · {pat.gender} · Blood {pat.bloodGroup})
                        </div>
                        <div className="text-slate-500 font-mono mt-0.5">
                          ID: {pat.id} · Phone: {pat.phone}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {patReports.map((rep) => (
                          <button
                            key={rep.id}
                            onClick={() => onOpenReport(rep)}
                            className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-white border border-teal-200 rounded-md hover:bg-teal-50 cursor-pointer"
                          >
                            View {rep.id} ({rep.testName.split(' (')[0]})
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {doctorTab === 'PRESCRIPTION' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                Issue & Upload Digital Prescription
              </h3>
              <form onSubmit={handleCreatePrescription} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Select Patient</label>
                    <select
                      value={rxPatientId}
                      onChange={(e) => setRxPatientId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Clinical Diagnosis</label>
                    <input
                      type="text"
                      value={rxDiagnosis}
                      onChange={(e) => setRxDiagnosis(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rx Medications (One per line)</label>
                  <textarea
                    rows={3}
                    value={rxMedications}
                    onChange={(e) => setRxMedications(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Advise Diagnostic Tests (Linked to Test Catalog)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tests.map((t) => {
                      const checked = rxSelectedTests.includes(t.name);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 p-2 border border-slate-200 rounded-md bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setRxSelectedTests((prev) =>
                                checked ? prev.filter((item) => item !== t.name) : [...prev, t.name]
                              )
                            }
                          />
                          <span className="truncate">{t.name.split(' (')[0]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Special Instructions / Fasting Advice</label>
                  <input
                    type="text"
                    value={rxNotes}
                    onChange={(e) => setRxNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                {rxSavedMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
                    {rxSavedMsg}
                  </div>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Upload Prescription to Patient Account
                </button>
              </form>
            </div>
          )}

          {doctorTab === 'PROFILE' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
              <h3 className="text-base font-semibold text-slate-900">{activeDoctor.name}</h3>
              <p className="text-slate-600">{activeDoctor.qualification}</p>
              <p className="text-slate-600">{activeDoctor.bio}</p>
              <div className="font-mono text-slate-700 pt-2">
                Consultation Fee: BDT {activeDoctor.consultationFee} · Room: {activeDoctor.roomNumber}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 12. ADMIN DASHBOARD VIEW
  // ============================================================================
  const totalRevenue = payments
    .filter((p) => p.paymentStatus === 'SUCCESS')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <div className="text-xs text-teal-700 font-medium">System Administrator Console</div>
          <div className="text-base font-semibold text-slate-900 mt-0.5">{currentUser.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">Full Access · LIS & HIS Control</div>
        </div>
        <nav className="space-y-1">
          {[
            { id: 'OVERVIEW', label: 'Overview & Analytics' },
            { id: 'BOOKINGS', label: `Manage Bookings (${bookings.length})` },
            { id: 'REPORTS', label: `Upload & Manage Reports (${reports.length})` },
            { id: 'DOCTORS', label: `Manage Doctors (${doctors.length})` },
            { id: 'TESTS', label: `Diagnostic Tests (${tests.length})` },
            { id: 'HOME_SERVICES', label: `Home Services (${homeServices.length})` },
            { id: 'PATIENTS', label: `Patients (${patients.length})` },
            { id: 'PAYMENTS', label: `Payments (${payments.length})` },
            { id: 'NOTIFICATIONS', label: 'System Notifications' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id as typeof adminTab)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                adminTab === item.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-75" />
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:col-span-9 space-y-6">
        {adminTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* 4 Key Admin Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Total Patients</div>
                <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {patients.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">Registered Accounts</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Total Doctors</div>
                <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {doctors.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">Active Consultants</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Total Bookings</div>
                <div className="text-2xl font-semibold font-mono tabular-nums text-teal-700 mt-1">
                  {bookings.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">Appointments, Lab & Home</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-500">Total Revenue</div>
                <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
                  BDT {totalRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">Verified Payments</div>
              </div>
            </div>

            {/* Quick Booking Lifecycle Control Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Recent Bookings & Lifecycle Control
                </h3>
                <button
                  onClick={() => setAdminTab('REPORTS')}
                  className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                >
                  Upload Lab Report →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Type / Service</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Lifecycle Stage (Update)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="py-3 px-3 font-mono font-semibold text-teal-700">{b.id}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{b.patientName}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {b.doctorName || b.testNames?.join(', ') || b.homeServiceName}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                          BDT {b.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={b.status}
                            onChange={(e) =>
                              handleUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                            }
                            className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-teal-600"
                          >
                            {LIFECYCLE_STEPS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'BOOKINGS' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
              All System Bookings ({bookings.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3">Booking ID</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Service Details</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Lifecycle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="py-3 px-3 font-mono font-semibold text-teal-700">{b.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{b.patientName}</td>
                      <td className="py-3 px-3 text-slate-500">{b.bookingType}</td>
                      <td className="py-3 px-3 text-slate-800">
                        {b.doctorName || b.testNames?.join(', ') || b.homeServiceName}
                      </td>
                      <td className="py-3 px-3 font-mono">{b.paymentStatus}</td>
                      <td className="py-3 px-3">
                        <select
                          value={b.status}
                          onChange={(e) =>
                            handleUpdateBookingStatus(b.id, e.target.value as BookingStatus)
                          }
                          className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md"
                        >
                          {LIFECYCLE_STEPS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'REPORTS' && (
          <div className="space-y-6">
            {/* Upload Report Linked to Booking ID */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Upload & Publish Diagnostic Report (Linked to Booking ID)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a completed test booking to generate its verified pathology report and release it to the patient dashboard
                </p>
              </div>
              <form onSubmit={handleAdminUploadReport} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Select Target Booking ID
                    </label>
                    <select
                      value={reportBookingId}
                      onChange={(e) => setReportBookingId(e.target.value)}
                      className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                    >
                      {bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id} — {b.patientName} ({b.testNames?.join(', ') || b.homeServiceName || b.doctorName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Pathologist Clinical Remarks
                    </label>
                    <input
                      type="text"
                      value={reportRemarks}
                      onChange={(e) => setReportRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                {adminFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-medium">
                    {adminFeedback}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploadingReport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingReport ? 'Publishing Report...' : 'Generate & Upload Official Report'}</span>
                </button>
              </form>
            </div>

            {/* Existing Reports Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
                Published Reports Archive ({reports.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                      <th className="py-2.5 px-3">Report ID</th>
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Investigation</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 px-3 font-mono font-semibold text-teal-700">{r.id}</td>
                        <td className="py-3 px-3 font-mono text-slate-700">{r.bookingId}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{r.patientName}</td>
                        <td className="py-3 px-3 text-slate-600">{r.testName}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{r.reportDate}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onOpenReport(r)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-md cursor-pointer"
                          >
                            Open PDF View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {adminTab === 'DOCTORS' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Add New Consultant Doctor</h3>
              <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Doctor Full Name"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Specialization (e.g. Cardiology)"
                  value={newDocSpec}
                  onChange={(e) => setNewDocSpec(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
                <input
                  type="number"
                  placeholder="Fee (BDT)"
                  value={newDocFee}
                  onChange={(e) => setNewDocFee(e.target.value)}
                  className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Doctor</span>
                </button>
              </form>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="divide-y divide-slate-200 text-xs">
                {doctors.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{d.name}</div>
                      <div className="text-slate-500">
                        {d.specialization} · {d.qualification}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-slate-900">
                      BDT {d.consultationFee}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'TESTS' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Add New Diagnostic Test</h3>
              <form onSubmit={handleAddTest} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Test Name (e.g. Serum Ferritin)"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Test Code (e.g. FER-010)"
                  value={newTestCode}
                  onChange={(e) => setNewTestCode(e.target.value)}
                  className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Price (BDT)"
                  value={newTestPrice}
                  onChange={(e) => setNewTestPrice(e.target.value)}
                  className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Test</span>
                </button>
              </form>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="divide-y divide-slate-200 text-xs">
                {tests.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-teal-700 font-semibold">{t.code}</span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="font-semibold text-slate-900">{t.name}</span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-slate-500">{t.category}</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-900">BDT {t.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'HOME_SERVICES' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Manage Home Healthcare Services</h3>
              <form onSubmit={handleAddHomeService} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Service Title"
                  value={newHsName}
                  onChange={(e) => setNewHsName(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
                <select
                  value={newHsCategory}
                  onChange={(e) => setNewHsCategory(e.target.value as typeof newHsCategory)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="BLOOD_COLLECTION">Blood Collection</option>
                  <option value="HOME_ECG">Home ECG</option>
                  <option value="HOME_DRESSING">Home Dressing</option>
                </select>
                <input
                  type="number"
                  placeholder="Charge (BDT)"
                  value={newHsPrice}
                  onChange={(e) => setNewHsPrice(e.target.value)}
                  className="px-3 py-2 font-mono border border-slate-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Add Service
                </button>
              </form>
              <div className="divide-y divide-slate-200 text-xs pt-2">
                {homeServices.map((hs) => (
                  <div key={hs.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{hs.name}</div>
                      <div className="text-slate-500">{hs.description}</div>
                    </div>
                    <div className="font-mono font-semibold text-slate-900 shrink-0 pl-4">
                      BDT {hs.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'PATIENTS' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Registered Patients ({patients.length})
            </h3>
            {patients.map((p) => (
              <div key={p.id} className="py-2.5 border-b border-slate-100 flex justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-slate-500">{p.email}</span>
                </div>
                <div className="font-mono text-slate-600">
                  {p.id} · {p.phone}
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === 'PAYMENTS' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
              All Payment Transactions
            </h3>
            {payments.map((p) => (
              <div key={p.id} className="py-2.5 border-b border-slate-100 flex justify-between font-mono">
                <div>
                  <span className="font-semibold text-slate-900">{p.id}</span> · Booking {p.bookingId} ({p.patientName})
                </div>
                <div>
                  {p.paymentMethod} · BDT {p.amount} · <span className="text-emerald-700 font-semibold">{p.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {adminTab === 'NOTIFICATIONS' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-xs">
            <h3 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
              System Audit & Event Notifications
            </h3>
            {notifications.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">{n.title}</div>
                <div className="text-slate-600 mt-0.5">{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
