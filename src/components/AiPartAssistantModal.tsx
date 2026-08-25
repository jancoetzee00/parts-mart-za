import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Truck,
  Package,
  Wrench,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  Phone,
  RefreshCw,
  MapPin,
  Building2,
  HardHat,
  Car,
  ChevronDown,
  Send,
  Zap,
  SlidersHorizontal,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { PROVINCES_LIST } from '../data/initialData';
import { generateWhatsappInquiryUrl } from '../lib/whatsapp';

interface AiPartAssistantModalProps {
  onClose: () => void;
  initialItem?: InventoryItem | null;
}

type QuickReplyCategory = 'shipping' | 'stock' | 'fitment' | 'payment' | 'seller_reply';

interface TemplateOption {
  id: string;
  title: string;
  category: QuickReplyCategory;
  summary: string;
  getTemplate: (item: InventoryItem | null, customData: any) => string;
}

export const AiPartAssistantModal: React.FC<AiPartAssistantModalProps> = ({
  onClose,
  initialItem
}) => {
  const { inventory, sellers, favorites, incrementViews } = useApp();

  // Tab mode
  const [activeTab, setActiveTab] = useState<'quick_replies' | 'ai_chat' | 'seller_ad'>('quick_replies');

  // Selected item context
  const [selectedItemId, setSelectedItemId] = useState<string>(
    initialItem ? initialItem.id : inventory.length > 0 ? inventory[0].id : ''
  );

  // Quick reply category filter
  const [selectedCategory, setSelectedCategory] = useState<QuickReplyCategory>('shipping');

  // Customization fields for dynamic templates
  const [destinationCity, setDestinationCity] = useState('Johannesburg');
  const [buyerVin, setBuyerVin] = useState('');
  const [courierType, setCourierType] = useState<'standard' | 'heavy_freight' | 'collection'>('standard');
  const [urgency, setUrgency] = useState<'standard' | 'urgent'>('standard');

  // Template copy & action states
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'concise' | 'friendly'>('professional');

  // Currently selected item object
  const currentItem = useMemo(() => {
    return inventory.find((i) => i.id === selectedItemId) || inventory[0] || null;
  }, [inventory, selectedItemId]);

  const currentSeller = useMemo(() => {
    if (!currentItem) return null;
    return sellers.find((s) => s.id === currentItem.sellerId) || null;
  }, [sellers, currentItem]);

  // Quick Reply Template Definitions
  const templates: TemplateOption[] = [
    // 🚚 SHIPPING & FREIGHT TEMPLATES
    {
      id: 'shipping_quote_request',
      category: 'shipping',
      title: 'Request Courier Quote to City',
      summary: 'Ask the seller for door-to-door courier rates via The Courier Guy or Freight logistics.',
      getTemplate: (item, { city, courier, isUrgent }) => {
        if (!item) return `Hi, could you please provide a courier quote for delivery to ${city}? Thank you!`;
        const weightNote = item.category === 'heavy_equipment'
          ? 'heavy pallet / road freight delivery'
          : item.category === 'trucks'
          ? 'commercial freight logistics'
          : 'door-to-door courier (e.g. The Courier Guy)';

        return `Hi ${item.sellerName || 'Part-Smart Seller'}, I am inquiring regarding the *${item.title}* (Listed at R${item.priceZar.toLocaleString('en-ZA')}${item.partNumber ? ` | Part #${item.partNumber}` : ''}).\n\nCould you please quote on ${weightNote} to *${city}*?\n${isUrgent ? '⚠️ This is an urgent breakdown replacement.\n' : ''}- Are you able to crate/palletize for transport?\n- What is the estimated transit time?\n\nThank you!\n(Ref: Part-Smart ZA #${item.id})`;
      }
    },
    {
      id: 'shipping_heavy_pallet',
      category: 'shipping',
      title: 'Heavy Engine / Gearbox Freight & Crating',
      summary: 'Ask about crating, depot collection, and forklift loading for heavy assemblies.',
      getTemplate: (item, { city }) => {
        if (!item) return `Hi, what are the pallet freight options and crating costs to ${city}?`;
        return `Good day, regarding the *${item.title}* (R${item.priceZar.toLocaleString('en-ZA')} in ${item.city}, ${item.province}):\n\n1. Do you offer pallet freight delivery to *${city}* or closest main depot?\n2. What are the packaging/crating arrangements for this unit?\n3. Do you have a forklift on site if I arrange my own freight collection?\n\nPlease let me know total cost and payment procedure. Thanks!\n(Inquiry via Part-Smart ZA)`;
      }
    },
    {
      id: 'shipping_yard_pickup',
      category: 'shipping',
      title: 'Yard Collection & Cash/Card on Pickup',
      summary: 'Confirm same-day scrap yard collection hours and physical address.',
      getTemplate: (item) => {
        if (!item) return `Hi, can I arrange over-the-counter collection today? What are your yard hours?`;
        return `Hi, I am interested in collecting the *${item.title}* in person from your yard in *${item.city}, ${item.province}*.\n\n- Is this part removed from the vehicle and ready for immediate collection?\n- What are your trading hours today?\n- Do you accept card / instant EFT on collection?\n\nPlease send your full yard physical address and pin location. Thanks!`;
      }
    },

    // 📦 STOCK & YARD AVAILABILITY
    {
      id: 'stock_immediate_check',
      category: 'stock',
      title: 'Verify Physical Stock & Condition',
      summary: 'Check if part is on the shelf or still on donor vehicle, with condition details.',
      getTemplate: (item) => {
        if (!item) return `Hi, is this part physically in stock and tested?`;
        return `Hello ${item.sellerName || 'there'}, is the *${item.title}* (R${item.priceZar.toLocaleString('en-ZA')}${item.partNumber ? ` | OEM #${item.partNumber}` : ''}) still physically available in stock?\n\n- Is it on the shelf ready to dispatch, or still fitted to the vehicle?\n- Condition: Is it 100% working with no cracks, leaks, or stripped threads?\n- Could you send a quick photo / video of the actual part and casting numbers via WhatsApp?\n\nLooking forward to your reply. (Ref: Part-Smart ZA #${item.id})`;
      }
    },
    {
      id: 'stock_hold_deposit',
      category: 'stock',
      title: 'Request 24-48hr Hold with Deposit',
      summary: 'Inquire about holding the part while arranging mechanic / logistics.',
      getTemplate: (item) => {
        if (!item) return `Hi, can you hold this part for 24-48 hours with a holding deposit?`;
        return `Hi ${item.sellerName || 'Seller'}, I am ready to purchase the *${item.title}* (${item.make} ${item.subcategory} - R${item.priceZar.toLocaleString('en-ZA')}).\n\nI am finalizing my mechanic / transporter today. Can you hold this unit for 24 to 48 hours? I am happy to pay a refundable holding deposit to secure it.\n\nPlease share your banking details / proforma invoice. Thank you!`;
      }
    },
    {
      id: 'stock_donor_vehicle',
      category: 'stock',
      title: 'Inquire About Additional Parts on Donor Unit',
      summary: 'Ask what else is available from the same donor truck / car / machinery.',
      getTemplate: (item) => {
        if (!item) return `Hi, do you have other spares available from this donor machine/vehicle?`;
        return `Good day, regarding the *${item.title}* (${item.make} ${item.model || ''}):\n\nAre you stripping the entire donor vehicle / machine at your yard in ${item.city}? I may also require additional associated components (mountings, wiring harness, sensors, pipes).\n\nPlease let me know if the full unit is available for spares.\n(Via Part-Smart ZA)`;
      }
    },

    // ⚙️ FITMENT & VIN VERIFICATION
    {
      id: 'fitment_vin_match',
      category: 'fitment',
      title: 'VIN & Engine / Gearbox Code Verification',
      summary: 'Provide VIN or engine code to ensure 100% accurate fitment before purchase.',
      getTemplate: (item, { vin }) => {
        const vinText = vin ? `*${vin}*` : '[INSERT VIN / ENGINE CODE]';
        if (!item) return `Hi, could you verify if this part matches my VIN: ${vinText}?`;
        return `Hi ${item.sellerName || 'Seller'}, before ordering the *${item.title}*, I want to verify compatibility with my vehicle:\n\n- My VIN / Engine Code: ${vinText}\n- Make & Model: ${item.make} (${item.subcategory})\n\nCould you please check if the casting numbers / bolt patterns match your unit? Do you offer a test-and-exchange guarantee if fitment differs?\n\nThank you!`;
      }
    },
    {
      id: 'fitment_warranty_terms',
      category: 'fitment',
      title: 'Warranty & Testing Guarantee Inquiry',
      summary: 'Clarify startup guarantee, testing procedures, and return terms.',
      getTemplate: (item) => {
        if (!item) return `Hi, what warranty or replacement guarantee do you offer on this spare part?`;
        return `Hello, could you please clarify the warranty terms for the *${item.title}* (R${item.priceZar.toLocaleString('en-ZA')}):\n\n1. What replacement / startup guarantee is provided (e.g. 7, 14, or 30 days)?\n2. Has the component been compression / bench tested prior to removal?\n3. What is your policy for returns if there is an unforeseen issue?\n\nThank you for confirming. (Part-Smart ZA Ref: #${item.id})`;
      }
    },

    // 💳 PAYMENT & INVOICING
    {
      id: 'payment_proforma_eft',
      category: 'payment',
      title: 'Request Tax Invoice & EFT Bank Details',
      summary: 'Request formal Proforma / Tax Invoice with VAT details for business payment.',
      getTemplate: (item) => {
        if (!item) return `Hi, please send a Proforma Invoice with your banking details for EFT payment.`;
        return `Good day ${item.sellerName || 'Accounts'},\n\nI would like to proceed with the purchase of the *${item.title}* for R${item.priceZar.toLocaleString('en-ZA')}.\n\nPlease issue a Tax / Proforma Invoice including:\n- Company Name & VAT Number\n- Business Banking details (FNB / Standard Bank / Nedbank / Absa / Capitec)\n- Part reference: ${item.title} (#${item.id})\n\nOnce received, I will process immediate EFT and send proof of payment. Thank you!`;
      }
    },
    {
      id: 'payment_best_cash_price',
      category: 'payment',
      title: 'Ask for Best Cash / Trade Discount',
      summary: 'Politely inquire if there is room for negotiation on immediate payment.',
      getTemplate: (item) => {
        if (!item) return `Hi, is there room for a cash discount for immediate payment and collection?`;
        return `Hi ${item.sellerName || 'there'}, I am very interested in the *${item.title}* listed at R${item.priceZar.toLocaleString('en-ZA')}.\n\nIf I pay immediately via instant EFT / cash on collection today, what is your absolute best bottom price for this unit?\n\nReady to do a deal immediately if we agree on price. (Part-Smart ZA)`;
      }
    },

    // 🏷️ SELLER QUICK REPLIES (For scrap yards replying to buyers)
    {
      id: 'seller_in_stock_ready',
      category: 'seller_reply',
      title: 'Seller Reply: In Stock & Tested on Shelf',
      summary: 'Quick response confirming part is on shelf and ready for collection or courier.',
      getTemplate: (item) => {
        if (!item) return `Good day! Yes, the part is in stock, tested, and ready for dispatch or collection.`;
        return `Good day! Thank you for your inquiry on Part-Smart ZA. \n\n✅ Yes, the *${item.title}* is physically in stock at our yard in *${item.city}, ${item.province}*.\n- Condition: ${item.condition} (Tested and ready)\n- Price: R${item.priceZar.toLocaleString('en-ZA')} (excl. courier)\n\nWe offer door-to-door courier across SA via The Courier Guy, or you can collect from our yard today. Would you like a courier quote or our banking details?`;
      }
    },
    {
      id: 'seller_courier_quote_rates',
      category: 'seller_reply',
      title: 'Seller Reply: Courier Rates & Transit Times',
      summary: 'Provide standard courier breakdown and dispatch schedule.',
      getTemplate: (item, { city }) => {
        return `Hello! We can arrange delivery for the *${item?.title || 'spare part'}* to *${city}*:\n\n📦 *Shipping Details:*\n- Service: The Courier Guy / Heavy Freight\n- Standard Delivery: 24 - 48 Hours\n- Dispatch: Same day if payment clears before 14:00\n\nPlease confirm your full delivery address and contact number so we can book the parcel.`;
      }
    },
    {
      id: 'seller_send_vin_request',
      category: 'seller_reply',
      title: 'Seller Reply: Request Buyer VIN / Sample Photos',
      summary: 'Ask buyer to send their VIN and photo of old part for 100% match.',
      getTemplate: (item) => {
        return `Hi! To ensure 100% fitment before dispatching the *${item?.title || 'part'}*, please send through:\n\n1. Your vehicle VIN or chassis number\n2. Engine / Gearbox serial number\n3. Clear photo of your old part / sample\n\nOnce verified, we will send an invoice and prepare the part for dispatch!`;
      }
    }
  ];

  // Filtered template list
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => t.category === selectedCategory);
  }, [selectedCategory, templates]);

  // Handle Copy to Clipboard
  const handleCopy = (templateId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(templateId);
    setTimeout(() => setCopiedTemplateId(null), 3000);
  };

  // Handle WhatsApp Direct Send
  const handleOpenWhatsApp = (text: string) => {
    if (!currentItem) return;
    incrementViews(currentItem.id);
    const phone = currentItem.sellerPhone ? currentItem.sellerPhone.replace(/[^0-9]/g, '') : '27820000000';
    const formattedPhone = phone.startsWith('0') ? '27' + phone.substring(1) : phone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Enhance / Generate Custom AI Response via Server-Side Endpoint
  const handleGenerateAiResponse = async (customInstruction?: string) => {
    const promptText = customInstruction || aiPrompt;
    if (!promptText.trim() && !customInstruction) return;

    setAiLoading(true);
    setAiResponse('');

    try {
      // Call server-side endpoint
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${promptText} (Tone: ${aiTone})`,
          mode: 'buyer',
          contextItem: currentItem,
          buyerQuestionType: selectedCategory === 'shipping' ? 'shipping_costs' : 'stock_availability'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.text || 'Generated response.');
      } else {
        // Fallback simulated context-rich response if offline or key not yet bound
        const fallbackText = generateContextualFallback(promptText, currentItem, selectedCategory, destinationCity);
        setAiResponse(fallbackText);
      }
    } catch (err) {
      console.error('Error generating AI response:', err);
      const fallbackText = generateContextualFallback(promptText, currentItem, selectedCategory, destinationCity);
      setAiResponse(fallbackText);
    } finally {
      setAiLoading(false);
    }
  };

  const generateContextualFallback = (prompt: string, item: InventoryItem | null, cat: string, city: string) => {
    if (!item) return `Here is a custom recommendation for your spares request regarding ${cat} to ${city}.`;
    return `📋 *Part-Smart ZA AI Tailored Response*\n\nRegarding *${item.title}* (${item.make} ${item.subcategory} | R${item.priceZar.toLocaleString('en-ZA')}):\n\n` +
      `• *Logistics & Shipping*: Typical courier from ${item.city}, ${item.province} to ${city} is 24-48 business hours via The Courier Guy or road freight for heavy components.\n` +
      `• *Stock & Yard Verification*: Verified scrap yard listing with ${item.condition} condition rating. Make sure to confirm casting numbers (#${item.partNumber || 'N/A'}).\n` +
      `• *Recommended Action*: Send inquiry directly to ${item.sellerName} at ${item.sellerPhone} via WhatsApp to hold the item and request bank EFT details.`;
  };

  const handleEnhanceTemplate = (template: TemplateOption) => {
    const rawText = template.getTemplate(currentItem, {
      city: destinationCity,
      vin: buyerVin,
      courier: courierType,
      isUrgent: urgency === 'urgent'
    });
    setAiPrompt(`Refine and personalize this buyer question for a scrap yard seller in South Africa with extra professionalism and urgency:\n\n"${rawText}"`);
    setActiveTab('ai_chat');
    handleGenerateAiResponse(`Refine and personalize this South African spares question:\n\n"${rawText}"`);
  };

  return (
    <div
      id="ai-part-assistant-modal"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 sm:my-8 text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Part-Smart ZA AI & Quick Reply Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Quick Replies Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Instant context-aware message templates for shipping costs, stock checks, and fitment.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950 p-2 sm:p-2.5 border-b border-slate-800 flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('quick_replies')}
            className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'quick_replies'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Quick Reply Templates</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_chat')}
            className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'ai_chat'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Assistant & Custom Q&A</span>
          </button>

          <button
            onClick={() => setActiveTab('seller_ad')}
            className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'seller_ad'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Seller Ad Generator</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          
          {/* Active Context Banner: Select Item */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Target Inventory Context
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Templates auto-fill with this part's pricing, scrap yard location & contact details.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Part Dropdown */}
              <div className="sm:col-span-8">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Choose Active Part from Listings:
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} — R{item.priceZar.toLocaleString('en-ZA')} ({item.city}, {item.province})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Item Mini-Card */}
              {currentItem && (
                <div className="sm:col-span-4 bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-400 font-bold block truncate">
                      {currentItem.make} • {currentItem.subcategory}
                    </span>
                    <span className="text-xs font-bold text-white block truncate">
                      {currentItem.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      📍 {currentItem.city}, {currentItem.province}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-400 block">
                      R{currentItem.priceZar.toLocaleString('en-ZA')}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">
                      #{currentItem.partNumber || 'OEM'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: QUICK REPLIES */}
          {activeTab === 'quick_replies' && (
            <div className="space-y-5">
              
              {/* Dynamic Variables Customizer */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Customize Template Variables (Auto-injected)
                  </span>
                  <span className="text-[10px] text-slate-500">Live variables update below</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Destination City */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Buyer Destination City:
                    </label>
                    <input
                      type="text"
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      placeholder="e.g. Cape Town, Durban, Pretoria"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Buyer VIN / Engine Code */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Vehicle VIN / Engine Code (Optional):
                    </label>
                    <input
                      type="text"
                      value={buyerVin}
                      onChange={(e) => setBuyerVin(e.target.value)}
                      placeholder="e.g. WBA3N..., OM457LA"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Inquiry Urgency:
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="standard">Standard Inquiry</option>
                      <option value="urgent">⚠️ Urgent Breakdown Replacement</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quick Reply Category Selector Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('shipping')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === 'shipping'
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>🚚 Shipping & Courier Rates ({templates.filter(t => t.category === 'shipping').length})</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('stock')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === 'stock'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>📦 Stock & Availability ({templates.filter(t => t.category === 'stock').length})</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('fitment')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === 'fitment'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚙️ Fitment & Warranty ({templates.filter(t => t.category === 'fitment').length})</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('payment')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === 'payment'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span>💳 Payment & Invoice ({templates.filter(t => t.category === 'payment').length})</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('seller_reply')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === 'seller_reply'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>🏷️ Seller Instant Replies ({templates.filter(t => t.category === 'seller_reply').length})</span>
                </button>
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-1 gap-4">
                {filteredTemplates.map((template) => {
                  const renderedText = template.getTemplate(currentItem, {
                    city: destinationCity,
                    vin: buyerVin,
                    courier: courierType,
                    isUrgent: urgency === 'urgent'
                  });

                  const isCopied = copiedTemplateId === template.id;

                  return (
                    <div
                      key={template.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md transition-all relative group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{template.title}</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{template.summary}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          {/* 1-Click Copy */}
                          <button
                            onClick={() => handleCopy(template.id, renderedText)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Copy formatted template to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* Direct WhatsApp Action */}
                          {currentItem && (
                            <button
                              onClick={() => handleOpenWhatsApp(renderedText)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              title="Open pre-filled chat in WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          )}

                          {/* AI Enhance Button */}
                          <button
                            onClick={() => handleEnhanceTemplate(template)}
                            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Refine this message with Gemini AI"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>AI Polish</span>
                          </button>
                        </div>
                      </div>

                      {/* Rendered Template Body Preview */}
                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5">
                        <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                          {renderedText}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AI ASSISTANT & CUSTOM Q&A */}
          {activeTab === 'ai_chat' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-amber-400" />
                    Ask AI Assistant for Custom Advice or Response:
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">Tone:</span>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="concise">Direct & Fast</option>
                      <option value="friendly">Friendly & Local</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Ask for courier rates for an engine to Nelspruit, or generate a custom fitment question for a 2016 Scania G460..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {/* Shortcut Prompt Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Quick Prompts:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const p = `What is the estimated courier cost and packaging requirements for sending ${currentItem?.title || 'this component'} to Cape Town?`;
                        setAiPrompt(p);
                        handleGenerateAiResponse(p);
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      🚚 Courier to CPT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const p = `Draft a warranty & testing inquiry for ${currentItem?.title || 'this item'} to check if the scrap yard offers startup guarantee.`;
                        setAiPrompt(p);
                        handleGenerateAiResponse(p);
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      🛡️ Warranty terms
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const p = `Check compatibility: What other vehicles or machinery models can use this ${currentItem?.subcategory || 'spare part'}?`;
                        setAiPrompt(p);
                        handleGenerateAiResponse(p);
                      }}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      ⚙️ Interchangeable Models
                    </button>
                  </div>

                  <button
                    onClick={() => handleGenerateAiResponse()}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate AI Response</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Generated Result Box */}
              {aiResponse && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Generated Recommendation:</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy('ai_result', aiResponse)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedTemplateId === 'ai_result' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {currentItem && (
                        <button
                          onClick={() => handleOpenWhatsApp(aiResponse)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SELLER AD GENERATOR */}
          {activeTab === 'seller_ad' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Generate High-Converting Ad Description for Your Spare:
                </label>

                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`e.g. Reconditioned ${currentItem?.make || 'Toyota'} ${currentItem?.subcategory || 'Gearbox'}, 3 month warranty, bench tested, fits 2015-2022 models in Gauteng...`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const prompt = `Write a high-converting, professional marketplace ad title and full item description for South African scrap yard buyers for: ${aiPrompt || currentItem?.title || 'Heavy equipment spare'}. Include technical specifications, shipping options via Courier Guy, and warranty terms in Rands.`;
                      handleGenerateAiResponse(prompt);
                    }}
                    disabled={aiLoading}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Generate Optimized Ad Copy</span>
                  </button>
                </div>
              </div>

              {aiResponse && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Generated Listing Copy:
                    </span>
                    <button
                      onClick={() => handleCopy('ad_copy', aiResponse)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1"
                    >
                      {copiedTemplateId === 'ad_copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTemplateId === 'ad_copy' ? 'Copied' : 'Copy Ad Text'}</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>South Africa Logistics & Fitment Engine Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
