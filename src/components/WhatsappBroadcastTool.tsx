import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Search,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Filter,
  Flame,
  HardHat,
  Truck,
  Car,
  FileSpreadsheet,
  History,
  Tag,
  AlertCircle,
  Phone,
  Share2,
  Smartphone,
  RefreshCw,
  Info,
  ChevronRight,
  ArrowRight,
  Package,
  Wrench,
  CheckSquare,
  Square,
  Sliders,
  Award
} from 'lucide-react';
import {
  Seller,
  InventoryItem,
  CustomerContact,
  BroadcastHistoryItem
} from '../types';
import {
  formatWhatsappPhoneNumber,
  buildInventoryBroadcastText,
  generateWhatsappBroadcastUrl
} from '../lib/whatsapp';

interface WhatsappBroadcastToolProps {
  seller: Seller;
  sellerListings: InventoryItem[];
  onOpenInventoryTab?: () => void;
  onOpenExportGridModal?: () => void;
}

// Sample South African trade buyer database for one-click initial demo
const SAMPLE_BUYERS: Omit<CustomerContact, 'id' | 'createdAt'>[] = [
  {
    name: 'Johan Venter',
    company: 'Venter Earthmoving Contractors',
    phone: '0824567890',
    interestTag: 'Heavy Machinery',
    notes: 'Regular buyer for CAT, Komatsu & JCB excavator pumps'
  },
  {
    name: 'Sipho Dlamini',
    company: 'Durban Cross-Border Logistics',
    phone: '0831234567',
    interestTag: 'Trucks & Commercial',
    notes: 'Fleet of 14 Scania R560 & Mercedes Actros trucks'
  },
  {
    name: 'Koos Marais',
    company: 'Marais Plant Hire & Demolition',
    phone: '0719876543',
    interestTag: 'Heavy Machinery',
    notes: 'Interested in final drives, hydraulic rams & buckets'
  },
  {
    name: 'Thabo Mokoena',
    company: 'Mokoena Transport Logistics',
    phone: '0823334455',
    interestTag: 'Trucks & Commercial',
    notes: 'Looks for Volvo FM400 & UD Quester differentials'
  },
  {
    name: 'Willem Pretorius',
    company: 'Overberg Agri & Spares',
    phone: '0845556677',
    interestTag: 'Toyota & Bakkies',
    notes: 'Buys Hilux GD-6 & Land Cruiser 79 series engines'
  },
  {
    name: 'Gary Peterson',
    company: 'GP Auto & Heavy Breakers',
    phone: '0837778899',
    interestTag: 'Clearance & Trade',
    notes: 'Wholesale salvage and bulk dismantling buyer'
  }
];

