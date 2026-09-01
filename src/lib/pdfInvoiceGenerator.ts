import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Seller, SubscriptionPaymentRecord, OwnerSettings } from '../types';

export interface InvoicePdfOptions {
  seller: Seller;
  payment: SubscriptionPaymentRecord;
  ownerSettings: OwnerSettings;
}

/**
 * Format currency in ZAR
 */
function formatZar(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Generates and downloads a clean, professional, print-ready PDF Tax Invoice & Receipt
 */
export async function downloadInvoicePdf({ seller, payment, ownerSettings }: InvoicePdfOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryDark = [15, 23, 42]; // Slate 900
  const amberAccent = [245, 158, 11]; // Amber 500
  const amberDark = [180, 83, 9]; // Amber 700
  const textDark = [30, 41, 59]; // Slate 800
  const textMuted = [100, 116, 139]; // Slate 500
  const emeraldGreen = [16, 185, 129]; // Emerald 500
  const bgLight = [248, 250, 252]; // Slate 50
  const borderLight = [226, 232, 240]; // Slate 200

  // 1. Top Header Bar
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  doc.setFillColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.rect(0, 8, pageWidth, 2, 'F');

  let cursorY = 22;

  // 2. Company Brand & Invoice Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('PART-SMART', margin, cursorY);
  
  const partSmartWidth = doc.getTextWidth('PART-SMART');
  doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
  doc.text(' ZA', margin + partSmartWidth, cursorY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('HEAVY MACHINERY & AUTO SPARES DIRECTORY', margin, cursorY + 5);

  // Supplier Details (Left)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Part-Smart ZA (Pty) Ltd', margin, cursorY + 11);
  doc.text('Reg No: 2024/891230/07', margin, cursorY + 15);
  doc.text('VAT Reg No: 4980123984', margin, cursorY + 19);
  doc.text('Highveld Industrial Park, Gauteng, South Africa', margin, cursorY + 23);
  doc.text('accounts@partsmart.co.za | +27 11 892 4000', margin, cursorY + 27);

  // Invoice Title & Badges (Right)
  const rightX = pageWidth - margin;
  
  // Tax Invoice Badge
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.roundedRect(rightX - 45, cursorY - 6, 45, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', rightX - 22.5, cursorY - 1, { align: 'center' });

  // Status Badge
  const isVerified = payment.status === 'verified';
  if (isVerified) {
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.roundedRect(rightX - 35, cursorY + 4, 35, 6, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(5, 150, 105);
    doc.text('PAID & SETTLED', rightX - 17.5, cursorY + 8.2, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199); // Amber 50
    doc.setDrawColor(amberDark[0], amberDark[1], amberDark[2]);
    doc.roundedRect(rightX - 45, cursorY + 4, 45, 6, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text('PENDING VERIFICATION', rightX - 22.5, cursorY + 8.2, { align: 'center' });
  }

  // Invoice Meta Table (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Invoice Number:', rightX - 45, cursorY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
  doc.text(payment.invoiceNumber, rightX, cursorY + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Invoice Date:', rightX - 45, cursorY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(new Date(payment.paymentDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }), rightX, cursorY + 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Payment Ref:', rightX - 45, cursorY + 25);
  doc.setFont('courier', 'bold');
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(payment.reference, rightX, cursorY + 25, { align: 'right' });

  cursorY = 57;

  // Divider Line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  cursorY += 6;

  // 3. Customer / Seller Info Card
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
  doc.text('BILLED TO (REGISTERED EQUIPMENT YARD):', margin + 5, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text(seller.companyName, margin + 5, cursorY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Attention: ${seller.contactName || 'Yard Manager'}`, margin + 5, cursorY + 17);
  doc.text(`${seller.address || 'Yard Location'}, ${seller.city || ''}, ${seller.province || 'South Africa'}`, margin + 5, cursorY + 22);
  doc.text(`Phone / WhatsApp: ${seller.phone || 'N/A'} | Email: ${seller.email || 'N/A'}`, margin + 5, cursorY + 27);

  // QR Code on right side of Billed To box for digital authenticity
  try {
    const qrData = `https://partsmart.co.za/verify-invoice?inv=${payment.invoiceNumber}&seller=${encodeURIComponent(seller.companyName)}&amount=${payment.amountZar}&ref=${payment.reference}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 90 });
    doc.addImage(qrDataUrl, 'PNG', rightX - 28, cursorY + 2.5, 26, 26);
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Scan to Verify', rightX - 15, cursorY + 30.5, { align: 'center' });
  } catch (err) {
    // QR code generation fallback
  }

  cursorY += 40;

  // 4. Line Items Table Header
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 8, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION & SERVICE PERIOD', margin + 4, cursorY + 5.5);
  doc.text('QTY', rightX - 70, cursorY + 5.5, { align: 'center' });
  doc.text('UNIT PRICE (EXCL)', rightX - 40, cursorY + 5.5, { align: 'right' });
  doc.text('TOTAL (ZAR)', rightX - 4, cursorY + 5.5, { align: 'right' });

  cursorY += 12;

  // Line Item Row
  const exVat = payment.amountZar - payment.vatZar;
  const pStart = new Date(payment.billingCycleStart).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  const pEnd = new Date(payment.billingCycleEnd).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text(payment.planName, margin + 4, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Active Subscription Period: ${pStart} to ${pEnd}`, margin + 4, cursorY + 4.5);
  doc.text('Directory placement, classified inventory indexing, and direct customer WhatsApp leads routing.', margin + 4, cursorY + 9);

  // Line Item Amounts
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('1', rightX - 70, cursorY + 3, { align: 'center' });
  doc.text(formatZar(exVat), rightX - 40, cursorY + 3, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatZar(exVat), rightX - 4, cursorY + 3, { align: 'right' });

  cursorY += 18;

  // Divider Line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  cursorY += 6;

  // 5. Totals & Tax Breakdown Box (Right)
  const totalsX = rightX - 85;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Subtotal (Excl. VAT):', totalsX, cursorY);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formatZar(exVat), rightX - 4, cursorY, { align: 'right' });

  cursorY += 5.5;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('15% South African VAT:', totalsX, cursorY);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(formatZar(payment.vatZar), rightX - 4, cursorY, { align: 'right' });

  cursorY += 3;
  doc.setDrawColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.setLineWidth(0.8);
  doc.line(totalsX, cursorY, rightX, cursorY);

  cursorY += 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(totalsX - 3, cursorY - 4.5, 88, 9, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.text('TOTAL PAID (INCL. VAT):', totalsX, cursorY + 1.5);
  doc.setFontSize(11);
  doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
  doc.text(formatZar(payment.amountZar), rightX - 4, cursorY + 1.5, { align: 'right' });

  cursorY += 18;

  // 6. Payment Settlement & Banking Information Card
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, cursorY, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(amberDark[0], amberDark[1], amberDark[2]);
  doc.text('PAYMENT SETTLEMENT & BENEFICIARY BANKING DETAILS', margin + 5, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  
  doc.text(`Payment Method: ${payment.paymentMethod}`, margin + 5, cursorY + 12);
  doc.text(`Beneficiary Bank: ${ownerSettings.bankingDetails.bankName}`, margin + 5, cursorY + 17);
  doc.text(`Account Holder: ${ownerSettings.bankingDetails.accountHolder}`, margin + 5, cursorY + 22);

  const midX = margin + contentWidth / 2;
  doc.text(`Bank Reference: ${payment.reference}`, midX, cursorY + 12);
  doc.text(`Account Number: ${ownerSettings.bankingDetails.accountNumber}`, midX, cursorY + 17);
  doc.text(`Branch Code: ${ownerSettings.bankingDetails.branchCode}`, midX, cursorY + 22);
  doc.text(`Payment Proof Status: ${isVerified ? 'Verified & Reconciled' : 'Pending Verification'}`, midX, cursorY + 27);

  cursorY += 44;

  // 7. SARS VAT Act Compliance Legal Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const legalNotice = 'This document is a computer-generated electronic Tax Invoice issued in accordance with Section 20(4) of the South African Value-Added Tax Act, 1991 (Act No. 89 of 1991). The tax invoice is valid without a physical signature. All queries regarding this invoice can be directed to accounts@partsmart.co.za.';
  const splitNotice = doc.splitTextToSize(legalNotice, contentWidth);
  doc.text(splitNotice, margin, cursorY);

  // 8. Footer Bar
  const footerY = pageHeight - 12;
  doc.setFillColor(primaryDark[0], primaryDark[1], primaryDark[2]);
  doc.rect(0, footerY, pageWidth, 12, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PART-SMART ZA', margin, footerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('South Africa\'s Dedicated Heavy Machinery & Vehicle Spares Network', margin + 30, footerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`Invoice: ${payment.invoiceNumber} | Page 1 of 1`, rightX, footerY + 7, { align: 'right' });

  // Save the PDF file
  const sanitizedInvoice = payment.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `PartSmart_TaxInvoice_${sanitizedInvoice}.pdf`;
  doc.save(filename);
}
