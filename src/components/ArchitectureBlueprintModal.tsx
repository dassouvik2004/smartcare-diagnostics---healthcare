import React, { useState } from 'react';
import { X, Copy, Check, Database, Server, Globe, FolderTree } from 'lucide-react';

interface ArchitectureBlueprintModalProps {
  onClose: () => void;
}

const MYSQL_SCHEMA_SQL = `-- SmartCare: AI-Enabled Diagnostic & Healthcare Management System
-- File: database/diagnostic.sql (MySQL 8.0+)

CREATE DATABASE IF NOT EXISTS smartcare_diagnostic_db;
USE smartcare_diagnostic_db;

-- 1. users table (Authentication & Role-Based Access)
CREATE TABLE users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. patients table
CREATE TABLE patients (
    patient_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) UNIQUE NOT NULL,
    age INT,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    address TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. doctors table
CREATE TABLE doctors (
    doctor_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) UNIQUE,
    name VARCHAR(120) NOT NULL,
    specialization VARCHAR(120) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience VARCHAR(50),
    consultation_fee DECIMAL(10,2) NOT NULL,
    available_days VARCHAR(120),
    available_time VARCHAR(100),
    room_number VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. doctor_slots table
CREATE TABLE doctor_slots (
    slot_id VARCHAR(32) PRIMARY KEY,
    doctor_id VARCHAR(32) NOT NULL,
    slot_day VARCHAR(30) NOT NULL,
    slot_time VARCHAR(30) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE
);

-- 5. tests table (Diagnostic Test Catalog)
CREATE TABLE tests (
    test_id VARCHAR(32) PRIMARY KEY,
    test_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    turnaround_time VARCHAR(50),
    fasting_required BOOLEAN DEFAULT FALSE,
    sample_type VARCHAR(80),
    home_collection_available BOOLEAN DEFAULT TRUE,
    description TEXT
);

-- 6. home_services table (Blood Collection, Home ECG, Home Dressing)
CREATE TABLE home_services (
    service_id VARCHAR(32) PRIMARY KEY,
    service_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category ENUM('BLOOD_COLLECTION', 'HOME_ECG', 'HOME_DRESSING') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration VARCHAR(50),
    description TEXT
);

-- 7. bookings table (Unified Booking Lifecycle: DIAG-2026-XXXXX)
CREATE TABLE bookings (
    booking_id VARCHAR(32) PRIMARY KEY, -- e.g. DIAG-2026-00001
    patient_id VARCHAR(32) NOT NULL,
    booking_type ENUM('DOCTOR_APPOINTMENT', 'DIAGNOSTIC_TEST', 'HOME_SERVICE') NOT NULL,
    doctor_id VARCHAR(32) NULL,
    home_service_id VARCHAR(32) NULL,
    collection_mode ENUM('CENTRE_VISIT', 'HOME_COLLECTION') DEFAULT 'CENTRE_VISIT',
    address TEXT,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(60) NOT NULL DEFAULT 'Booking Created',
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    clinical_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
    FOREIGN KEY (home_service_id) REFERENCES home_services(service_id)
);

-- 8. payments table
CREATE TABLE payments (
    payment_id VARCHAR(32) PRIMARY KEY, -- e.g. PAY-2026-00001
    booking_id VARCHAR(32) NOT NULL,
    transaction_id VARCHAR(64) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CARD', 'BKASH', 'NAGAD', 'NET_BANKING') NOT NULL,
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 9. reports table (Authenticated Online Pathology Reports)
CREATE TABLE reports (
    report_id VARCHAR(32) PRIMARY KEY, -- e.g. REP-2026-00025
    booking_id VARCHAR(32) UNIQUE NOT NULL,
    patient_id VARCHAR(32) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    sample_date VARCHAR(50),
    report_date VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Completed',
    pathologist_name VARCHAR(150),
    remarks TEXT,
    results_json JSON NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 10. prescriptions table
CREATE TABLE prescriptions (
    prescription_id VARCHAR(32) PRIMARY KEY,
    patient_id VARCHAR(32) NOT NULL,
    doctor_id VARCHAR(32),
    diagnosis TEXT,
    medications_json JSON,
    recommended_tests_json JSON,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- 11. notifications table
CREATE TABLE notifications (
    notification_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_booking_id VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const SPRING_BOOT_TEMPLATE = `// File: backend/diagnostic-springboot/src/main/java/com/smartcare/controller/BookingController.java
package com.smartcare.controller;

