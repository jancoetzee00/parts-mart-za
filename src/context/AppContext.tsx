import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  InventoryItem,
  OwnerBankingDetails,
  OwnerSettings,
  Seller,
  FilterState,
  SubscriptionStatus,
  SubscriptionPlanId,
  SubscriptionPlan,
  SubscriptionPromoCampaign,
  SellerSpecial,
  SellerCompetition,
  CompetitionEntry
} from '../types';
import {
  INITIAL_INVENTORY,
  INITIAL_OWNER_SETTINGS,
  INITIAL_SELLERS,
  SUBSCRIPTION_PLANS,
  INITIAL_SPECIALS,
  INITIAL_COMPETITIONS,
  INITIAL_COMPETITION_ENTRIES
} from '../data/initialData';
import {
  testFirebaseConnection,
  seedInitialFirebaseDataIfEmpty,
  subscribeSellers,
  subscribeInventory,
  subscribeOwnerSettings,
  subscribeSpecials,
  subscribeCompetitions,
  subscribeCompetitionEntries,
  saveSellerDoc,
  deleteSellerDoc,
  saveInventoryDoc,
  deleteInventoryDoc,
  saveOwnerSettingsDoc,
  saveSpecialDoc,
  deleteSpecialDoc,
  saveCompetitionDoc,
  saveCompetitionEntryDoc
} from '../lib/firebase';

interface AppContextType {
  inventory: InventoryItem[];
  sellers: Seller[];
  ownerSettings: OwnerSettings;
  subscriptionPlans: SubscriptionPlan[];
  promotionalCampaign?: SubscriptionPromoCampaign;
  activeSeller: Seller | null;
  activeSellerId: string | null;
  isOwnerAdminLoggedIn: boolean;
  filter: FilterState;
  favorites: string[];
  specials: SellerSpecial[];
  competitions: SellerCompetition[];
  competitionEntries: CompetitionEntry[];

  // Actions
  setActiveSellerId: (id: string | null) => void;
  loginOwner: (password: string) => boolean;
  logoutOwner: () => void;
  updateOwnerPassword: (newPass: string) => void;
  updateOwnerBankingDetails: (details: OwnerBankingDetails) => void;
  updateOwnerWhatsappSettings: (autoReply: NonNullable<OwnerSettings['whatsappAutoReply']>) => void;
  updateSubscriptionPlans: (plans: SubscriptionPlan[]) => void;
  updateSingleSubscriptionPlan: (planId: SubscriptionPlanId, updates: Partial<SubscriptionPlan>) => void;
  updatePromotionalCampaign: (campaign: Partial<SubscriptionPromoCampaign>) => void;
  getPlanEffectivePricing: (planInput: string | SubscriptionPlan) => {
    plan: SubscriptionPlan;
    planId: SubscriptionPlanId;
    name: string;
    description: string;
    maxListings: number;
    features: string[];
    price: number;
    effectivePrice: number;
    finalPrice: number;
    originalPrice: number;
    basePrice: number;
    isDiscountActive: boolean;
    hasDiscount: boolean;
    discountPercentage: number;
    discountPercent: number;
    savingsZar: number;
    promotionalBadge?: string;
    promoNotice?: string;
  };
  updateSellerOutOfOffice: (sellerId: string, enabled: boolean, message?: string, returnDate?: string) => void;

  // Favorites
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
  clearFavorites: () => void;

  // Seller management
  registerSeller: (sellerData: Omit<Seller, 'id' | 'createdAt' | 'subscriptionStatus' | 'subscriptionDueDate'>) => Seller;
  updateSeller: (seller: Seller) => void;
  updateSellerStatus: (sellerId: string, status: SubscriptionStatus, dueDate?: string) => void;
  submitPaymentProof: (sellerId: string, reference: string) => void;
  deleteSeller: (sellerId: string, deleteAssociatedListings?: boolean) => void;
  removeUnpaidSellerAndListings: (sellerId: string) => void;

