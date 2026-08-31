import React, { useState, useMemo } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  Download,
  Smartphone,
  Sparkles,
  Layers,
  Filter,
  Search,
  CheckSquare,
  Square,
  FileText,
  MessageSquare,
  Flame,
  Wrench,
  Truck,
  Building2,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Users
} from 'lucide-react';
import { InventoryItem, Seller, CategoryType } from '../types';
import {
  buildGridWhatsappPayload,
  generateGenericWhatsappShareUrl,
  splitWhatsappPayloadIntoChunks
} from '../lib/whatsapp';

interface WhatsappInventoryExportModalProps {
  seller: Seller;
  inventory: InventoryItem[];
  preSelectedIds?: string[];
  onClose: () => void;
  onOpenBroadcastTool?: () => void;
}

export const WhatsappInventoryExportModal: React.FC<WhatsappInventoryExportModalProps> = ({
  seller,
  inventory,
  preSelectedIds,
  onClose,
  onOpenBroadcastTool
}) => {
  // Format preset
  const [formatStyle, setFormatStyle] = useState<'catalog' | 'compact' | 'clearance' | 'stripping' | 'custom'>('catalog');

  // Payload content options
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [includePrices, setIncludePrices] = useState(true);
  const [includeOem, setIncludeOem] = useState(true);
  const [includeCondition, setIncludeCondition] = useState(true);
  const [includeContactDetails, setIncludeContactDetails] = useState(true);
  
  // Customization fields
  const [customHeadline, setCustomHeadline] = useState('');
  const [customIntro, setCustomIntro] = useState('');
  const [customOutro, setCustomOutro] = useState('');
  const [promoNote, setPromoNote] = useState('Trade discounts and bulk order pricing negotiable on collection.');

  // Item filtering & selection inside modal
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');
  
  // Selection state (default to preSelectedIds if given, otherwise all items)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (preSelectedIds && preSelectedIds.length > 0) {
      return preSelectedIds;
    }
    return inventory.map(i => i.id);
  });

  // Active chunk view tab (if split)
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);

  // Copy notice toast
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Filtered items based on search and category
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [inventory, categoryFilter, searchQuery]);

  // Selected items subset
  const selectedItems = useMemo(() => {
    return inventory.filter(item => selectedIds.includes(item.id));
  }, [inventory, selectedIds]);

  // Generated full payload text
  const payloadText = useMemo(() => {
    return buildGridWhatsappPayload({
      seller,
      items: selectedItems,
      formatStyle,
      groupByCategory: formatStyle === 'compact' ? false : groupByCategory,
      includePrices,
      includeOem,
      includeCondition,
      includeContactDetails,
      customHeadline: customHeadline.trim() || undefined,
      customIntro: customIntro.trim() || undefined,
      customOutro: customOutro.trim() || undefined,
      promoNote: promoNote.trim() || undefined
    });
  }, [
    seller,
    selectedItems,
    formatStyle,
    groupByCategory,
    includePrices,
    includeOem,
    includeCondition,
    includeContactDetails,
    customHeadline,
    customIntro,
    customOutro,
    promoNote
  ]);

  // Chunks if message is long
  const chunks = useMemo(() => {
    return splitWhatsappPayloadIntoChunks(payloadText, 3200);
  }, [payloadText]);

  // Copy to clipboard helper
  const handleCopy = (textToCopy: string, noticeLabel = 'WhatsApp payload copied to clipboard!') => {
    navigator.clipboard.writeText(textToCopy);
    setCopyNotice(noticeLabel);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // Launch WhatsApp with prefilled payload
  const handleOpenWhatsApp = (textToSend: string) => {
    const url = generateGenericWhatsappShareUrl(textToSend);
    window.open(url, '_blank');
  };

  // Native Web Share API
  const handleNativeShare = async (textToShare: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${seller.companyName} - Spares Inventory Catalog`,
          text: textToShare
        });
        setCopyNotice('Shared successfully!');
        setTimeout(() => setCopyNotice(null), 3000);
      } catch {
        // User cancelled or share error
      }
    } else {
      handleCopy(textToShare);
    }
  };

  // Download payload as .txt
  const handleDownloadTxt = () => {
    const safeYardName = seller.companyName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeYardName}_WhatsApp_Inventory_Catalog.txt`;
    const element = document.createElement('a');
    const file = new Blob([payloadText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setCopyNotice(`Downloaded ${filename}`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // Selection handlers
  const handleToggleItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredInventory.map(i => i.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredSet = new Set(filteredInventory.map(i => i.id));
    setSelectedIds(prev => prev.filter(id => !filteredSet.has(id)));
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Toast Notice */}
      {copyNotice && (
        <div className="fixed bottom-6 right-6 z-70 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copyNotice}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl text-white my-auto overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Share2 className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Export Inventory Grid to WhatsApp
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                  Customer List Payload
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate a clean, copyable WhatsApp catalogue payload for {seller.companyName} to share with trade buyers, WhatsApp broadcast lists, or customer groups.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto">
          
          {/* LEFT COLUMN: Controls, Item Filters & Format Options (5 Columns) */}
          <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-slate-800 space-y-5 bg-slate-900/60 overflow-y-auto">
            
            {/* 1. Format Presets */}
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                1. Select Message Formatting Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'catalog', name: '📦 Full Catalogue', desc: 'Category sections & specs' },
                  { id: 'compact', name: '📋 Compact Digest', desc: 'Quick 1-line price list' },
                  { id: 'clearance', name: '🔥 Clearance Deals', desc: 'Stock markdown specials' },
                  { id: 'stripping', name: '🚨 Stripping Spares', desc: 'Machine dismantle alert' },
                  { id: 'custom', name: '✍️ Custom Intro/Outro', desc: 'Personalized messaging' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFormatStyle(preset.id as any)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      formatStyle === preset.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    } ${preset.id === 'custom' ? 'col-span-2' : ''}`}
                  >
                    <span className="text-xs block text-white font-bold">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Payload Detail Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                2. Included Information & Options
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includePrices}
                    onChange={e => setIncludePrices(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-slate-300 font-medium">Include ZAR Prices</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includeOem}
                    onChange={e => setIncludeOem(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-slate-300 font-medium">Include OEM Part #</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includeCondition}
                    onChange={e => setIncludeCondition(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-slate-300 font-medium">Include Condition</span>
                </label>

                {formatStyle !== 'compact' && (
                  <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={groupByCategory}
                      onChange={e => setGroupByCategory(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span className="text-slate-300 font-medium">Group by Category</span>
                  </label>
                )}

                <label className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 col-span-2">
                  <input
                    type="checkbox"
                    checked={includeContactDetails}
                    onChange={e => setIncludeContactDetails(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span className="text-slate-300 font-medium">Include Yard Address & WhatsApp Contact Block</span>
                </label>
              </div>
            </div>

            {/* Custom Texts & VIP Note */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                VIP Promo / Trade Terms Note
              </label>
              <input
                type="text"
                value={promoNote}
                onChange={e => setPromoNote(e.target.value)}
                placeholder="e.g. 5% trade discount on orders confirmed this week"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              {formatStyle === 'custom' && (
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-300 font-bold block mb-1">Custom Header / Headline:</label>
                    <input
                      type="text"
                      value={customHeadline}
                      onChange={e => setCustomHeadline(e.target.value)}
                      placeholder="e.g. 🚜 WEEKLY MACHINE SPARES DIGEST | YOUR YARD NAME"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-bold block mb-1">Custom Introduction Paragraph:</label>
                    <textarea
                      rows={2}
                      value={customIntro}
                      onChange={e => setCustomIntro(e.target.value)}
                      placeholder="e.g. Good day trade partners, please review our fresh stock arrivals for this week..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Items Selection & Filtering */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  3. Select Items ({selectedIds.length}/{inventory.length})
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="text-slate-400 hover:text-rose-400 font-bold cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {/* Category and Search Bar */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by part title, make, model or OEM..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-none">
                  {[
                    { id: 'all', label: 'All Categories' },
                    { id: 'heavy_equipment', label: '🚜 Heavy Equipment' },
                    { id: 'trucks', label: '🚚 Trucks' },
                    { id: 'minibus_taxis', label: '🚐 Taxis' },
                    { id: 'cars', label: '🚗 Cars & Bakkies' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id as any)}
                      className={`px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-all ${
                        categoryFilter === cat.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Item Checkbox List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {filteredInventory.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No items matching filter.
                  </div>
                ) : (
                  filteredInventory.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    const formattedPrice = new Intl.NumberFormat('en-ZA', {
                      style: 'currency',
                      currency: 'ZAR',
                      maximumFractionDigits: 0
                    }).format(item.priceZar);

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-xs'
                            : 'bg-slate-950/50 border-slate-800/80 opacity-65 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                              isSelected ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {item.make} {item.model} {item.partNumber ? `• OEM: ${item.partNumber}` : ''}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-amber-400 shrink-0">{formattedPrice}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Live WhatsApp Preview & Dispatch Actions (7 Columns) */}
          <div className="lg:col-span-7 p-5 space-y-4 bg-slate-950/40 flex flex-col">
            
            {/* Header & Metrics */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Live WhatsApp Chat Simulation</h3>
              </div>

              {/* Payload Stats */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                  <strong className="text-amber-400 font-bold">{selectedItems.length}</strong> parts included
                </span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                  <strong className="text-emerald-400 font-bold">{payloadText.length}</strong> characters
                </span>
                {chunks.length > 1 && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-lg font-bold">
                    {chunks.length} Message Chunks
                  </span>
                )}
              </div>
            </div>

            {/* Chunk Tabs if Split */}
            {chunks.length > 1 && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold px-2">Message Parts:</span>
                {chunks.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedChunkIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedChunkIndex === idx
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Part {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedChunkIndex(-1)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-auto ${
                    selectedChunkIndex === -1
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full Payload
                </button>
              </div>
            )}

            {/* WhatsApp Simulated Phone Chat Window */}
            <div className="bg-[#0b141a] border border-[#222e35] rounded-3xl p-4 shadow-inner flex-1 flex flex-col overflow-hidden">
              
              {/* WhatsApp Simulated Top Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222e35] text-xs text-slate-400 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    {seller.companyName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-white font-bold block leading-tight">{seller.companyName}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Direct WhatsApp Customer Broadcast
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  WhatsApp Formatted Preview
                </span>
              </div>

              {/* Message Bubble Container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[360px] select-text">
                <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-none p-4 text-xs shadow-md space-y-2 whitespace-pre-wrap leading-relaxed max-w-full font-sans">
                  {selectedChunkIndex >= 0 && chunks.length > 1
                    ? chunks[selectedChunkIndex]
                    : payloadText}
                  
                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/70 pt-2 border-t border-[#02735e]/60">
                    <span>{new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons Toolbar */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Copy Payload Button */}
                <button
                  type="button"
                  onClick={() => {
                    const text = selectedChunkIndex >= 0 && chunks.length > 1 ? chunks[selectedChunkIndex] : payloadText;
                    handleCopy(text, `Copied ${selectedItems.length} parts WhatsApp payload!`);
                  }}
                  className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Copy className="w-4 h-4" />
                  <span>
                    {chunks.length > 1 && selectedChunkIndex >= 0
                      ? `Copy Part ${selectedChunkIndex + 1}`
                      : 'Copy WhatsApp Payload'}
                  </span>
                </button>

                {/* 2. Launch WhatsApp Share */}
                <button
                  type="button"
                  onClick={() => {
                    const text = selectedChunkIndex >= 0 && chunks.length > 1 ? chunks[selectedChunkIndex] : payloadText;
                    handleOpenWhatsApp(text);
                  }}
                  className="py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  title="Open WhatsApp directly with prefilled inventory text"
                >
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>Share on WhatsApp</span>
                </button>

                {/* 3. Native Share / Download */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNativeShare(payloadText)}
                    className="flex-1 py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                    title="Share via device native share sheet"
                  >
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                    title="Download as Text file (.txt)"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Footer Switcher to 1-to-1 Broadcast Queue Tool */}
              {onOpenBroadcastTool && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Want to dispatch personalized messages 1-by-1 to your saved customer buyer list?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBroadcastTool();
                    }}
                    className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>Open Customer Queue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