import com.smartcare.dto.BookingRequestDto;
import com.smartcare.entity.Booking;
import com.smartcare.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequestDto dto) {
        return ResponseEntity.status(201).body(bookingService.createBooking(dto));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication auth) {
        return ResponseEntity.ok(bookingService.getBookingsByPatientEmail(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable String id) {
        return ResponseEntity.ok(bookingService.getByBookingId(id));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<Booking> updateLifecycleStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(bookingService.updateStatus(id, body.get("status")));
    }
}`;

export const ArchitectureBlueprintModal: React.FC<ArchitectureBlueprintModalProps> = ({
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'SQL' | 'SPRING' | 'APIS' | 'STRUCTURE'>('SQL');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-sm font-semibold">
              SmartCare System Architecture, MySQL DDL & Spring Boot Reference
            </h3>
            <p className="text-xs text-slate-400">
              Ready-to-use database schema, Spring Boot controller layers, and REST API documentation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-lg">
            {[
              { id: 'SQL', label: 'MySQL Schema (diagnostic.sql)', icon: Database },
              { id: 'SPRING', label: 'Spring Boot + JWT Layer', icon: Server },
              { id: 'APIS', label: 'REST API Endpoints', icon: Globe },
              { id: 'STRUCTURE', label: 'Project Folder Tree', icon: FolderTree },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'SQL' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  11 Core Relational Tables: users, patients, doctors, doctor_slots, tests, home_services, bookings, payments, reports, prescriptions, notifications
                </span>
                <button
                  onClick={() => handleCopy(MYSQL_SCHEMA_SQL)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL' : 'Copy SQL DDL'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {MYSQL_SCHEMA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'SPRING' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Architecture: Controller → Service → Repository → JPA/Hibernate → MySQL
                </span>
                <button
                  onClick={() => handleCopy(SPRING_BOOT_TEMPLATE)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Java' : 'Copy Controller'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {SPRING_BOOT_TEMPLATE}
              </pre>
            </div>
          )}

          {activeTab === 'APIS' && (
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-4">Method & Endpoint</th>
                    <th className="py-2.5 px-4">Module</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">POST /api/auth/register · /api/auth/login</td>
                    <td className="py-2 px-4 font-sans">Authentication</td>
                    <td className="py-2 px-4 font-sans text-slate-600">JWT token issue & role verification (PATIENT, DOCTOR, ADMIN)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">GET /api/doctors · /api/doctors/:id/slots</td>
                    <td className="py-2 px-4 font-sans">Doctors</td>
                    <td className="py-2 px-4 font-sans text-slate-600">List specialists, profiles, and available chamber time slots</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">GET /api/tests · /api/tests/:id</td>
                    <td className="py-2 px-4 font-sans">Diagnostic Tests</td>
                    <td className="py-2 px-4 font-sans text-slate-600">Pathology & imaging catalog with prices & parameters</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">GET /api/home-services</td>
                    <td className="py-2 px-4 font-sans">Home Care</td>
                    <td className="py-2 px-4 font-sans text-slate-600">Home Blood Collection, Home ECG, and Home Dressing</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">POST /api/bookings · PUT /api/bookings/:id/status</td>
                    <td className="py-2 px-4 font-sans">Bookings</td>
                    <td className="py-2 px-4 font-sans text-slate-600">Generates DIAG-2026-XXXXX ID and tracks 7-step lifecycle</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">POST /api/payments/create · /api/payments/verify</td>
                    <td className="py-2 px-4 font-sans">Payments</td>
                    <td className="py-2 px-4 font-sans text-slate-600">Sandbox gateway checkout with Card/bKash/Nagad & Retry flow</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">GET /api/reports/my · /api/reports/:bookingId</td>
                    <td className="py-2 px-4 font-sans">Online Reports</td>
                    <td className="py-2 px-4 font-sans text-slate-600">Authenticated report retrieval & PDF download</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 text-teal-700 font-semibold">POST /api/prescription/analyze</td>
                    <td className="py-2 px-4 font-sans">AI Prescription OCR</td>
                    <td className="py-2 px-4 font-sans text-slate-600">Multimodal OCR handwriting extraction & test catalog matching</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'STRUCTURE' && (
            <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
{`AI-Diagnostic-System/
├── frontend/
│   └── diagnostic-react/
│       ├── src/
│       │   ├── components/ (PaymentGatewayModal, ReportViewerModal, PrescriptionAiReader, RoleDashboards)
│       │   ├── assets/     (High-resolution clinical & prescription imagery)
│       │   ├── types.ts    (11 Relational Entity Interfaces)
│       │   └── App.tsx     (Unified Patient Website & Role Console)
│       └── package.json
├── backend/
│   └── diagnostic-springboot/
│       ├── controller/     (AuthController, DoctorController, TestController, BookingController, ReportController)
│       ├── service/        (BookingService, PaymentGatewayService, PrescriptionOcrService)
│       ├── repository/     (UserRepository, BookingRepository, TestRepository, ReportRepository)
│       ├── entity/         (User, Patient, Doctor, DoctorSlot, DiagnosticTest, Booking, Payment, Report)
│       ├── security/       (JwtAuthenticationFilter, SecurityConfig)
│       └── pom.xml
├── ai-service/
│   └── prescription-reader/ (Gemini Vision OCR + Catalog Matcher)
├── database/
│   └── diagnostic.sql      (11 MySQL Tables with Foreign Keys)
└── documentation/
    ├── SRS, ER Diagram, DFD, Use Case & Class Diagrams`}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
