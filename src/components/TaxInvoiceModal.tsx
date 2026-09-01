import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Mail,
  Check,
  CheckCircle2,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  ShieldCheck,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Seller, SubscriptionPaymentRecord, OwnerSettings } from '../types';
import { downloadInvoicePdf, generatePaymentConfirmationEmailContent } from '../lib/pdfInvoiceGenerator';

interface TaxInvoiceModalProps {
  seller: Seller;
  payment: SubscriptionPaymentRecord;
  ownerSettings: OwnerSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  seller,
  payment,
  ownerSettings,
  isOpen,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'invoice' | 'email'>('invoice');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const taxConfig = ownerSettings.taxInvoiceSettings || {
    enabled: true,
    autoAttachToEmail: true,
    autoSendOnApproval: true,
    companyLegalName: 'Part-Smart ZA (Pty) Ltd',
    tradingName: 'Part-Smart ZA Heavy & Commercial Spares Network',
    vatRegistrationNumber: '4980123984',
    cipcRegistrationNumber: '2024/891230/07',
    registeredAddress: 'Building 4, Highveld Techno Park, Centurion, Gauteng, 0157, South Africa',
    billingEmail: 'accounts@partsmart.co.za',
    billingPhone: '+27 11 892 4000',
    vatRatePercent: 15,
    invoiceNumberPrefix: 'INV-PSZA-',
    nextInvoiceSequence: 1048,
    taxComplianceNotice: 'Valid electronic Tax Invoice issued in accordance with Section 20(4) of the South African Value-Added Tax Act, 1991 (Act No. 89 of 1991). The tax invoice is valid without a physical signature.',
    emailSubjectTemplate: 'Payment Confirmed: Tax Invoice {invoiceNumber} - Part-Smart ZA',
    emailBodyCustomNote: 'Thank you for your prompt subscription settlement. Your equipment yard is now fully ACTIVE and featured across South Africa. Your SARS-compliant Tax/VAT Invoice is attached below.'
  };

  const emailData = generatePaymentConfirmationEmailContent({
    seller,
    payment,
    ownerSettings
  });

  const exVatAmount = payment.amountZar - payment.vatZar;

