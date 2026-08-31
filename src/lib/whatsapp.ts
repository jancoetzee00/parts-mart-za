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

/**
 * Builds custom WhatsApp broadcast message text for new inventory arrivals
 */
export function buildInventoryBroadcastText(
  seller: Seller,
  items: InventoryItem[],
  customerName?: string,
  templateId: 'new_arrivals' | 'stripping_alert' | 'trade_wholesale' | 'custom' = 'new_arrivals',
  customMessageTemplate?: string,
  promoNote?: string
): string {
  const companyName = seller.companyName;
  const location = `${seller.city}, ${seller.province}`;
  const phone = seller.phone || seller.whatsapp;
  const outOfOfficeBlock = formatOutOfOfficeNotice(seller);
  const greeting = customerName?.trim() ? `Hi ${customerName.trim()}` : `Hello`;

  // Format the item list
  const formattedItemsList = items.map((item, idx) => {
    const formattedPrice = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(item.priceZar);

    const conditionTag = item.condition.replace(/_/g, ' ').toUpperCase();
    const partNo = item.partNumber ? ` [OEM: ${item.partNumber}]` : '';

    return `${idx + 1}. *${item.title}* (${item.make} ${item.model})
   🏷️ ${conditionTag}${partNo}
   💰 Price: ${formattedPrice}`;
  }).join('\n\n');

  const promoSection = promoNote?.trim() ? `\n\n🎁 *Special VIP Deal:* ${promoNote.trim()}` : '';

  if (templateId === 'custom' && customMessageTemplate?.trim()) {
    let replaced = customMessageTemplate
      .replace(/{CustomerName}/g, customerName?.trim() || 'Valued Customer')
      .replace(/{YardName}/g, companyName)
      .replace(/{Location}/g, location)
      .replace(/{Phone}/g, phone)
      .replace(/{InventoryList}/g, formattedItemsList)
      .replace(/{PromoNote}/g, promoNote?.trim() || '');
    return `${replaced}${outOfOfficeBlock}`;
  }

  if (templateId === 'stripping_alert') {
    const primaryItem = items[0];
    const headerTitle = primaryItem ? `${primaryItem.make} ${primaryItem.model}` : 'New Commercial Vehicle';
    return `🚨 *NOW STRIPPING FOR SPARES | ${companyName}*

${greeting},

We have just landed a *${headerTitle}* in our yard for stripping! All major components are currently being tested and cataloged:

${formattedItemsList}${promoSection}

📍 *Yard Location:* ${location}
📞 *Direct Sales Line / WhatsApp:* ${phone}

⚡ *First come, first served on high-demand parts.* Reply directly to this WhatsApp message to reserve parts or arrange courier delivery across SA.${outOfOfficeBlock}`;
  }

  if (templateId === 'trade_wholesale') {
    return `📦 *EXCLUSIVE TRADE & FLEET ARRIVALS | ${companyName}*

${greeting},

Here are our latest fresh stock arrivals available for immediate dispatch at wholesale trade pricing:

${formattedItemsList}${promoSection}

📍 *Scrap Yard / Depot:* ${location}
💬 *Order Line:* ${phone}

Reply with the part number or item name to confirm availability and lock in your trade order.${outOfOfficeBlock}`;
  }

  // Default: new_arrivals
  return `🆕 *NEW INVENTORY ARRIVALS | ${companyName}*

${greeting},

We have just added new spares and machinery components to our yard inventory that may fit your fleet or workshop requirements:

${formattedItemsList}${promoSection}

📍 *Yard Location:* ${location}
🚚 *Nationwide Courier & Local Collection Available*

Reply directly to this WhatsApp message to inquire or arrange inspection.${outOfOfficeBlock}`;
}

/**
 * Generates a wa.me direct link for a specific customer with pre-filled broadcast text
 */