  // Inventory management
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => void;
  deleteMultipleInventoryItems: (itemIds: string[]) => void;
  incrementViews: (itemId: string) => void;

  // Specials Management
  addSpecial: (special: Omit<SellerSpecial, 'id' | 'createdAt' | 'views'>) => SellerSpecial;
  deleteSpecial: (specialId: string) => void;
  incrementSpecialViews: (specialId: string) => void;

  // Competitions Management
  addCompetition: (comp: Omit<SellerCompetition, 'id' | 'createdAt'>) => SellerCompetition;
  updateCompetition: (comp: SellerCompetition) => void;
  submitCompetitionEntry: (entry: Omit<CompetitionEntry, 'id' | 'submittedAt' | 'status'>) => CompetitionEntry;
  updateCompetitionEntryStatus: (entryId: string, status: 'pending' | 'approved' | 'winner') => void;

  // Filtering
  setFilter: (newFilter: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Helpers
  getSellerById: (sellerId: string) => Seller | undefined;
  getSellerListings: (sellerId: string) => InventoryItem[];
  getSellerSpecials: (sellerId: string) => SellerSpecial[];
  getSellerEntries: (sellerId: string) => CompetitionEntry[];
}

const STORAGE_KEYS = {
  INVENTORY: 'part_smart_za_inventory_v1',
  SELLERS: 'part_smart_za_sellers_v1',
  OWNER_SETTINGS: 'part_smart_za_owner_settings_v1',
  ACTIVE_SELLER_ID: 'part_smart_za_active_seller_id_v1',
  FAVORITES: 'part_smart_za_favorites_v1',
  SPECIALS: 'part_smart_za_specials_v1',
  COMPETITIONS: 'part_smart_za_competitions_v1',
  COMPETITION_ENTRIES: 'part_smart_za_competition_entries_v1'
};

const initialFilterState: FilterState = {
  searchQuery: '',
  category: 'all',
  subcategory: 'All',
  condition: 'all',
  province: 'all',
  make: '',
  sortBy: 'newest'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  // Sellers state
  const [sellers, setSellers] = useState<Seller[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELLERS);
      return saved ? JSON.parse(saved) : INITIAL_SELLERS;
    } catch {
      return INITIAL_SELLERS;
    }
  });

  // Owner settings state (including banking details & password)
  const [ownerSettings, setOwnerSettings] = useState<OwnerSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OWNER_SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_OWNER_SETTINGS;
    } catch {
      return INITIAL_OWNER_SETTINGS;
    }
  });

  // Active seller session
  const [activeSellerId, setActiveSellerIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_SELLER_ID) || null;
    } catch {
      return null;
    }
  });

  // Admin authentication state
  const [isOwnerAdminLoggedIn, setIsOwnerAdminLoggedIn] = useState<boolean>(false);

  // Specials state
  const [specials, setSpecials] = useState<SellerSpecial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPECIALS);
      return saved ? JSON.parse(saved) : INITIAL_SPECIALS;
    } catch {
      return INITIAL_SPECIALS;
    }
  });

  // Competitions state
  const [competitions, setCompetitions] = useState<SellerCompetition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPETITIONS);
      return saved ? JSON.parse(saved) : INITIAL_COMPETITIONS;
    } catch {
      return INITIAL_COMPETITIONS;
    }
  });

  // Competition entries state
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPETITION_ENTRIES);
      return saved ? JSON.parse(saved) : INITIAL_COMPETITION_ENTRIES;
    } catch {
      return INITIAL_COMPETITION_ENTRIES;
    }
  });

  // Filters state
  const [filter, setFilterState] = useState<FilterState>(initialFilterState);

  // Favorites state (persisted in local storage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save favorites to localStorage whenever it changes
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites);
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
    } catch (err) {
      console.warn('Could not save favorites to localStorage:', err);
    }
  };

  const isFavorite = (itemId: string) => {
    return favorites.includes(itemId);
  };

  const toggleFavorite = (itemId: string) => {
    if (!itemId) return;
    const isFav = favorites.includes(itemId);
    const updated = isFav
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];
    saveFavorites(updated);
  };

  const clearFavorites = () => {
    saveFavorites([]);
  };

  // Initial Firebase setup & real-time synchronization
  useEffect(() => {
    // Test connection & seed initial data if Firestore collections are empty
    testFirebaseConnection();
    seedInitialFirebaseDataIfEmpty(
      INITIAL_INVENTORY,
      INITIAL_SELLERS,
      INITIAL_OWNER_SETTINGS,
      INITIAL_SPECIALS,
      INITIAL_COMPETITIONS,
      INITIAL_COMPETITION_ENTRIES
    );

    // Subscribe to Sellers
    const unsubscribeSellers = subscribeSellers((remoteSellers) => {
      if (Array.isArray(remoteSellers) && remoteSellers.length > 0) {
        setSellers(remoteSellers);
      }
    });

    // Subscribe to Inventory
    const unsubscribeInventory = subscribeInventory((remoteInventory) => {
      if (Array.isArray(remoteInventory) && remoteInventory.length > 0) {
        setInventory(remoteInventory);
      }
    });

    // Subscribe to Owner Settings
    const unsubscribeOwner = subscribeOwnerSettings((remoteSettings) => {
      if (remoteSettings) {
        setOwnerSettings(remoteSettings);
      }
    });

    // Subscribe to Specials
    const unsubscribeSpecials = subscribeSpecials((remoteSpecials) => {
      if (Array.isArray(remoteSpecials) && remoteSpecials.length > 0) {
        setSpecials(remoteSpecials);
      }
    });

    // Subscribe to Competitions
    const unsubscribeCompetitions = subscribeCompetitions((remoteComps) => {
      if (Array.isArray(remoteComps) && remoteComps.length > 0) {
        setCompetitions(remoteComps);
      }
    });

    // Subscribe to Competition Entries
    const unsubscribeEntries = subscribeCompetitionEntries((remoteEntries) => {
      if (Array.isArray(remoteEntries) && remoteEntries.length > 0) {
        setCompetitionEntries(remoteEntries);
      }
    });

    return () => {
      unsubscribeSellers();
      unsubscribeInventory();
      unsubscribeOwner();
      unsubscribeSpecials();
      unsubscribeCompetitions();
      unsubscribeEntries();
    };
  }, []);

  // Sync to LocalStorage (as offline backup)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OWNER_SETTINGS, JSON.stringify(ownerSettings));
  }, [ownerSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(specials));
  }, [specials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPETITIONS, JSON.stringify(competitions));
  }, [competitions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPETITION_ENTRIES, JSON.stringify(competitionEntries));
  }, [competitionEntries]);

  useEffect(() => {
    if (activeSellerId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SELLER_ID, activeSellerId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SELLER_ID);
    }
  }, [activeSellerId]);

  const activeSeller = sellers.find(s => s.id === activeSellerId) || null;

  const setActiveSellerId = (id: string | null) => {
    setActiveSellerIdState(id);
  };

  // Owner Admin Authentication
  const loginOwner = (password: string): boolean => {
    if (password === ownerSettings.passwordHash) {
      setIsOwnerAdminLoggedIn(true);
      return true;
    }
    return false;
  };

  const logoutOwner = () => {
    setIsOwnerAdminLoggedIn(false);
  };

  const updateOwnerPassword = (newPass: string) => {
    const newSettings = {
      ...ownerSettings,
      passwordHash: newPass
    };
    setOwnerSettings(newSettings);
    saveOwnerSettingsDoc(newSettings);
  };

  const updateOwnerBankingDetails = (details: OwnerBankingDetails) => {
    const newSettings = {
      ...ownerSettings,
      bankingDetails: {
        ...details,
        updatedAt: new Date().toISOString()
      }
    };
    setOwnerSettings(newSettings);
    saveOwnerSettingsDoc(newSettings);
  };

  const updateOwnerWhatsappSettings = (autoReply: NonNullable<OwnerSettings['whatsappAutoReply']>) => {
    const newSettings: OwnerSettings = {
      ...ownerSettings,
      whatsappAutoReply: {
        ...ownerSettings.whatsappAutoReply,
        ...autoReply
      }
    };
    setOwnerSettings(newSettings);
    saveOwnerSettingsDoc(newSettings);
  };

  // Subscription Plans & Promotional Pricing Management
  const subscriptionPlans = ownerSettings.subscriptionPlans && ownerSettings.subscriptionPlans.length > 0
    ? ownerSettings.subscriptionPlans
    : SUBSCRIPTION_PLANS;

  const promotionalCampaign = ownerSettings.promotionalCampaign;

  const updateSubscriptionPlans = (plans: SubscriptionPlan[]) => {
    const newSettings: OwnerSettings = {
      ...ownerSettings,
      subscriptionPlans: plans
    };
    setOwnerSettings(newSettings);
    saveOwnerSettingsDoc(newSettings);
  };

  const updateSingleSubscriptionPlan = (planId: SubscriptionPlanId, updates: Partial<SubscriptionPlan>) => {
    const currentPlans = ownerSettings.subscriptionPlans && ownerSettings.subscriptionPlans.length > 0
      ? ownerSettings.subscriptionPlans
      : SUBSCRIPTION_PLANS;

    const updatedPlans = currentPlans.map(p => {
      if (p.id === planId) {
        return { ...p, ...updates };
      }
      return p;
    });

    const newSettings: OwnerSettings = {
      ...ownerSettings,
      subscriptionPlans: updatedPlans
    };
    setOwnerSettings(newSettings);
    saveOwnerSettingsDoc(newSettings);
  };

  const updatePromotionalCampaign = (campaignUpdates: Partial<SubscriptionPromoCampaign>) => {
    const defaultCampaign: SubscriptionPromoCampaign = {
      enabled: false,
      campaignTitle: 'Yard Booster Promo Campaign',
      headline: 'Special Promotional Subscription Rates',
      badgeText: 'LIMITED PROMO',
      announcementText: 'Discounted monthly advertising packages for scrap yards & auto dismantlers.',
      discountPercentage: 20
    };

    const newSettings: OwnerSettings = {
      ...ownerSettings,
      promotionalCampaign: {
        ...defaultCampaign,
        ...ownerSettings.promotionalCampaign,
        ...campaignUpdates
      }
    };
    setOwnerSettings(newSettings);
    saveOwnerSettingsDoc(newSettings);
  };

  // Universal helper to resolve effective pricing for any plan
  const getPlanEffectivePricing = (planInput: string | SubscriptionPlan) => {
    const currentPlans = ownerSettings.subscriptionPlans && ownerSettings.subscriptionPlans.length > 0
      ? ownerSettings.subscriptionPlans
      : SUBSCRIPTION_PLANS;

    let plan: SubscriptionPlan | undefined;
    if (typeof planInput === 'string') {
      let targetId = planInput;
      if (planInput === 'starter') targetId = 'basic';
      if (planInput === 'dealer_unlimited') targetId = 'enterprise';
      plan = currentPlans.find(p => p.id === targetId);
    } else {
      plan = currentPlans.find(p => p.id === planInput.id) || planInput;
    }

    if (!plan) {
      plan = currentPlans[0] || SUBSCRIPTION_PLANS[0];
    }

    const basePrice = (typeof plan.priceZar === 'number' && plan.priceZar > 0) ? plan.priceZar : 450;
    
    // Check both plan-level discount and global promotional campaign
    const campaign = ownerSettings.promotionalCampaign;
    const isCampaignActive = Boolean(campaign?.enabled);
    const campaignDiscount = (isCampaignActive && typeof campaign?.discountPercentage === 'number' && campaign.discountPercentage > 0)
      ? campaign.discountPercentage
      : 0;

    const isPromoActive = Boolean(plan.isDiscountActive) || (isCampaignActive && campaignDiscount > 0);
    
    let discountPercent = 0;
    if (typeof plan.discountPercentage === 'number' && plan.discountPercentage > 0) {
      discountPercent = plan.discountPercentage;
    } else if (isCampaignActive && campaignDiscount > 0) {
      discountPercent = campaignDiscount;
    }

    let finalPrice = basePrice;
    if (isPromoActive) {
      if (typeof plan.promoPriceZar === 'number' && plan.promoPriceZar > 0) {
        finalPrice = plan.promoPriceZar;
      } else if (discountPercent > 0) {
        finalPrice = Math.round(basePrice * (1 - discountPercent / 100));
      }
    }

    // Safety guarantees
    if (typeof finalPrice !== 'number' || isNaN(finalPrice) || finalPrice <= 0) {
      finalPrice = basePrice;
    }

    const hasDiscount = isPromoActive && finalPrice < basePrice;
    const savingsZar = Math.max(0, basePrice - finalPrice);
    const calculatedDiscountPct = hasDiscount
      ? (discountPercent > 0 ? discountPercent : Math.round((savingsZar / basePrice) * 100))
      : 0;

    const promotionalBadge = plan.promotionalBadge
      || (isCampaignActive && campaign?.badgeText ? campaign.badgeText : undefined)
      || (hasDiscount ? `🔥 ${calculatedDiscountPct}% OFF` : undefined);

    const promoNotice = plan.promoNotice
      || (isCampaignActive && campaign?.headline ? campaign.headline : undefined);

    return {
      plan,
      planId: plan.id,
      name: plan.name,
      description: plan.description,
      maxListings: plan.maxListings,
      features: plan.features,
      price: finalPrice,
      effectivePrice: finalPrice,
      finalPrice,
      originalPrice: basePrice,
      basePrice,
      isDiscountActive: hasDiscount,
      hasDiscount,
      discountPercentage: calculatedDiscountPct,
      discountPercent: calculatedDiscountPct,
      savingsZar,
      promotionalBadge,
      promoNotice
    };
  };

  const updateSellerOutOfOffice = (
    sellerId: string,
    enabled: boolean,
    message?: string,
    returnDate?: string
  ) => {
    const existingSeller = sellers.find(s => s.id === sellerId);
    if (!existingSeller) return;

    const updatedSeller: Seller = {
      ...existingSeller,
      outOfOfficeEnabled: enabled,
      outOfOfficeMessage: message !== undefined ? message : existingSeller.outOfOfficeMessage,
      outOfOfficeReturnDate: returnDate !== undefined ? returnDate : existingSeller.outOfOfficeReturnDate
    };

    setSellers(prev => prev.map(s => (s.id === sellerId ? updatedSeller : s)));
    saveSellerDoc(updatedSeller);
  };

  // Seller operations
  const registerSeller = (
    sellerData: Omit<Seller, 'id' | 'createdAt' | 'subscriptionStatus' | 'subscriptionDueDate'>
  ): Seller => {
    const newId = `seller-${Date.now()}`;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const newSeller: Seller = {
      ...sellerData,
      id: newId,
      subscriptionStatus: 'unpaid', // New registrations start as unpaid until proof/EFT confirmed
      subscriptionDueDate: nextMonth.toISOString(),
      createdAt: new Date().toISOString()
    };

    setSellers(prev => [newSeller, ...prev]);
    setActiveSellerIdState(newId);
    saveSellerDoc(newSeller);
    return newSeller;
  };

  const updateSeller = (updatedSeller: Seller) => {
    setSellers(prev => prev.map(s => (s.id === updatedSeller.id ? updatedSeller : s)));
    saveSellerDoc(updatedSeller);
  };

  const updateSellerStatus = (sellerId: string, status: SubscriptionStatus, dueDate?: string) => {
    const existingSeller = sellers.find(s => s.id === sellerId);
    if (!existingSeller) return;

    const updatedSeller: Seller = {
      ...existingSeller,
      subscriptionStatus: status,
      subscriptionDueDate: dueDate || existingSeller.subscriptionDueDate
    };

    setSellers(prev => prev.map(s => (s.id === sellerId ? updatedSeller : s)));
    saveSellerDoc(updatedSeller);
  };

  const submitPaymentProof = (sellerId: string, reference: string) => {
    const existingSeller = sellers.find(s => s.id === sellerId);
    if (!existingSeller) return;

    const updatedSeller: Seller = {
      ...existingSeller,
      subscriptionStatus: 'pending_verification',
      lastPaymentRef: reference,
      paymentProofSubmittedAt: new Date().toISOString()
    };

    setSellers(prev => prev.map(s => (s.id === sellerId ? updatedSeller : s)));
    saveSellerDoc(updatedSeller);
  };

  // OWNER DELETE SELLER & ALL ASSOCIATED LISTINGS
  const deleteSeller = (sellerId: string, deleteAssociatedListings: boolean = true) => {
    // 1. Remove seller from state
    setSellers(prev => {
      const updated = prev.filter(s => s.id !== sellerId);
      try {
        localStorage.setItem(STORAGE_KEYS.SELLERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Remove seller document from Firestore
    deleteSellerDoc(sellerId).catch(err => console.warn('Could not delete seller doc:', err));

    // 3. Remove all inventory items belonging to this seller
    if (deleteAssociatedListings) {
      setInventory(prev => {
        const remaining = prev.filter(item => item.sellerId !== sellerId);
        const sellerItems = prev.filter(item => item.sellerId === sellerId);
        try {
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(remaining));
        } catch {}
        sellerItems.forEach(item => {
          deleteInventoryDoc(item.id).catch(err => console.warn('Could not delete item doc:', err));
        });
        return remaining;
      });
    }

    // 4. If active seller was this one, clear active seller session
    if (activeSellerId === sellerId) {
      setActiveSellerIdState(null);
      try {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SELLER_ID);
      } catch {}
    }
  };

  // Keep for backwards compatibility
  const removeUnpaidSellerAndListings = (sellerId: string) => {
    deleteSeller(sellerId, true);
  };

  // Inventory Operations
  const addInventoryItem = (
    itemData: Omit<InventoryItem, 'id' | 'views' | 'createdAt' | 'updatedAt'>
  ) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setInventory(prev => [newItem, ...prev]);
    saveInventoryDoc(newItem);
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    const itemWithUpdate = { ...updatedItem, updatedAt: new Date().toISOString() };
    setInventory(prev =>
      prev.map(item => (item.id === updatedItem.id ? itemWithUpdate : item))
    );
    saveInventoryDoc(itemWithUpdate);
  };

  const deleteInventoryItem = (itemId: string) => {
    setInventory(prev => {
      const remaining = prev.filter(item => item.id !== itemId);
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(remaining));
      } catch {}
      return remaining;
    });
    deleteInventoryDoc(itemId).catch(err => console.warn('Could not delete item doc:', err));
  };

  const deleteMultipleInventoryItems = (itemIds: string[]) => {
    if (!itemIds || itemIds.length === 0) return;
    const idSet = new Set(itemIds);
    setInventory(prev => {
      const remaining = prev.filter(item => !idSet.has(item.id));
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(remaining));
      } catch {}
      return remaining;
    });
    itemIds.forEach(id => {
      deleteInventoryDoc(id).catch(err => console.warn('Could not delete item doc:', err));
    });
  };

  const incrementViews = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const updated = { ...item, views: item.views + 1 };
    setInventory(prev =>
      prev.map(i => (i.id === itemId ? updated : i))
    );
    saveInventoryDoc(updated);
  };

  // Specials Operations
  const addSpecial = (specialData: Omit<SellerSpecial, 'id' | 'createdAt' | 'views'>): SellerSpecial => {
    const newSpecial: SellerSpecial = {
      ...specialData,
      id: `special-${Date.now()}`,
      views: 0,
      createdAt: new Date().toISOString()
    };
    setSpecials(prev => [newSpecial, ...prev]);
    saveSpecialDoc(newSpecial);
    return newSpecial;
  };

  const deleteSpecial = (specialId: string) => {
    setSpecials(prev => {
      const remaining = prev.filter(s => s.id !== specialId);
      try {
        localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(remaining));
      } catch {}
      return remaining;
    });
    deleteSpecialDoc(specialId).catch(err => console.warn('Could not delete special doc:', err));
  };

  const incrementSpecialViews = (specialId: string) => {
    const sp = specials.find(s => s.id === specialId);
    if (!sp) return;
    const updated = { ...sp, views: (sp.views || 0) + 1 };
    setSpecials(prev => prev.map(s => (s.id === specialId ? updated : s)));
    saveSpecialDoc(updated);
  };

  // Competitions Operations
  const addCompetition = (compData: Omit<SellerCompetition, 'id' | 'createdAt'>): SellerCompetition => {
    const newComp: SellerCompetition = {
      ...compData,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCompetitions(prev => [newComp, ...prev]);
    saveCompetitionDoc(newComp);
    return newComp;
  };

  const updateCompetition = (comp: SellerCompetition) => {
    setCompetitions(prev => prev.map(c => (c.id === comp.id ? comp : c)));
    saveCompetitionDoc(comp);
  };

  const submitCompetitionEntry = (
    entryData: Omit<CompetitionEntry, 'id' | 'submittedAt' | 'status'>
  ): CompetitionEntry => {
    const newEntry: CompetitionEntry = {
      ...entryData,
      id: `entry-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    setCompetitionEntries(prev => [newEntry, ...prev]);
    saveCompetitionEntryDoc(newEntry);

    // Update competition participant count
    setCompetitions(prev =>
      prev.map(c =>
        c.id === entryData.competitionId
          ? { ...c, participantsCount: (c.participantsCount || 0) + 1 }
          : c
      )
    );
    return newEntry;
  };

  const updateCompetitionEntryStatus = (entryId: string, status: 'pending' | 'approved' | 'winner') => {
    const target = competitionEntries.find(e => e.id === entryId);
    if (!target) return;
    const updated: CompetitionEntry = { ...target, status };
    setCompetitionEntries(prev => prev.map(e => (e.id === entryId ? updated : e)));
    saveCompetitionEntryDoc(updated);
  };

  // Filter Operations
  const setFilter = (newFilter: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  };

  const resetFilters = () => {
    setFilterState(initialFilterState);
  };

  // Helper getters
  const getSellerById = (sellerId: string) => sellers.find(s => s.id === sellerId);
  const getSellerListings = (sellerId: string) => inventory.filter(i => i.sellerId === sellerId);
  const getSellerSpecials = (sellerId: string) => specials.filter(s => s.sellerId === sellerId);
  const getSellerEntries = (sellerId: string) => competitionEntries.filter(e => e.sellerId === sellerId);

  return (
    <AppContext.Provider
      value={{
        inventory,
        sellers,
        ownerSettings,
        subscriptionPlans,
        promotionalCampaign,
        activeSeller,
        activeSellerId,
        isOwnerAdminLoggedIn,
        filter,
        favorites,
        specials,
        competitions,
        competitionEntries,
        setActiveSellerId,
        loginOwner,
        logoutOwner,
        updateOwnerPassword,
        updateOwnerBankingDetails,
        updateOwnerWhatsappSettings,
        updateSubscriptionPlans,
        updateSingleSubscriptionPlan,
        updatePromotionalCampaign,
        getPlanEffectivePricing,
        updateSellerOutOfOffice,
        isFavorite,
        toggleFavorite,
        clearFavorites,
        registerSeller,
        updateSeller,
        updateSellerStatus,
        submitPaymentProof,
        deleteSeller,
        removeUnpaidSellerAndListings,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        deleteMultipleInventoryItems,
        incrementViews,
        addSpecial,
        deleteSpecial,
        incrementSpecialViews,
        addCompetition,
        updateCompetition,
        submitCompetitionEntry,
        updateCompetitionEntryStatus,
        setFilter,
        resetFilters,
        getSellerById,
        getSellerListings,
        getSellerSpecials,
        getSellerEntries
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

