import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Calendar,
  Clock,
  FlaskConical,
  HeartPulse,
  FileText,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  X,
  Database,
  LogIn,
} from 'lucide-react';
import { APP_IMAGES } from './assets/imageRegistry';
import type {
  User,
  UserRole,
  Doctor,
  DiagnosticTest,
  HomeService,
  Booking,
  Payment,
  MedicalReport,
  Prescription,
  NotificationItem,
  CollectionMode,
} from './types';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { ReportViewerModal } from './components/ReportViewerModal';
import { PrescriptionAiReader } from './components/PrescriptionAiReader';
import { RoleDashboards } from './components/RoleDashboards';
import { ArchitectureBlueprintModal } from './components/ArchitectureBlueprintModal';

type NavPage = 'HOME' | 'DOCTORS' | 'TESTS' | 'HOME_CARE' | 'AI_PRESCRIPTION' | 'DASHBOARD';

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('HOME');

  // Data state from Express REST API
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [homeServices, setHomeServices] = useState<HomeService[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticated User State (Default: Patient Arifur Rahman, switchable across Patient / Doctor / Admin)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'PAT-1001',
    name: 'Arifur Rahman',
    email: 'patient@smartcare.bd',
    phone: '+880 1711-234567',
    role: 'PATIENT',
    bloodGroup: 'O+',
    age: 34,
    gender: 'Male',
    address: 'House 42, Road 9A, Dhanmondi, Dhaka-1209',
  });

  // Filters & Search
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestCategory, setSelectedTestCategory] = useState('ALL');

  // Booking Modals & Active Flows
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('2026-09-27');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');

  // Diagnostic Test Booking Modal State
  const [selectedTestsForBooking, setSelectedTestsForBooking] = useState<DiagnosticTest[]>([]);
  const [showTestBookingModal, setShowTestBookingModal] = useState<boolean>(false);
  const [testCollectionMode, setTestCollectionMode] = useState<CollectionMode>('HOME_COLLECTION');
  const [testBookingDate, setTestBookingDate] = useState<string>('2026-09-27');
  const [testBookingTime, setTestBookingTime] = useState<string>('08:30 AM');
  const [testBookingAddress, setTestBookingAddress] = useState<string>(
    'House 42, Road 9A, Dhanmondi, Dhaka-1209'
  );

  // Home Healthcare Booking Modal State
  const [selectedHomeService, setSelectedHomeService] = useState<HomeService | null>(null);
  const [homeBloodTestIds, setHomeBloodTestIds] = useState<string[]>(['TST-01']);
  const [homeServiceDate, setHomeServiceDate] = useState<string>('2026-09-27');
  const [homeServiceTime, setHomeServiceTime] = useState<string>('09:30 AM');
  const [homeServiceAddress, setHomeServiceAddress] = useState<string>(
    'House 42, Road 9A, Dhanmondi, Dhaka-1209'
  );

  // Payment, Report, Auth & Blueprint Modals
  const [activePaymentBooking, setActivePaymentBooking] = useState<Booking | null>(null);
  const [activeReportModal, setActiveReportModal] = useState<MedicalReport | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authEmail, setAuthEmail] = useState<string>('patient@smartcare.bd');
  const [authName, setAuthName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authAddress, setAuthAddress] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showBlueprintModal, setShowBlueprintModal] = useState<boolean>(false);

  // Quick Booking ID Lookup on Home Page
  const [quickTrackId, setQuickTrackId] = useState<string>('DIAG-2026-00025');
  const [quickTrackedBooking, setQuickTrackedBooking] = useState<Booking | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        docsRes,
        testsRes,
        hsRes,
        bookingsRes,
        paymentsRes,
        reportsRes,
        rxRes,
        notifRes,
        patientsRes,
      ] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/tests'),
        fetch('/api/home-services'),
        fetch('/api/bookings'),
        fetch('/api/payments'),
        fetch('/api/reports'),
        fetch('/api/prescriptions'),
        fetch(`/api/notifications?userId=${currentUser.id}&role=${currentUser.role}`),
        fetch('/api/patients'),
      ]);

      const [
        docsData,
        testsData,
        hsData,
        bookingsData,
        paymentsData,
        reportsData,
        rxData,
        notifData,
        patientsData,
      ] = await Promise.all([
        docsRes.json(),
        testsRes.json(),
        hsRes.json(),
        bookingsRes.json(),
        paymentsRes.json(),
        reportsRes.json(),
        rxRes.json(),
        notifRes.json(),
        patientsRes.json(),
      ]);

      setDoctors(docsData);
      setTests(testsData);
      setHomeServices(hsData);
      setBookings(bookingsData);
      setPayments(paymentsData);
      setReports(reportsData);
      setPrescriptions(rxData);
      setNotifications(notifData);
      setPatients(patientsData);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Switch between Patient, Doctor, and Admin roles seamlessly
  const handleSwitchRole = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      PATIENT: 'patient@smartcare.bd',
      DOCTOR: 'dr.rahman@smartcare.bd',
      ADMIN: 'admin@smartcare.bd',
    };
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailMap[role], role }),
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
      if (role !== 'PATIENT') {
        setActivePage('DASHBOARD');
      }
    }
  };

  // Handle Login / Register Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (authMode === 'LOGIN') {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Login failed');
        return;
      }
      setCurrentUser(data.user);
      setShowAuthModal(false);
      setActivePage('DASHBOARD');
    } else {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          phone: authPhone,
          address: authAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Registration failed');
        return;
      }
      setCurrentUser(data.user);
      setShowAuthModal(false);
      await fetchAllData();
      setActivePage('DASHBOARD');
    }
  };

  // Doctor Appointment Booking Submission
  const handleConfirmDoctorAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForBooking) return;
    const chosenSlot =
      selectedDoctorForBooking.slots.find((s) => s.id === selectedSlotId) ||
      selectedDoctorForBooking.slots.find((s) => s.isAvailable) ||
      selectedDoctorForBooking.slots[0];

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        patientName: currentUser.name,
        patientPhone: currentUser.phone,
        patientAge: currentUser.age || 34,
        bookingType: 'DOCTOR_APPOINTMENT',
        doctorId: selectedDoctorForBooking.id,
        doctorName: selectedDoctorForBooking.name,
        appointmentDate,
        appointmentTime: chosenSlot ? chosenSlot.time : '06:00 PM',
        amount: selectedDoctorForBooking.consultationFee,
        clinicalNotes: appointmentNotes || `Consultation at ${selectedDoctorForBooking.roomNumber}`,
      }),
    });

    if (res.ok) {
      const createdBooking: Booking = await res.json();
      setSelectedDoctorForBooking(null);
      await fetchAllData();
      setActivePaymentBooking(createdBooking);
    }
  };

  // Diagnostic Test Booking Submission
  const handleConfirmTestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestsForBooking.length === 0) return;
    const homeCollectionCharge = testCollectionMode === 'HOME_COLLECTION' ? 200 : 0;
    const total =
      selectedTestsForBooking.reduce((sum, t) => sum + t.price, 0) + homeCollectionCharge;

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        patientName: currentUser.name,
        patientPhone: currentUser.phone,
        patientAge: currentUser.age || 34,
        bookingType: 'DIAGNOSTIC_TEST',
        testIds: selectedTestsForBooking.map((t) => t.id),
        testNames: selectedTestsForBooking.map((t) => t.name),
        collectionMode: testCollectionMode,
        address:
          testCollectionMode === 'HOME_COLLECTION'
            ? testBookingAddress
            : 'SmartCare Central Diagnostic Lab, Panthapath, Dhaka',
        appointmentDate: testBookingDate,
        appointmentTime: testBookingTime,
        amount: total,
        clinicalNotes:
          testCollectionMode === 'HOME_COLLECTION'
            ? 'Home blood sample collection requested'
            : 'Patient visiting Central Diagnostic Lab',
      }),
    });

    if (res.ok) {
      const createdBooking: Booking = await res.json();
      setShowTestBookingModal(false);
      setSelectedTestsForBooking([]);
      await fetchAllData();
      setActivePaymentBooking(createdBooking);
    }
  };

  // Home Healthcare Service Booking Submission
  const handleConfirmHomeServiceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomeService) return;

    const extraTests =
      selectedHomeService.category === 'BLOOD_COLLECTION'
        ? tests.filter((t) => homeBloodTestIds.includes(t.id))
        : [];
    const extraTestsTotal = extraTests.reduce((sum, t) => sum + t.price, 0);
    const totalAmount = selectedHomeService.price + extraTestsTotal;

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: currentUser.id,
        patientName: currentUser.name,
        patientPhone: currentUser.phone,
        patientAge: currentUser.age || 34,
        bookingType: 'HOME_SERVICE',
        homeServiceId: selectedHomeService.id,
        homeServiceName:
          selectedHomeService.category === 'BLOOD_COLLECTION' && extraTests.length > 0
            ? `${selectedHomeService.name} (${extraTests.map((t) => t.name.split(' (')[0]).join(', ')})`
            : selectedHomeService.name,
        testIds: extraTests.map((t) => t.id),
        testNames: extraTests.map((t) => t.name),
        collectionMode: 'HOME_COLLECTION',
        address: homeServiceAddress,
        appointmentDate: homeServiceDate,
        appointmentTime: homeServiceTime,
        amount: totalAmount,
        clinicalNotes: `Home Healthcare Visit: ${selectedHomeService.name}`,
      }),
    });

    if (res.ok) {
      const createdBooking: Booking = await res.json();
      setSelectedHomeService(null);
      await fetchAllData();
      setActivePaymentBooking(createdBooking);
    }
  };

  // Filtered Doctors
  const specializations = ['ALL', ...Array.from(new Set(doctors.map((d) => d.specialization)))];
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec =
      selectedSpecialization === 'ALL' || doc.specialization === selectedSpecialization;
    const matchesQuery =
      doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(doctorSearch.toLowerCase()) ||
      doc.qualification.toLowerCase().includes(doctorSearch.toLowerCase());
    return matchesSpec && matchesQuery;
  });

  // Filtered Diagnostic Tests
  const testCategories = ['ALL', ...Array.from(new Set(tests.map((t) => t.category)))];
  const filteredTests = tests.filter((test) => {
    const matchesCat = selectedTestCategory === 'ALL' || test.category === selectedTestCategory;
    const matchesQuery =
      test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      test.code.toLowerCase().includes(testSearch.toLowerCase()) ||
      test.category.toLowerCase().includes(testSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleQuickTrackLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const found = bookings.find(
      (b) => b.id.toUpperCase() === quickTrackId.trim().toUpperCase()
    );
    setQuickTrackedBooking(found || null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* =====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT
          Zone 1: Single text wordmark | Zone 2: 5 clean nav links | Zone 3: Actions
         ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActivePage('HOME');
            }}
            className="text-xl font-semibold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            SmartCare
          </a>

          {/* Zone 2: 5 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {[
              { id: 'HOME', label: 'Home' },
              { id: 'DOCTORS', label: 'Doctors' },
              { id: 'TESTS', label: 'Diagnostic Tests' },
              { id: 'HOME_CARE', label: 'Home Care' },
              { id: 'AI_PRESCRIPTION', label: 'AI Prescription' },
              { id: 'DASHBOARD', label: 'Dashboard' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id as NavPage)}
                className={`py-1 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
                  activePage === item.id
                    ? 'text-teal-700 border-teal-600 font-semibold'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1-2 Primary Actions (Role Switcher & Sign In) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
              {(['PATIENT', 'DOCTOR', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleSwitchRole(r)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    currentUser.role === r
                      ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'PATIENT' ? 'Patient' : r === 'DOCTOR' ? 'Doctor' : 'Admin'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{currentUser.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>

        {/* Mobile Secondary Nav Bar */}
        <div className="flex md:hidden items-center gap-3 overflow-x-auto pt-2.5 mt-2.5 border-t border-slate-100 text-xs font-medium text-slate-600">
          {[
            { id: 'HOME', label: 'Home' },
            { id: 'DOCTORS', label: 'Doctors' },
            { id: 'TESTS', label: 'Tests' },
            { id: 'HOME_CARE', label: 'Home Care' },
            { id: 'AI_PRESCRIPTION', label: 'AI Rx' },
            { id: 'DASHBOARD', label: 'Dashboard' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as NavPage)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap ${
                activePage === item.id ? 'bg-teal-50 text-teal-700 font-semibold' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* =====================================================================
          MAIN VIEWPORT CONTENT
         ===================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-14">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading SmartCare Clinical Database...</p>
          </div>
        ) : (
          <>
            {/* ===============================================================
                PAGE 1: PATIENT WEBSITE HOME PAGE (Section 2)
               =============================================================== */}
            {activePage === 'HOME' && (
              <div className="space-y-16">
                {/* Hero Section */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-10">
                  <div className="lg:col-span-6 space-y-6">
                    <div className="text-xs font-medium text-teal-700 tracking-wide">
                      ISO 15189 Accredited Reference Laboratory · Clinical Consultation · Home Care
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.12]">
                      Your Health, Our Clinical Priority.
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                      Book specialist doctors, schedule pathology tests with home blood sample collection, extract handwritten prescriptions using AI OCR, and access verified online reports under a unified Booking ID.
                    </p>

                    {/* Primary Hero Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => setActivePage('DOCTORS')}
                        className="px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Book Doctor Appointment
                      </button>
                      <button
                        onClick={() => setActivePage('TESTS')}
                        className="px-5 py-3 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Book Diagnostic Test
                      </button>
                      <button
                        onClick={() => setActivePage('AI_PRESCRIPTION')}
                        className="px-4 py-3 text-xs sm:text-sm font-medium text-teal-700 hover:text-teal-800 underline cursor-pointer whitespace-nowrap"
                      >
                        Try AI Prescription Reader →
                      </button>
                    </div>

                    {/* Quantitative Proof Adjacency */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
                      <div>
                        <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                          6 Hours
                        </div>
                        <div className="text-slate-500">Same-Day Lab Turnaround</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                          100% Auth
                        </div>
                        <div className="text-slate-500">Protected Online Reports</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                          DIAG-2026
                        </div>
                        <div className="text-slate-500">End-to-End Lifecycle ID</div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div className="lg:col-span-6">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-16/9 bg-slate-900">
                      <img
                        src={APP_IMAGES.heroDiagnosticCenter}
                        alt="SmartCare Automated Diagnostic Laboratory and Clinical Reception"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-5">
                        <div className="text-white space-y-1">
                          <div className="text-xs text-teal-300 font-mono">
                            Central Reference Laboratory · Panthapath, Dhaka
                          </div>
                          <div className="text-sm font-medium">
                            Automated Hematology, CMIA Endocrinology & 24/7 Home Sample Dispatch
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Booking ID Instant Lifecycle Lookup Bar */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Track Your Booking Lifecycle by Booking ID
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter any Booking ID (try <span className="font-mono text-teal-700">DIAG-2026-00025</span>, <span className="font-mono text-teal-700">DIAG-2026-00001</span>, or <span className="font-mono text-teal-700">DIAG-2026-00002</span>) to check live status
                      </p>
                    </div>
                    <form onSubmit={handleQuickTrackLookup} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={quickTrackId}
                        onChange={(e) => setQuickTrackId(e.target.value)}
                        placeholder="DIAG-2026-00025"
                        className="px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 w-48"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Track Status
                      </button>
                    </form>
                  </div>

                  {quickTrackedBooking && (
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <span className="font-mono font-semibold text-teal-700">{quickTrackedBooking.id}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span className="font-semibold text-slate-900">{quickTrackedBooking.patientName}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span className="text-slate-600">
                          {quickTrackedBooking.doctorName ||
                            quickTrackedBooking.testNames?.join(', ') ||
                            quickTrackedBooking.homeServiceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-emerald-700">
                          Stage: {quickTrackedBooking.status}
                        </span>
                        <button
                          onClick={() => setActivePage('DASHBOARD')}
                          className="text-teal-700 font-semibold underline cursor-pointer"
                        >
                          Open in Dashboard →
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Popular Diagnostic Tests Showcase */}
                <section className="space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        01. Popular Diagnostic Tests
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Choose between Diagnostic Centre Visit or Home Blood Sample Collection
                      </p>
                    </div>
                    <button
                      onClick={() => setActivePage('TESTS')}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All {tests.length} Tests</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {tests.slice(0, 6).map((test) => (
                      <div
                        key={test.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-2">
                          {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-teal-700 font-medium">{test.code}</span>
                            <span aria-hidden="true">·</span>
                            <span>{test.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>Report in {test.turnaroundTime}</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">{test.name}</h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {test.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 block">Test Fee</span>
                            <span className="text-base font-semibold font-mono tabular-nums text-slate-900">
                              BDT {test.price.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTestsForBooking([test]);
                              setShowTestBookingModal(true);
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Book Test
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Home Healthcare Services Section */}
                <section className="space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        02. Home Healthcare Services
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Hospital-grade sample collection, bedside 12-lead ECG, and sterile surgical dressing at your doorstep
                      </p>
                    </div>
                    <button
                      onClick={() => setActivePage('HOME_CARE')}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Home Care</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {homeServices.map((service) => (
                      <div
                        key={service.id}
                        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-teal-700 font-medium">{service.code}</span>
                            <span aria-hidden="true">·</span>
                            <span>{service.duration}</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {service.description}
                          </p>
                          <div className="pt-1 text-xs text-slate-500">
                            Includes: {service.equipmentIncluded.join(' · ')}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 block">Visit Charge</span>
                            <span className="text-base font-semibold font-mono tabular-nums text-slate-900">
                              BDT {service.price.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedHomeService(service)}
                            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Schedule Visit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Specialist Doctors Highlight */}
                <section className="space-y-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900">
                        03. Specialist Consultants
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Select available chamber slots and confirm your appointment online
                      </p>
                    </div>
                    <button
                      onClick={() => setActivePage('DOCTORS')}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Doctors</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {doctors.slice(0, 4).map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={APP_IMAGES.doctorAvatars[doc.avatarKey]}
                            alt={doc.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="text-xs text-teal-700 font-medium">
                              {doc.specialization} · {doc.experience} Exp
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">{doc.name}</h3>
                            <p className="text-xs text-slate-500">{doc.qualification}</p>
                            <div className="text-xs text-slate-500 font-mono pt-0.5">
                              {doc.availableDays.join(', ')} · {doc.availableTime}
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="text-xs text-slate-500 block">Consultation</span>
                            <span className="text-base font-semibold font-mono tabular-nums text-slate-900">
                              BDT {doc.consultationFee}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedDoctorForBooking(doc);
                              setSelectedSlotId(doc.slots.find((s) => s.isAvailable)?.id || doc.slots[0]?.id || '');
                            }}
                            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Book Slot
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Embedded AI Prescription Reader Feature Section */}
                <section className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      04. AI Prescription Reader & Test Matcher
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Upload a handwritten doctor prescription image to extract diagnostic tests and match them against our Test Database
                    </p>
                  </div>
                  <PrescriptionAiReader
                    tests={tests}
                    currentUser={currentUser}
                    onBookingCreated={(newBooking) => {
                      fetchAllData();
                      setActivePaymentBooking(newBooking);
                    }}
                  />
                </section>
              </div>
            )}

            {/* ===============================================================
                PAGE 2: DOCTOR APPOINTMENT MODULE (Section 3)
               =============================================================== */}
            {activePage === 'DOCTORS' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                      Specialist Doctor Appointments
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Search Doctor → Filter Specialization → Inspect Profile & Available Slots → Select Date + Time → Online Payment → Confirmed
                    </p>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="Search doctor or specialty..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    />
                  </div>
                </div>

                {/* Interactive Specialization Filter Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                  {specializations.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialization(spec)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        selectedSpecialization === spec
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {spec === 'ALL' ? 'All Specializations' : spec}
                    </button>
                  ))}
                </div>

                {/* Doctor Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={APP_IMAGES.doctorAvatars[doc.avatarKey]}
                            alt={doc.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="text-xs text-teal-700 font-medium">
                              {doc.specialization} · {doc.experience} Experience
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">{doc.name}</h3>
                            <p className="text-xs text-slate-600">{doc.qualification}</p>
                            <div className="text-xs text-slate-500">
                              Chamber: {doc.roomNumber}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{doc.bio}</p>

                        {/* Available Days & Time */}
                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500 block">Available Days</span>
                            <span className="font-medium text-slate-900">
                              {doc.availableDays.join(', ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Visiting Hours</span>
                            <span className="font-mono text-slate-900">{doc.availableTime}</span>
                          </div>
                        </div>

                        {/* Available Slots Preview */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-slate-700 block">
                            Available Chamber Slots:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {doc.slots.map((slot) => (
                              <button
                                key={slot.id}
                                disabled={!slot.isAvailable}
                                onClick={() => {
                                  setSelectedDoctorForBooking(doc);
                                  setSelectedSlotId(slot.id);
                                }}
                                className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                                  slot.isAvailable
                                    ? 'bg-white hover:bg-teal-50 border-slate-300 hover:border-teal-600 text-slate-800 cursor-pointer'
                                    : 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                                }`}
                              >
                                {slot.day} · {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 block">Consultation Fee</span>
                          <span className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                            BDT {doc.consultationFee.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDoctorForBooking(doc);
                            setSelectedSlotId(
                              doc.slots.find((s) => s.isAvailable)?.id || doc.slots[0]?.id || ''
                            );
                          }}
                          className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Select Slot & Book Appointment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                PAGE 3: DIAGNOSTIC TEST MODULE (Section 4)
               =============================================================== */}
            {activePage === 'TESTS' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                      Diagnostic Laboratory Tests
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Search Test → Inspect Parameters & Price → Choose Centre Visit or Home Collection → Select Date & Time → Online Payment
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={testSearch}
                        onChange={(e) => setTestSearch(e.target.value)}
                        placeholder="Search CBC, HbA1c, Lipid, ECG..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    {selectedTestsForBooking.length > 0 && (
                      <button
                        onClick={() => setShowTestBookingModal(true)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer whitespace-nowrap"
                      >
                        Checkout ({selectedTestsForBooking.length} Tests)
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-lg border border-slate-200/80">
                  {testCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedTestCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        selectedTestCategory === cat
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Categories' : cat}
                    </button>
                  ))}
                </div>

                {/* Diagnostic Tests Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {filteredTests.map((test) => {
                    const isSelected = selectedTestsForBooking.some((t) => t.id === test.id);
                    return (
                      <div
                        key={test.id}
                        className={`bg-white border rounded-xl p-5 flex flex-col justify-between space-y-4 transition-colors ${
                          isSelected ? 'border-teal-600 bg-teal-50/10' : 'border-slate-200'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono text-teal-700 font-semibold">{test.code}</span>
                            <span aria-hidden="true">·</span>
                            <span>{test.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{test.turnaroundTime}</span>
                          </div>
                          <h3 className="text-base font-semibold text-slate-900">{test.name}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">{test.description}</p>
                          <div className="text-xs text-slate-500 pt-1">
                            <span>Specimen: {test.sampleType}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{test.fastingRequired ? '10-12h Fasting Required' : 'Random Sample'}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-slate-500 block">Price</span>
                            <span className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                              BDT {test.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTestsForBooking((prev) =>
                                    prev.filter((item) => item.id !== test.id)
                                  );
                                } else {
                                  setSelectedTestsForBooking((prev) => [...prev, test]);
                                }
                              }}
                              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              {isSelected ? 'Selected ✓' : '+ Select'}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTestsForBooking([test]);
                                setShowTestBookingModal(true);
                              }}
                              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg cursor-pointer whitespace-nowrap"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                PAGE 4: HOME HEALTHCARE MODULE (Section 5)
               =============================================================== */}
            {activePage === 'HOME_CARE' && (
              <div className="space-y-8">
                <div className="border-b border-slate-200 pb-5">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    Home Healthcare Services
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Book Home Blood Collection, Bedside 12-Lead Portable ECG, or Post-Surgical Home Wound Dressing
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {homeServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-teal-700">{service.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>{service.duration}</span>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">{service.name}</h2>
                        <p className="text-xs text-slate-600 leading-relaxed">{service.description}</p>

                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                          <div className="font-semibold text-slate-800">Clinical Protocol & Kit Included:</div>
                          <ul className="space-y-1 text-slate-600">
                            {service.equipmentIncluded.map((eq, i) => (
                              <li key={i}>• {eq}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 block">Home Visit Charge</span>
                          <span className="text-xl font-semibold font-mono tabular-nums text-slate-900">
                            BDT {service.price.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedHomeService(service)}
                          className="px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
                        >
                          Book Home Visit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                PAGE 5: AI PRESCRIPTION READER (Section 6)
               =============================================================== */}
            {activePage === 'AI_PRESCRIPTION' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-5">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                    AI Prescription Reader & Diagnostic Test Matcher
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Doctor Prescription → Upload Image → AI/OCR Handwriting Extraction → Match with Test Database → Verify → Book Selected Tests
                  </p>
                </div>
                <PrescriptionAiReader
                  tests={tests}
                  currentUser={currentUser}
                  onBookingCreated={(newBooking) => {
                    fetchAllData();
                    setActivePaymentBooking(newBooking);
                  }}
                />
              </div>
            )}

            {/* ===============================================================
                PAGE 6: ROLE DASHBOARDS (Patient / Doctor / Admin)
               =============================================================== */}
            {activePage === 'DASHBOARD' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                      {currentUser.role === 'PATIENT'
                        ? 'Patient Dashboard'
                        : currentUser.role === 'DOCTOR'
                        ? 'Doctor Dashboard'
                        : 'Admin Dashboard'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Switch roles anytime in the top right bar to test Patient, Doctor, and Admin workflows
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBlueprintModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5 text-teal-600" />
                      <span>MySQL & Spring Boot Blueprint</span>
                    </button>
                  </div>
                </div>

                <RoleDashboards
                  currentUser={currentUser}
                  doctors={doctors}
                  tests={tests}
                  homeServices={homeServices}
                  bookings={bookings}
                  payments={payments}
                  reports={reports}
                  prescriptions={prescriptions}
                  notifications={notifications}
                  patients={patients}
                  onOpenPayment={(booking) => setActivePaymentBooking(booking)}
                  onOpenReport={(report) => setActiveReportModal(report)}
                  onRefreshData={fetchAllData}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* =====================================================================
          MODAL 1: DOCTOR APPOINTMENT BOOKING MODAL
         ===================================================================== */}
      {selectedDoctorForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="text-sm font-semibold">Book Doctor Consultation</h3>
                <p className="text-xs text-slate-400">{selectedDoctorForBooking.name}</p>
              </div>
              <button
                onClick={() => setSelectedDoctorForBooking(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmDoctorAppointment} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">{selectedDoctorForBooking.specialization}</div>
                <div className="text-slate-500">{selectedDoctorForBooking.qualification}</div>
                <div className="font-mono text-teal-700 font-semibold pt-1">
                  Consultation Fee: BDT {selectedDoctorForBooking.consultationFee} · {selectedDoctorForBooking.roomNumber}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Available Time Slot</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                  >
                    {selectedDoctorForBooking.slots
                      .filter((s) => s.isAvailable)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.day} — {s.time}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Symptoms / Reason for Consultation
                </label>
                <input
                  type="text"
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  placeholder="e.g. Blood pressure review and chest discomfort..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForBooking(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Confirm & Proceed to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: DIAGNOSTIC TEST BOOKING MODAL
         ===================================================================== */}
      {showTestBookingModal && selectedTestsForBooking.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="text-sm font-semibold">Diagnostic Test Booking</h3>
                <p className="text-xs text-slate-400">
                  {selectedTestsForBooking.length} Investigation(s) Selected
                </p>
              </div>
              <button
                onClick={() => setShowTestBookingModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmTestBooking} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                {selectedTestsForBooking.map((t) => (
                  <div key={t.id} className="flex justify-between">
                    <span className="font-medium text-slate-900">{t.name}</span>
                    <span className="font-mono font-semibold">BDT {t.price}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Sample Collection Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTestCollectionMode('HOME_COLLECTION')}
                    className={`py-2 px-3 rounded-md font-medium transition-colors cursor-pointer ${
                      testCollectionMode === 'HOME_COLLECTION'
                        ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    Home Collection (+BDT 200)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestCollectionMode('CENTRE_VISIT')}
                    className={`py-2 px-3 rounded-md font-medium transition-colors cursor-pointer ${
                      testCollectionMode === 'CENTRE_VISIT'
                        ? 'bg-white text-teal-700 shadow-2xs font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    Centre Visit (Free)
                  </button>
                </div>
              </div>

              {testCollectionMode === 'HOME_COLLECTION' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Home Sample Collection Address
                  </label>
                  <input
                    type="text"
                    value={testBookingAddress}
                    onChange={(e) => setTestBookingAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={testBookingDate}
                    onChange={(e) => setTestBookingDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={testBookingTime}
                    onChange={(e) => setTestBookingTime(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="07:30 AM">07:30 AM (Fasting)</option>
                    <option value="08:30 AM">08:30 AM (Fasting)</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block">Total Amount</span>
                  <span className="text-base font-mono font-semibold text-slate-900">
                    BDT{' '}
                    {(
                      selectedTestsForBooking.reduce((s, t) => s + t.price, 0) +
                      (testCollectionMode === 'HOME_COLLECTION' ? 200 : 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Confirm & Pay Online
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: HOME HEALTHCARE SERVICE BOOKING MODAL (Blood / ECG / Dressing)
         ===================================================================== */}
      {selectedHomeService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div>
                <h3 className="text-sm font-semibold">{selectedHomeService.name}</h3>
                <p className="text-xs text-slate-400">Home Healthcare Dispatch</p>
              </div>
              <button
                onClick={() => setSelectedHomeService(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmHomeServiceBooking} className="p-6 space-y-4 text-xs">
              {selectedHomeService.category === 'BLOOD_COLLECTION' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Select Diagnostic Tests for Home Blood Collection:
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    {tests.map((t) => {
                      const checked = homeBloodTestIds.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center justify-between cursor-pointer">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setHomeBloodTestIds((prev) =>
                                  checked ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                                )
                              }
                            />
                            <span>{t.name}</span>
                          </span>
                          <span className="font-mono">BDT {t.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Home Visit Address</label>
                <input
                  type="text"
                  value={homeServiceAddress}
                  onChange={(e) => setHomeServiceAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={homeServiceDate}
                    onChange={(e) => setHomeServiceDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={homeServiceTime}
                    onChange={(e) => setHomeServiceTime(e.target.value)}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="04:30 PM">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedHomeService(null)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Proceed to Payment Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: SANDBOX PAYMENT GATEWAY
         ===================================================================== */}
      {activePaymentBooking && (
        <PaymentGatewayModal
          booking={activePaymentBooking}
          onClose={() => setActivePaymentBooking(null)}
          onPaymentCompleted={async () => {
            setActivePaymentBooking(null);
            await fetchAllData();
            setActivePage('DASHBOARD');
          }}
        />
      )}

      {/* =====================================================================
          MODAL 5: AUTHENTICATED CLINICAL REPORT & PDF VIEWER
         ===================================================================== */}
      {activeReportModal && (
        <ReportViewerModal
          report={activeReportModal}
          onClose={() => setActiveReportModal(null)}
        />
      )}

      {/* =====================================================================
          MODAL 6: LOGIN / REGISTER & DEMO ACCOUNT SWITCHER
         ===================================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="text-sm font-semibold">
                {authMode === 'LOGIN' ? 'SmartCare Portal Sign In' : 'Patient Registration'}
              </h3>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className={`py-1.5 rounded-md font-medium cursor-pointer ${
                    authMode === 'LOGIN' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('REGISTER')}
                  className={`py-1.5 rounded-md font-medium cursor-pointer ${
                    authMode === 'REGISTER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Register Patient
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'REGISTER' && (
                  <>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Home Address</label>
                      <input
                        type="text"
                        value={authAddress}
                        onChange={(e) => setAuthAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                {authError && (
                  <p className="text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {authMode === 'LOGIN' ? 'Sign In with JWT' : 'Create Patient Account'}
                </button>
              </form>

              {/* Quick Demo Account Selector */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-slate-500 font-medium">Instant Role Switch (Demo Accounts):</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchRole('PATIENT');
                      setShowAuthModal(false);
                    }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900">Patient</div>
                    <div className="text-[11px] text-slate-500 truncate">Arifur Rahman</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchRole('DOCTOR');
                      setShowAuthModal(false);
                    }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900">Doctor</div>
                    <div className="text-[11px] text-slate-500 truncate">Dr. M. Rahman</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSwitchRole('ADMIN');
                      setShowAuthModal(false);
                    }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900">Admin</div>
                    <div className="text-[11px] text-slate-500 truncate">Lab Director</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 7: SYSTEM ARCHITECTURE, MYSQL DDL & SPRING BOOT BLUEPRINT
         ===================================================================== */}
      {showBlueprintModal && (
        <ArchitectureBlueprintModal onClose={() => setShowBlueprintModal(false)} />
      )}

      {/* =====================================================================
          QUIET FOOTER
         ===================================================================== */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-slate-900 text-sm">SmartCare</span>
            <span aria-hidden="true">·</span>
            <span>AI-Enabled Diagnostic, Doctor Appointment & Home Healthcare Management System</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setShowBlueprintModal(true)}
              className="text-teal-700 hover:underline font-medium cursor-pointer"
            >
              MySQL Schema & Spring Boot Docs
            </button>
            <button
              onClick={() => setActivePage('AI_PRESCRIPTION')}
              className="hover:text-slate-900 cursor-pointer"
            >
              AI Prescription OCR
            </button>
            <button
              onClick={() => setActivePage('DASHBOARD')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Role Dashboards
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
