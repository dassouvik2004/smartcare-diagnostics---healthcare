import React, { useState } from 'react';
import { CreditCard, ShieldCheck, AlertTriangle, CheckCircle2, X, RefreshCw, Lock } from 'lucide-react';
import type { Booking, Payment } from '../types';

interface PaymentGatewayModalProps {
  booking: Booking;
  onClose: () => void;
  onPaymentCompleted: (payment: Payment, updatedBooking: Booking) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  booking,
  onClose,
  onPaymentCompleted,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'BKASH' | 'NAGAD' | 'NET_BANKING'>('CARD');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8891');
  const [cardHolder, setCardHolder] = useState(booking.patientName);
  const [expiry, setExpiry] = useState('08/29');
  const [cvv, setCvv] = useState('842');
  const [mobileAccount, setMobileAccount] = useState(booking.patientPhone);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [failedState, setFailedState] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<Payment | null>(null);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setFailedState(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod,
          simulateFailure,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      if (data.payment.paymentStatus === 'FAILED') {
        setFailedState(
          `Transaction ${data.payment.transactionId} was declined by sandbox bank gateway. Please retry without failure simulation.`
        );
      } else {
        setSuccessPayment(data.payment);
        setTimeout(() => {
          onPaymentCompleted(data.payment, data.booking);
        }, 1100);
      }
    } catch (err: unknown) {
      setFailedState(err instanceof Error ? err.message : 'Network error during payment');
    } finally {
      setProcessing(false);
    }
  };

  const bookingTitle =
    booking.bookingType === 'DOCTOR_APPOINTMENT'
      ? `Consultation: ${booking.doctorName}`
      : booking.bookingType === 'DIAGNOSTIC_TEST'
      ? `Diagnostic Tests: ${booking.testNames?.join(', ')}`
      : `Home Healthcare: ${booking.homeServiceName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-teal-400" />
            <div>
              <h3 className="text-sm font-semibold tracking-tight">SmartCare Sandbox Payment Gateway</h3>
              <p className="text-xs text-slate-400 font-mono tabular-nums">Booking Ref: {booking.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Close payment gateway"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Summary Bar */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Patient: {booking.patientName}</p>
              <p className="text-sm font-medium text-slate-900 line-clamp-1 mt-0.5">{bookingTitle}</p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                Scheduled: {booking.appointmentDate} · {booking.appointmentTime}
              </p>
            </div>
            <div className="text-right shrink-0 pl-4">
              <span className="text-xs text-slate-500 block">Payable Amount</span>
              <span className="text-xl font-semibold font-mono tabular-nums text-teal-700">
                BDT {booking.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {successPayment ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-semibold text-slate-900">Payment Verified & Booking Confirmed</h4>
              <div className="text-xs text-slate-600 font-mono tabular-nums space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200 max-w-sm mx-auto text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID:</span>
                  <span className="font-semibold text-slate-900">{successPayment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking ID:</span>
                  <span className="font-semibold text-teal-700">{successPayment.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="text-slate-900">{successPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-700 font-semibold">SUCCESS · CONFIRMED</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePayNow} className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100 rounded-lg">
                  {(['CARD', 'BKASH', 'NAGAD', 'NET_BANKING'] as const).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        paymentMethod === method
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {method === 'CARD'
                        ? 'Card'
                        : method === 'BKASH'
                        ? 'bKash'
                        : method === 'NAGAD'
                        ? 'Nagad'
                        : 'NetBank'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'CARD' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Card Number (Sandbox)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                        required
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Cardholder</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <label className="block text-xs font-medium text-slate-700">
                    {paymentMethod} Registered Account / Wallet Number
                  </label>
                  <input
                    type="text"
                    value={mobileAccount}
                    onChange={(e) => setMobileAccount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Sandbox OTP verification is auto-approved in academic test mode.
                  </p>
                </div>
              )}

              {/* Academic Sandbox Failure/Retry Tester */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Simulate Gateway Failure (Test Retry Flow)</span>
                </label>
                <span className="text-xs text-slate-400 font-mono">SSL Sandbox</span>
              </div>

              {failedState && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Payment Gateway Declined</p>
                    <p>{failedState}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Pay Later
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Transaction...</span>
                    </>
                  ) : failedState ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Payment · BDT {booking.amount.toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Pay BDT {booking.amount.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
