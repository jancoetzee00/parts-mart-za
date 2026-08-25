import { InventoryItem, Seller, SellerSpecial } from '../types';

/**
 * Normalizes phone numbers for WhatsApp deep links (wa.me)
 * Handles South African local prefixes (e.g., 082 123 4567 -> 27821234567)
 */
export function formatWhatsappPhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');

  // If local South African format starting with 0
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '27' + digits.slice(1);
  }

  return digits;
}

/**
 * Formats the Out-of-Office auto-reply block for WhatsApp messages
 */
export function formatOutOfOfficeNotice(seller?: Seller): string {
  if (!seller?.outOfOfficeEnabled) return '';
  const message = seller.outOfOfficeMessage?.trim() || 'Our scrap yard sales desk is currently out of office. Inquiries will be reviewed as soon as trading hours resume.';
  const returnDateInfo = seller.outOfOfficeReturnDate ? `\n⏳ *Expected Reopen/Return:* ${seller.outOfOfficeReturnDate}` : '';

  return `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🏖️ *YARD OUT-OF-OFFICE AUTO-REPLY*${returnDateInfo}\n"${message}"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Builds raw text for a part inquiry message (including Out-of-Office notice if enabled)
 */
export function buildWhatsappInquiryText(item: InventoryItem, seller?: Seller): string {
  const formattedPrice = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0
  }).format(item.priceZar);

  const contactName = seller?.contactName || 'Sales Desk';
  const companyName = seller?.companyName || item.sellerName;
  const conditionLabel = item.condition.replace(/_/g, ' ').toUpperCase();
  const partNumberLine = item.partNumber ? `\n• *Part/OEM No:* ${item.partNumber}` : '';
  const vehicleLine = `${item.make} ${item.model}${item.year ? ` (${item.year})` : ''}`;
  const outOfOfficeBlock = formatOutOfOfficeNotice(seller);

  return `*PART INQUIRY | Part-Smart ZA*

Hello ${contactName} (${companyName}),

I found your listing on the *Part-Smart.ZA* marketplace and would like to inquire about:

📦 *Part:* ${item.title}
💰 *Price:* ${formattedPrice}
🚜 *Vehicle/Machinery:* ${vehicleLine}
🏷️ *Condition:* ${conditionLabel}${partNumberLine}
📍 *Location:* ${item.city}, ${item.province}

Please confirm:
1. Is this item currently in stock and available?
2. What are the collection or courier dispatch options to my area?

Thank you!${outOfOfficeBlock}`;
}

/**
 * Generates a pre-filled WhatsApp deep link URL with item metadata and inquiry template
 */
export function generateWhatsappInquiryUrl(item: InventoryItem, seller?: Seller): string {
  const phone = seller?.whatsapp || item.sellerWhatsapp || seller?.phone || item.sellerPhone || '27820000000';
  const cleanPhone = formatWhatsappPhoneNumber(phone);
  const message = buildWhatsappInquiryText(item, seller);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a pre-filled WhatsApp deep link URL for promotional specials and clearance deals
 */
export function generateWhatsappSpecialInquiryUrl(special: SellerSpecial, seller?: Seller): string {
  const phone = seller?.whatsapp || special.sellerWhatsapp || seller?.phone || special.sellerPhone || '27820000000';
  const cleanPhone = formatWhatsappPhoneNumber(phone);

  const specialPrice = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0
  }).format(special.specialPriceZar);

  const originalPrice = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0
  }).format(special.originalPriceZar);

  const savings = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0
  }).format(Math.max(0, special.originalPriceZar - special.specialPriceZar));

  const companyName = seller?.companyName || special.sellerName;
  const outOfOfficeBlock = formatOutOfOfficeNotice(seller);

  const message =
`*SPECIAL PROMO INQUIRY | Part-Smart ZA*

Hello ${companyName} Sales Desk,

I saw your promotional special on *Part-Smart.ZA* and would like to claim this deal:

🔥 *Special Deal:* ${special.title}
🏷️ *Promo Badge:* ${special.badge}
💰 *Special Price:* ${specialPrice} (Normal Price: ${originalPrice} - Save ${savings})
📍 *Location:* ${special.sellerCity}, ${special.sellerProvince}
📝 *Offer Terms:* ${special.terms || 'Subject to stock availability'}

Please let me know if this special is still active and how to proceed with payment and courier delivery or collection.

Thank you!${outOfOfficeBlock}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