export const WhatsappBroadcastTool: React.FC<WhatsappBroadcastToolProps> = ({
  seller,
  sellerListings,
  onOpenInventoryTab,
  onOpenExportGridModal
}) => {
  // Storage Keys
  const contactsStorageKey = `partsmart_seller_contacts_${seller.id}`;
  const historyStorageKey = `partsmart_seller_broadcast_history_${seller.id}`;

  // State: Customer Contacts
  const [contacts, setContacts] = useState<CustomerContact[]>(() => {
    try {
      const saved = localStorage.getItem(contactsStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Initialize with sample buyers
    return SAMPLE_BUYERS.map((b, idx) => ({
      ...b,
      id: `sample_buyer_${idx + 1}`,
      createdAt: new Date().toISOString()
    }));
  });

  // State: Selected Recipients (IDs)
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(() => {
    return contacts.map(c => c.id);
  });

  // State: Selected Inventory Items for Arrival Broadcast (IDs)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    // Default to first 3 items or all if fewer
    return sellerListings.slice(0, 3).map(i => i.id);
  });

  // State: Broadcast Template
  const [selectedTemplate, setSelectedTemplate] = useState<
    'new_arrivals' | 'stripping_alert' | 'trade_wholesale' | 'custom'
  >('new_arrivals');

  const [customTemplateText, setCustomTemplateText] = useState<string>(
    `🆕 *FRESH STOCK ARRIVAL | {YardName}*

Hi {CustomerName},

We just received new inventory parts at our yard in {Location}:

{InventoryList}

{PromoNote}

📍 *Location:* {Location}
📞 *Direct WhatsApp:* {Phone}

Reply directly to reserve parts or arrange courier delivery!`
  );

  const [promoNote, setPromoNote] = useState<string>(
    '10% trade discount applies on collection orders placed this week.'
  );

  // Filter & Search states for Contacts
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactTagFilter, setContactTagFilter] = useState<string>('all');

  // Filter & Search states for Inventory
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  // Dispatch Tracking State: status map of recipientId -> 'pending' | 'sent' | 'skipped'
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, 'pending' | 'sent' | 'skipped'>>({});
  const [dispatchTimestamp, setDispatchTimestamp] = useState<Record<string, string>>({});

  // Active preview customer ID
  const [previewContactId, setPreviewContactId] = useState<string>(() => {
    return contacts[0]?.id || '';
  });

  // Modals / Dialogs
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // New Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactCompany, setNewContactCompany] = useState('');
  const [newContactTag, setNewContactTag] = useState('Heavy Machinery');
  const [newContactNotes, setNewContactNotes] = useState('');

  // Bulk Import text state
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');

  // Feedback notifications
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Save contacts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(contactsStorageKey, JSON.stringify(contacts));
    } catch {
      // ignore
    }
  }, [contacts, contactsStorageKey]);

  // Selected items objects
  const selectedItems = useMemo(() => {
    return sellerListings.filter(item => selectedItemIds.includes(item.id));
  }, [sellerListings, selectedItemIds]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(contactSearchQuery.toLowerCase())) ||
        c.phone.includes(contactSearchQuery);

      const matchesTag =
        contactTagFilter === 'all' || c.interestTag === contactTagFilter;

      return matchesSearch && matchesTag;
    });
  }, [contacts, contactSearchQuery, contactTagFilter]);

  // Available unique tags
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(c => {
      if (c.interestTag) tags.add(c.interestTag);
    });
    return Array.from(tags);
  }, [contacts]);

  // Target preview contact
  const previewContact = useMemo(() => {
    return contacts.find(c => c.id === previewContactId) || contacts[0] || null;
  }, [contacts, previewContactId]);

  // Generated preview text for current customer
  const previewMessageText = useMemo(() => {
    if (!seller || selectedItems.length === 0) {
      return 'Please select at least 1 inventory item to generate the broadcast message.';
    }
    return buildInventoryBroadcastText(
      seller,
      selectedItems,
      previewContact?.name,
      selectedTemplate,
      customTemplateText,
      promoNote
    );
  }, [seller, selectedItems, previewContact, selectedTemplate, customTemplateText, promoNote]);

  // Generic message for Broadcast List / Group Copy
  const broadcastListMessageText = useMemo(() => {
    if (!seller || selectedItems.length === 0) return '';
    return buildInventoryBroadcastText(
      seller,
      selectedItems,
      'Valued Client',
      selectedTemplate,
      customTemplateText,
      promoNote
    );
  }, [seller, selectedItems, selectedTemplate, customTemplateText, promoNote]);

  // Copy to clipboard helper
  const handleCopyToClipboard = (text: string, label = 'Message copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopyNotice(label);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // Handle single send
  const handleSendToContact = (contact: CustomerContact) => {
    const text = buildInventoryBroadcastText(
      seller,
      selectedItems,
      contact.name,
      selectedTemplate,
      customTemplateText,
      promoNote
    );
    const url = generateWhatsappBroadcastUrl(contact.phone, text);
    
    // Open WhatsApp in new window
    window.open(url, '_blank');

    // Update dispatch status
    setDispatchStatus(prev => ({ ...prev, [contact.id]: 'sent' }));
    setDispatchTimestamp(prev => ({ ...prev, [contact.id]: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) }));

    // Record in history log
    recordBroadcastHistory();
  };

  // Record Broadcast in History
  const recordBroadcastHistory = () => {
    try {
      const historyItem: BroadcastHistoryItem = {
        id: `bcast_${Date.now()}`,
        sellerId: seller.id,
        createdAt: new Date().toISOString(),
        title: `${selectedItems.length} Part Arrivals (${selectedTemplate})`,
        recipientCount: selectedContactIds.length,
        itemIds: selectedItemIds,
        templateUsed: selectedTemplate,
        messageSnippet: previewMessageText.slice(0, 120) + '...'
      };

      const existingRaw = localStorage.getItem(historyStorageKey);
      const existing: BroadcastHistoryItem[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [historyItem, ...existing.slice(0, 19)]; // keep last 20
      localStorage.setItem(historyStorageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Next Pending Contact for queue progression
  const nextPendingContact = useMemo(() => {
    return contacts.find(
      c => selectedContactIds.includes(c.id) && dispatchStatus[c.id] !== 'sent' && dispatchStatus[c.id] !== 'skipped'
    );
  }, [contacts, selectedContactIds, dispatchStatus]);

  // Toggle contact selection
  const handleToggleContact = (id: string) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select all filtered contacts
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredContacts.map(c => c.id);
    setSelectedContactIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  // Deselect all filtered contacts
  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredContacts.map(c => c.id));
    setSelectedContactIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  // Toggle item selection
  const handleToggleItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Add single contact
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: CustomerContact = {
      id: `buyer_${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      company: newContactCompany.trim() || undefined,
      interestTag: newContactTag.trim() || 'General',
      notes: newContactNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setContacts(prev => [newContact, ...prev]);
    setSelectedContactIds(prev => [...prev, newContact.id]);
    setPreviewContactId(newContact.id);

    // Reset
    setNewContactName('');
    setNewContactPhone('');
    setNewContactCompany('');
    setNewContactNotes('');
    setIsAddContactModalOpen(false);
    setCopyNotice(`Added contact ${newContact.name}`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // Bulk Import Submit
  const handleBulkImportSubmit = () => {
    setBulkImportError('');
    if (!bulkImportText.trim()) {
      setBulkImportError('Please paste customer contacts text.');
      return;
    }

    const lines = bulkImportText.split('\n');
    const parsedContacts: CustomerContact[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      // Split by comma, semicolon or tab
      const parts = trimmed.split(/[,;\t]/).map(p => p.trim());
      
      let name = '';
      let phone = '';
      let company = '';
      let tag = 'Trade Buyer';

      if (parts.length >= 2) {
        name = parts[0];
        phone = parts[1];
        if (parts[2]) company = parts[2];
        if (parts[3]) tag = parts[3];
      } else {
        // Try to match "Name - 0821234567" or "0821234567 Name"
        const phoneMatch = trimmed.match(/(?:(?:\+?27)|0)\s*\d{2}\s*\d{3}\s*\d{4}/);
        if (phoneMatch) {
          phone = phoneMatch[0];
          name = trimmed.replace(phone, '').replace(/[-:|]/g, '').trim() || `Client ${index + 1}`;
        }
      }

      if (name && phone) {
        parsedContacts.push({
          id: `bulk_buyer_${Date.now()}_${index}`,
          name,
          phone,
          company: company || undefined,
          interestTag: tag,
          createdAt: new Date().toISOString()
        });
      }
    });

    if (parsedContacts.length === 0) {
      setBulkImportError('Could not parse any valid contacts. Format: Name, Phone (e.g. Sipho, 0821234567)');
      return;
    }

    setContacts(prev => [...parsedContacts, ...prev]);
    setSelectedContactIds(prev => [...prev, ...parsedContacts.map(c => c.id)]);
    setIsBulkImportModalOpen(false);
    setBulkImportText('');
    setCopyNotice(`Successfully imported ${parsedContacts.length} contacts!`);
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // Reset sample contacts
  const handleReloadSampleContacts = () => {
    const samples = SAMPLE_BUYERS.map((b, idx) => ({
      ...b,
      id: `sample_buyer_${Date.now()}_${idx + 1}`,
      createdAt: new Date().toISOString()
    }));
    setContacts(samples);
    setSelectedContactIds(samples.map(s => s.id));
    setDispatchStatus({});
    setCopyNotice('Reloaded sample trade buyers list');
    setTimeout(() => setCopyNotice(null), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Company', 'Interest Tag', 'Notes'];
    const rows = contacts.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.company || ''}"`,
      `"${c.interestTag || ''}"`,
      `"${c.notes || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${seller.companyName.replace(/\s+/g, '_')}_WhatsApp_Contacts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete contact
  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedContactIds(prev => prev.filter(i => i !== id));
  };

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return sellerListings.filter(item => {
      if (!inventorySearchQuery.trim()) return true;
      const q = inventorySearchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        (item.partNumber && item.partNumber.toLowerCase().includes(q))
      );
    });
  }, [sellerListings, inventorySearchQuery]);

  // Sent count in current session
  const sentCount = Object.values(dispatchStatus).filter(s => s === 'sent').length;

  return (
    <div id="whatsapp-broadcast-tool" className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notice */}
      {copyNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{copyNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Share2 className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  WhatsApp New Arrival Broadcast Tool
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Direct Buyer Marketing
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Notify your direct customer network, fleet managers, and trade mechanics via personalized WhatsApp messages whenever newly stripped vehicles, excavator parts, or engine arrivals land in your yard.
              </p>

              {onOpenExportGridModal && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenExportGridModal}
                    className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Entire Inventory Grid as WhatsApp Catalogue Payload</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto shrink-0 text-center">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Contacts</span>
              <span className="text-base font-black text-white">{contacts.length}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected Parts</span>
              <span className="text-base font-black text-amber-400">{selectedItemIds.length}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Sent Today</span>
              <span className="text-base font-black text-emerald-400">{sentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: 1. Select Inventory & 2. Compose Message (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: INVENTORY ARRIVALS SELECTION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  Select New Arrival Parts to Broadcast ({selectedItemIds.length} Selected)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemIds(sellerListings.slice(0, 3).map(i => i.id))}
                  className="text-[11px] text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Latest 3
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedItemIds(sellerListings.map(i => i.id))}
                  className="text-[11px] text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedItemIds([])}
                  className="text-[11px] text-slate-400 hover:text-rose-400 font-bold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search items bar */}
            {sellerListings.length > 4 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter your inventory by title, make, part number..."
                  value={inventorySearchQuery}
                  onChange={e => setInventorySearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Inventory Items List */}
            {sellerListings.length === 0 ? (
              <div className="text-center py-8 bg-slate-950 rounded-2xl border border-dashed border-slate-800 p-4">
                <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-bold">No active inventory listings found for this yard.</p>
                <p className="text-[11px] text-slate-500 mt-1">Please add inventory items first to send arrival broadcasts.</p>
                {onOpenInventoryTab && (
                  <button
                    type="button"
                    onClick={onOpenInventoryTab}
                    className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Go to Add Inventory
                  </button>
                )}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {filteredInventory.map(item => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const formattedPrice = new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: 'ZAR',
                    maximumFractionDigits: 0
                  }).format(item.priceZar);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'border border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {item.images && item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                            <Wrench className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                              {item.make} {item.model}
                            </span>
                            <span>{item.condition.replace(/_/g, ' ')}</span>
                            {item.partNumber && <span>• OEM: {item.partNumber}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-amber-400">{formattedPrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: TEMPLATE SELECTION & CUSTOMIZATION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Choose Message Broadcast Template
                </h3>
              </div>
            </div>

            {/* Template Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplate('new_arrivals')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedTemplate === 'new_arrivals'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs block">🆕 New Arrivals</span>
                <span className="text-[10px] font-normal text-slate-400 block mt-0.5">General stock alert</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('stripping_alert')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedTemplate === 'stripping_alert'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs block">🚨 Stripping Alert</span>
                <span className="text-[10px] font-normal text-slate-400 block mt-0.5">Machine dismantling</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('trade_wholesale')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedTemplate === 'trade_wholesale'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-black'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs block">📦 Trade & Fleet</span>
                <span className="text-[10px] font-normal text-slate-400 block mt-0.5">Wholesale pricing</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('custom')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedTemplate === 'custom'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-black'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs block">✍️ Custom Message</span>
                <span className="text-[10px] font-normal text-slate-400 block mt-0.5">Write your own text</span>
              </button>
            </div>

            {/* Custom Message Editor */}
            {selectedTemplate === 'custom' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Custom Message Body:</label>
                <textarea
                  rows={6}
                  value={customTemplateText}
                  onChange={e => setCustomTemplateText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                  <span>Insert tag:</span>
                  {['{CustomerName}', '{YardName}', '{Location}', '{Phone}', '{InventoryList}', '{PromoNote}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCustomTemplateText(prev => prev + ' ' + tag)}
                      className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded cursor-pointer font-mono"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIP Promo Note Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Optional VIP Promo / Collection Discount Note:
              </label>
              <input
                type="text"
                value={promoNote}
                onChange={e => setPromoNote(e.target.value)}
                placeholder="e.g. 10% discount for orders confirmed this week, or free courier over R5,000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Live WhatsApp Bubble Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Live WhatsApp Message Preview:
                </span>

                {contacts.length > 1 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Previewing for:</span>
                    <select
                      value={previewContactId}
                      onChange={e => setPreviewContactId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-amber-300 font-bold"
                    >
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company ? `(${c.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* WhatsApp UI Simulation Box */}
              <div className="bg-[#0b141a] border border-[#222e35] rounded-2xl p-4 shadow-inner">
                {/* Chat Top Bar */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#222e35] text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px]">
                      {previewContact?.name.charAt(0) || 'C'}
                    </div>
                    <div>
                      <span className="text-white font-bold block leading-none">
                        {previewContact?.name || 'Customer'}
                      </span>
                      <span className="text-[9px] text-emerald-400">
                        {previewContact?.phone || seller.phone}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    WhatsApp Chat Simulation
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-none p-3.5 text-xs shadow-md space-y-2 whitespace-pre-wrap leading-relaxed max-w-full font-sans">
                  {previewMessageText}
                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/70 pt-1">
                    <span>Just now</span>
                    <span>✓✓</span>
                  </div>
                </div>

                {/* Quick Copy Buttons */}
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#222e35]">
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(previewMessageText, `Copied preview message for ${previewContact?.name || 'customer'}`)}
                    className="text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(broadcastListMessageText, 'Copied generic broadcast announcement text for WhatsApp Broadcast List!')}
                    className="text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-500/40 transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                    title="Copy announcement without recipient name to paste directly in WhatsApp Broadcast lists or Group Communities"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy for WA Broadcast List</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 3. Customer Contacts & Multi-Send Queue (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* SECTION 3: RECIPIENTS & DISPATCH ENGINE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Buyer Contacts ({selectedContactIds.length}/{contacts.length})
                </h3>
              </div>

              {/* Action Buttons: Add, Bulk Import */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Add new customer contact"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBulkImportModalOpen(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors border border-slate-700"
                  title="Bulk paste CSV or contacts list"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import</span>
                </button>
              </div>
            </div>

            {/* Dispatch Engine Primary Action (Send Next) */}
            {nextPendingContact && selectedItems.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-3.5 text-slate-950 shadow-lg flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-950 block">
                    Next in Queue:
                  </span>
                  <p className="text-xs font-black truncate">{nextPendingContact.name}</p>
                  <p className="text-[10px] font-bold text-emerald-950 truncate">
                    {nextPendingContact.company || nextPendingContact.phone}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendToContact(nextPendingContact)}
                  className="px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-emerald-300 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            )}

            {/* Filter Contacts Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by buyer name, company, phone..."
                  value={contactSearchQuery}
                  onChange={e => setContactSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tag filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setContactTagFilter('all')}
                  className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer ${
                    contactTagFilter === 'all'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({contacts.length})
                </button>
                {uniqueTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setContactTagFilter(tag)}
                    className={`px-2 py-0.5 rounded-lg font-bold shrink-0 cursor-pointer ${
                      contactTagFilter === tag
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Multi-Select Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>{selectedContactIds.length} of {contacts.length} recipients selected</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="hover:text-emerald-400 font-bold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="hover:text-rose-400 font-bold cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            </div>

            {/* Contacts Queue List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 scrollbar-thin flex-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No contacts matching filter.
                </div>
              ) : (
                filteredContacts.map(contact => {
                  const isSelected = selectedContactIds.includes(contact.id);
                  const status = dispatchStatus[contact.id] || 'pending';
                  const timestamp = dispatchTimestamp[contact.id];

                  return (
                    <div
                      key={contact.id}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        status === 'sent'
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : isSelected
                          ? 'bg-slate-950/80 border-slate-700'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Checkbox & Name */}
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleContact(contact.id)}
                            className="cursor-pointer text-slate-400 hover:text-white shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white truncate">{contact.name}</p>
                              {status === 'sent' && (
                                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> Sent {timestamp || ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
                              {contact.company && <span className="text-slate-300 truncate">{contact.company}</span>}
                              <span>• {contact.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Send / Action */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSendToContact(contact)}
                            disabled={selectedItems.length === 0}
                            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              status === 'sent'
                                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black shadow-sm'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={`Send direct WhatsApp broadcast to ${contact.name}`}
                          >
                            <Send className="w-3 h-3" />
                            <span className="text-[11px] hidden sm:inline">{status === 'sent' ? 'Resend' : 'Send'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg cursor-pointer"
                            title="Delete contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tag pill & notes */}
                      <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-800/60 text-[10px]">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium">
                          {contact.interestTag || 'General'}
                        </span>
                        {contact.notes && (
                          <span className="text-slate-400 italic truncate max-w-[200px]" title={contact.notes}>
                            {contact.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Utilities */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
              <button
                type="button"
                onClick={handleReloadSampleContacts}
                className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Demo Buyers</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Export Contacts CSV</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD SINGLE CONTACT */}
      {/* ========================================================================= */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Add Customer Contact
              </h3>
              <button
                type="button"
                onClick={() => setIsAddContactModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Full Name / Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Dlamini"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">WhatsApp / Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 082 123 4567 or +27 82 123 4567"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Company / Workshop Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dlamini Plant Logistics"
                  value={newContactCompany}
                  onChange={e => setNewContactCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Interest Category / Tag</label>
                <select
                  value={newContactTag}
                  onChange={e => setNewContactTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Heavy Machinery">Heavy Machinery (CAT, JCB, Komatsu)</option>
                  <option value="Trucks & Commercial">Trucks & Commercial (Scania, Volvo, Isuzu)</option>
                  <option value="Toyota & Bakkies">Toyota & Bakkies (Hilux, Land Cruiser)</option>
                  <option value="Engines & Drivetrain">Engines & Drivetrain</option>
                  <option value="Clearance & Trade">Clearance & Trade Salvage</option>
                  <option value="General Buyer">General Buyer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notes / Preferences</label>
                <input
                  type="text"
                  placeholder="e.g. Inquires regularly for excavators and hydraulic pumps"
                  value={newContactNotes}
                  onChange={e => setNewContactNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK IMPORT CONTACTS */}
      {/* ========================================================================= */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                Bulk Import Customer Contacts
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste your buyer contacts below. Each line can be formatted as:
              <br />
              <code className="text-amber-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded mt-1 inline-block">
                Name, Phone, Company, Interest Tag
              </code>
            </p>

            <textarea
              rows={8}
              placeholder={`Sipho Dlamini, 0831234567, Durban Logistics, Trucks & Commercial\nJohan Venter, 0824567890, Venter Plant, Heavy Machinery\nKoos Marais, 0719876543, Marais Hire, Heavy Machinery`}
              value={bulkImportText}
              onChange={e => setBulkImportText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />

            {bulkImportError && (
              <p className="text-xs text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {bulkImportError}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBulkImportText(
                    `Gary Peterson, 0837778899, Peterson Breakers, Clearance & Trade\nWillem Pretorius, 0845556677, Overberg Spares, Toyota & Bakkies\nThabo Mokoena, 0823334455, Mokoena Transport, Trucks & Commercial`
                  );
                }}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Paste Sample CSV
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImportSubmit}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Import Contacts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
