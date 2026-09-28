import React from 'react';
import { Printer, Download, ShieldCheck, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MedicalReport } from '../types';

interface ReportViewerModalProps {
  report: MedicalReport;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ report, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocument = () => {
    const rowsHtml = report.results
      .map(
        (r) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${r.parameterName}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-weight:700;text-align:right;">${r.resultValue}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-family:monospace;">${r.unit}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-family:monospace;">${r.referenceRange}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:${
            r.flag === 'NORMAL' ? '#15803d' : '#b91c1c'
          };">${r.flag}</td>
        </tr>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.id} - ${report.patientName} - SmartCare Pathology Report</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, Helvetica, sans-serif; color: #0f172a; padding: 40px; max-width: 840px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0;color:#0f172a;font-size:22px;">SmartCare Diagnostics & Healthcare</h1>
      <p style="margin:4px 0 0;color:#475569;font-size:12px;">ISO 15189 Accredited Clinical Reference Laboratory · Panthapath, Dhaka</p>
    </div>
    <div style="text-align:right;font-family:monospace;font-size:12px;">
      <div><strong>Report ID:</strong> ${report.id}</div>
      <div><strong>Booking ID:</strong> ${report.bookingId}</div>
      <div><strong>Status:</strong> ${report.status}</div>
    </div>
  </div>
  <div class="meta-grid">
    <div><strong>Patient Name:</strong> ${report.patientName} (${report.patientAge} Yrs / ${report.patientGender})</div>
    <div><strong>Patient ID:</strong> ${report.patientId}</div>
    <div><strong>Investigation:</strong> ${report.testName}</div>
    <div><strong>Sample Collected:</strong> ${report.sampleDate}</div>
    <div><strong>Report Date:</strong> ${report.reportDate}</div>
    <div><strong>Authentication:</strong> Verified Patient Access</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Test Parameter</th>
        <th style="text-align:right;">Observed Result</th>
        <th>Unit</th>
        <th>Biological Reference Interval</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div style="background:#f8fafc;padding:14px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;">
    <strong>Clinical Remarks / Interpretation:</strong> ${report.remarks}
  </div>
  <div class="footer">
    <div>Electronically Verified Report · SmartCare Laboratory Information System</div>
    <div><strong>${report.pathologistName}</strong><br/>Consultant Pathologist</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id}_${report.bookingId}_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full overflow-hidden shadow-xl my-8">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Authenticated Patient Report Viewer</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="font-mono tabular-nums text-teal-300">{report.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadDocument}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
              aria-label="Close report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Sheet */}
        <div id="printable-medical-report" className="p-8 space-y-6 bg-white">
          {/* Lab Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b-2 border-teal-700 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight font-display">
                SmartCare Diagnostics & Reference Laboratory
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Department of Clinical Pathology, Hematology & Biochemistry · ISO 15189 Certified
              </p>
            </div>
            <div className="text-left sm:text-right font-mono tabular-nums text-xs space-y-0.5 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500">Booking ID : </span>
                <span className="font-semibold text-slate-900">{report.bookingId}</span>
              </div>
              <div>
                <span className="text-slate-500">Report ID  : </span>
                <span className="font-semibold text-teal-700">{report.id}</span>
              </div>
              <div>
                <span className="text-slate-500">Status     : </span>
                <span className="font-semibold text-emerald-700">{report.status}</span>
              </div>
            </div>
          </div>

          {/* Patient & Sample Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="text-slate-500">Patient Name</div>
              <div className="font-semibold text-slate-900 text-sm">{report.patientName}</div>
              <div className="text-slate-600 font-mono tabular-nums">
                Age/Gender: {report.patientAge} Yrs / {report.patientGender} · ID: {report.patientId}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500">Investigation / Test</div>
              <div className="font-semibold text-slate-900 text-sm">{report.testName}</div>
              <div className="text-slate-600">Sample: Venous Blood / Clinical Specimen</div>
            </div>
            <div className="space-y-1 font-mono tabular-nums">
              <div>
                <span className="text-slate-500">Sample Date: </span>
                <span className="text-slate-900">{report.sampleDate}</span>
              </div>
              <div>
                <span className="text-slate-500">Report Date: </span>
                <span className="text-slate-900 font-semibold">{report.reportDate}</span>
              </div>
              <div className="text-teal-700 font-sans font-medium pt-0.5">
                Patient Auth Verified
              </div>
            </div>
          </div>

          {/* Parameter Results Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-700">
                  <th className="py-2.5 px-4">Investigation Parameter</th>
                  <th className="py-2.5 px-4 text-right">Observed Value</th>
                  <th className="py-2.5 px-4">Unit</th>
                  <th className="py-2.5 px-4">Biological Reference Range</th>
                  <th className="py-2.5 px-4">Clinical Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {report.results.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-medium text-slate-900">{item.parameterName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {item.resultValue}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">{item.unit}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">{item.referenceRange}</td>
                    <td className="py-3 px-4">
                      {item.flag === 'NORMAL' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Normal</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{item.flag}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pathologist Remarks & Signature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 items-end">
            <div className="md:col-span-2 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-800">Pathologist Comments & Clinical Interpretation:</div>
              <p className="text-slate-600 leading-relaxed">{report.remarks}</p>
            </div>
            <div className="text-left md:text-right space-y-1 border-t md:border-t-0 pt-4 md:pt-0 border-slate-200">
              <div className="font-display italic text-base text-slate-800">{report.pathologistName.split(',')[0]}</div>
              <div className="text-xs font-semibold text-slate-900">{report.pathologistName}</div>
              <div className="text-xs text-slate-500">Verified Electronic Signature · SmartCare LIS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