  const formatZar = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadInvoicePdf({
        seller,
        payment,
        ownerSettings
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Error downloading invoice:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailData.plainText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleSimulateResendEmail = () => {
    setEmailSentNotice(`Confirmation email with Tax Invoice ${payment.invoiceNumber} attached has been re-sent to ${seller.email}!`);
    setTimeout(() => setEmailSentNotice(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl text-white my-auto flex flex-col print:border-none print:shadow-none print:max-w-none print:w-full print:max-h-none">
        
        {/* Top Header - Screen Only */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  SARS Compliant Tax Invoice & Payment Confirmation
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Section 20(4) VAT Act
                </span>
                {payment.taxInvoiceAttached !== false && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Auto-Attached to Email
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Invoice <span className="font-mono text-amber-400">{payment.invoiceNumber}</span> &bull; {seller.companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Switch & Actions Ribbon - Screen Only */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap print:hidden">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('invoice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'invoice'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Formal Tax Invoice (Print View)
            </button>
            <button
              onClick={() => setViewMode('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'email'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Automated Email Confirmation & Attachment
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <span>Generating PDF...</span>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> PDF Downloaded
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {/* Email Resend Toast */}
        {emailSentNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 px-6 py-2.5 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{emailSentNotice}</span>
            </div>
            <button onClick={() => setEmailSentNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL CONTENT */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          
          {viewMode === 'invoice' ? (
            /* ========================================================================= */
            /* 1. FORMAL TAX INVOICE (SARS COMPLIANT)                                   */
            /* ========================================================================= */
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto border border-slate-200">
              
              {/* Brand Letterhead & Title */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-6">
                <div>
                  <div className="flex items-center gap-1 text-2xl font-black tracking-tight text-slate-950">
                    PART-SMART<span className="text-amber-500"> ZA</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                    Heavy Machinery & Commercial Spares Network
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                    <div className="font-bold text-slate-900">{taxConfig.companyLegalName}</div>
                    <div>CIPC Reg No: <span className="font-mono">{taxConfig.cipcRegistrationNumber}</span></div>
                    <div>SARS VAT Reg No: <span className="font-mono font-bold text-slate-900">{taxConfig.vatRegistrationNumber}</span></div>
                    <div>{taxConfig.registeredAddress}</div>
                    <div>{taxConfig.billingEmail} | {taxConfig.billingPhone}</div>
                  </div>
                </div>

                <div className="text-right sm:max-w-xs">
                  <div className="inline-block bg-slate-950 text-white text-xs font-black px-4 py-1 rounded-md tracking-wider uppercase">
                    TAX INVOICE
                  </div>
                  <div className="mt-2 text-xs">
                    <div className="text-slate-500">Invoice Number:</div>
                    <div className="font-bold font-mono text-base text-amber-600">{payment.invoiceNumber}</div>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-slate-500">Date: </span>
                    <span className="font-semibold">{new Date(payment.paymentDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="mt-1 text-xs">
                    <span className="text-slate-500">Payment Ref: </span>
                    <span className="font-mono font-bold text-emerald-700">{payment.reference}</span>
                  </div>
                  
                  {/* Status Stamp */}
                  <div className="mt-3">
                    {payment.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" /> PAID & RECONCILED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-md text-[11px] font-bold">
                        PENDING VERIFICATION
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Billed To Card */}
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    BILLED TO (REGISTERED EQUIPMENT YARD / SUBSCRIBER):
                  </div>
                  <div className="text-base font-bold text-slate-950 mt-0.5">
                    {seller.companyName}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    <div>Attention: <span className="font-medium text-slate-800">{seller.contactName || 'Manager'}</span></div>
                    <div>{seller.address || 'Registered Yard'}, {seller.city}, {seller.province}, South Africa</div>
                    <div>Email: {seller.email} &bull; Tel/WhatsApp: {seller.phone}</div>
                    {payment.buyerVatNumber && (
                      <div>Buyer VAT Reg No: <span className="font-mono font-bold">{payment.buyerVatNumber}</span></div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center flex flex-col items-center">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <span className="text-[9px] text-slate-500 font-semibold mt-1">SARS Digital QR</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-2.5 px-3 rounded-l-lg font-bold">Description & Subscription Service</th>
                      <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                      <th className="py-2.5 px-3 text-right font-bold">Price (Excl. VAT)</th>
                      <th className="py-2.5 px-3 rounded-r-lg text-right font-bold">Total (ZAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-sm">{payment.planName}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Billing Cycle: {new Date(payment.billingCycleStart).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} to{' '}
                          {new Date(payment.billingCycleEnd).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Automated nationwide directory indexing, WhatsApp buyer leads routing & verified yard badge.
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">1</td>
                      <td className="py-3 px-3 text-right text-slate-700">{formatZar(exVatAmount)}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{formatZar(exVatAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="mt-4 flex justify-end">
                <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal (Excl. VAT):</span>
                    <span className="font-semibold text-slate-900">{formatZar(exVatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>15% South African VAT:</span>
                    <span className="font-semibold text-slate-900">{formatZar(payment.vatZar)}</span>
                  </div>
                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-bold text-slate-950">
                    <span>TOTAL DUE / PAID:</span>
                    <span className="text-base text-amber-600">{formatZar(payment.amountZar)}</span>
                  </div>
                </div>
              </div>

              {/* Beneficiary & Payment Method Card */}
              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[10px] text-amber-700">Settlement Info</div>
                  <div>Payment Method: <span className="font-semibold text-slate-800">{payment.paymentMethod}</span></div>
                  <div>Bank Reference: <span className="font-mono font-bold text-slate-800">{payment.reference}</span></div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 uppercase text-[10px] text-amber-700">Beneficiary Bank</div>
                  <div>Bank: {ownerSettings.bankingDetails.bankName}</div>
                  <div>Account: <span className="font-mono">{ownerSettings.bankingDetails.accountNumber}</span> &bull; Branch: <span className="font-mono">{ownerSettings.bankingDetails.branchCode}</span></div>
                </div>
              </div>

              {/* Legal Notice Footer */}
              <div className="mt-6 border-t border-slate-200 pt-4 text-[10px] text-slate-500 text-center leading-relaxed">
                {taxConfig.taxComplianceNotice}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. AUTOMATED EMAIL CONFIRMATION PREVIEW                                  */
            /* ========================================================================= */
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Automated Email Dispatch Simulation
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Ready to Send
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This email is automatically composed, branded, and dispatched to <span className="text-white font-mono">{seller.email}</span> with the PDF Tax Invoice attached whenever a payment is confirmed.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? 'Copied' : 'Copy Email Body'}
                  </button>

                  <button
                    onClick={handleSimulateResendEmail}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Mail className="w-3.5 h-3.5" /> Send Confirmation Email Now
                  </button>
                </div>
              </div>

              {/* Simulated Mail Client Window */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Email Header Bar */}
                <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-300">From:</span>
                    <span className="font-mono text-slate-200">{taxConfig.companyLegalName} &lt;{taxConfig.billingEmail}&gt;</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-300">To:</span>
                    <span className="font-mono text-amber-300">{seller.contactName} &lt;{seller.email}&gt;</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-slate-300">Subject:</span>
                    <span className="font-bold text-white">{emailData.subject}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <span className="font-semibold text-slate-300">Attachment:</span>
                    <button
                      onClick={handleDownload}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> {emailData.attachmentFilename}
                      <Download className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Email Body Rendering */}
                <div className="p-6 bg-slate-900/50">
                  <div
                    className="prose prose-invert max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: emailData.html }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