export function generateWhatsappBroadcastUrl(
  customerPhone: string,
  message: string
): string {
  const cleanPhone = formatWhatsappPhoneNumber(customerPhone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface GridWhatsappPayloadOptions {
  seller: Seller;
  items: InventoryItem[];
  formatStyle?: 'catalog' | 'compact' | 'clearance' | 'stripping' | 'custom';
  groupByCategory?: boolean;
  includePrices?: boolean;
  includeOem?: boolean;
  includeCondition?: boolean;
  includeLocation?: boolean;
  includeContactDetails?: boolean;
  customHeadline?: string;
  customIntro?: string;
  customOutro?: string;
  promoNote?: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  heavy_equipment: '🚜 HEAVY EQUIPMENT & PLANT MACHINERY',
  trucks: '🚚 TRUCKS & COMMERCIAL VEHICLES',
  minibus_taxis: '🚐 MINIBUS & TAXI SPARES',
  cars: '🚗 CARS, BAKKIES & PASSENGER SPARES'
};

/**
 * Builds a formatted WhatsApp message payload representing the seller's inventory grid
 * tailored for broadcasting to customer lists, trade groups, and client contacts.
 */
export function buildGridWhatsappPayload(options: GridWhatsappPayloadOptions): string {
  const {
    seller,
    items,
    formatStyle = 'catalog',
    groupByCategory = true,
    includePrices = true,
    includeOem = true,
    includeCondition = true,
    includeLocation = true,
    includeContactDetails = true,
    customHeadline,
    customIntro,
    customOutro,
    promoNote
  } = options;

  if (items.length === 0) {
    return `*INVENTORY CATALOG | ${seller.companyName}*\n\nNo inventory items currently selected.`;
  }

  const location = `${seller.city}, ${seller.province}`;
  const phone = seller.phone || seller.whatsapp;
  const outOfOfficeBlock = formatOutOfOfficeNotice(seller);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Helper to format a single item
  const renderItemLine = (item: InventoryItem, index?: number): string => {
    const prefix = typeof index === 'number' ? `${index + 1}. ` : '• ';
    const priceText = includePrices ? ` - *${formatPrice(item.priceZar)}*` : '';
    const condText = includeCondition ? ` [${item.condition.replace(/_/g, ' ').toUpperCase()}]` : '';
    const oemText = includeOem && item.partNumber ? ` (OEM: ${item.partNumber})` : '';

    if (formatStyle === 'compact') {
      return `${prefix}*${item.title}* (${item.make} ${item.model})${priceText}${oemText}`;
    }

    if (formatStyle === 'clearance') {
      return `🔥 ${prefix}*${item.title}* | ${item.make} ${item.model}
   💰 *Special Trade Price:* ${formatPrice(item.priceZar)}${condText}${oemText}`;
    }

    if (formatStyle === 'stripping') {
      return `⚙️ ${prefix}*${item.title}*
   🚜 ${item.make} ${item.model}${condText}${oemText}
   💵 *Price:* ${formatPrice(item.priceZar)}`;
    }

    // Default: 'catalog'
    return `${prefix}*${item.title}* (${item.make} ${item.model})
   🏷️ Condition: ${item.condition.replace(/_/g, ' ').toUpperCase()}${oemText}
   💰 Price: ${formatPrice(item.priceZar)}`;
  };

  // Build items block (grouped or continuous)
  let itemsContent = '';

  if (groupByCategory && formatStyle !== 'compact') {
    const grouped: Record<string, InventoryItem[]> = {};
    items.forEach(item => {
      const cat = item.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const categoryBlocks: string[] = [];
    Object.entries(grouped).forEach(([catKey, catItems]) => {
      const catTitle = CATEGORY_NAMES[catKey] || `📦 ${catKey.toUpperCase()} SPARES`;
      const catLines = catItems.map((item, idx) => renderItemLine(item, idx)).join('\n\n');
      categoryBlocks.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n*${catTitle}* (${catItems.length})\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${catLines}`);
    });

    itemsContent = categoryBlocks.join('\n\n');
  } else {
    itemsContent = items.map((item, idx) => renderItemLine(item, idx)).join(formatStyle === 'compact' ? '\n' : '\n\n');
  }

  // Header / Headline
  let headline = '';
  if (customHeadline?.trim()) {
    headline = customHeadline.trim();
  } else if (formatStyle === 'clearance') {
    headline = `🔥 *CLEARANCE & STOCK SPECIALS | ${seller.companyName.toUpperCase()}* 🔥`;
  } else if (formatStyle === 'stripping') {
    headline = `🚨 *YARD STRIPPING & DISMANTLING CATALOG | ${seller.companyName.toUpperCase()}* 🚨`;
  } else if (formatStyle === 'compact') {
    headline = `📋 *CURRENT INVENTORY PRICE LIST | ${seller.companyName.toUpperCase()}*`;
  } else {
    headline = `📦 *CURRENT YARD INVENTORY CATALOG | ${seller.companyName.toUpperCase()}*`;
  }

  // Intro
  let intro = '';
  if (customIntro?.trim()) {
    intro = customIntro.trim();
  } else if (formatStyle === 'clearance') {
    intro = `Good day Valued Clients & Fleet Managers,\n\nWe have marked down the following spares and machine components for immediate clearance from our yard in *${location}*:`;
  } else if (formatStyle === 'stripping') {
    intro = `Good day Trade Partners,\n\nBelow is our updated catalog of salvaged machinery, bakkie, truck, and heavy plant parts ready for immediate collection or courier dispatch:`;
  } else if (formatStyle === 'compact') {
    intro = `Hi everyone! Here is our quick-reference spares inventory list as of today (${items.length} parts available):`;
  } else {
    intro = `Good day Valued Trade Partners & Workshop Owners,\n\nPlease find our updated yard inventory list below. All items are authenticated direct yard stock ready for immediate dispatch or collection:`;
  }

  // Promo note section
  const promoSection = promoNote?.trim()
    ? `\n\n🎁 *TRADE DISCOUNT / SPECIAL OFFER:*\n${promoNote.trim()}`
    : '';

  // Outro & Contact
  let outro = '';
  if (customOutro?.trim()) {
    outro = customOutro.trim();
  } else {
    outro = `⚡ *Reserve Parts:* Reply directly to this WhatsApp message with the item name or OEM part number.\n🚚 *Courier:* Nationwide delivery across South Africa & cross-border available.\n📍 *Yard Address:* ${seller.address ? `${seller.address}, ` : ''}${location}`;
  }

  let contactBlock = '';
  if (includeContactDetails) {
    contactBlock = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📞 *Direct Sales Counter / WhatsApp:* ${phone}\n🏢 *Yard:* ${seller.companyName}\n📍 *Location:* ${location}${outOfOfficeBlock}`;
  }

  return `${headline}

${intro}

${itemsContent}${promoSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${outro}${contactBlock}`;
}

/**
 * Splits a long payload into chunks <= maxChunkLength without breaking lines mid-item.
 */
export function splitWhatsappPayloadIntoChunks(payload: string, maxChunkLength = 3200): string[] {
  if (payload.length <= maxChunkLength) return [payload];

  const lines = payload.split('\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + '\n' + line).length > maxChunkLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If a single line exceeds max, push it directly
      if (line.length > maxChunkLength) {
        chunks.push(line);
        continue;
      }
    }
    currentChunk = currentChunk ? currentChunk + '\n' + line : line;
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map((chunk, idx, arr) => {
    if (arr.length > 1) {
      return `[PART ${idx + 1} OF ${arr.length}]\n\n${chunk}`;
    }
    return chunk;
  });
}

/**
 * Generates an open WhatsApp URL without recipient so user can select contacts or groups
 */
export function generateGenericWhatsappShareUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}


