export type CategoryType = 'cars' | 'trucks' | 'heavy_equipment';

export type PartCondition = 'new' | 'reconditioned' | 'used' | 'stripping_spares';

export type SAProvince = 
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Mpumalanga'
  | 'Free State'
  | 'Eastern Cape'
  | 'Limpopo'
  | 'North West'
  | 'Northern Cape';

export type SubscriptionPlanId = 'starter' | 'basic' | 'pro' | 'dealer_unlimited' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceZar: number;
  maxListings: number;
  description: string;
  features: string[];
}

export type SubscriptionStatus = 'active' | 'unpaid' | 'pending_verification' | 'expired';

export interface Seller {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  province: SAProvince;
  city: string;
  address: string;
  planId: SubscriptionPlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionDueDate: string; // ISO Date String
  lastPaymentRef?: string;
  paymentProofSubmittedAt?: string;
  outOfOfficeEnabled?: boolean;
  outOfOfficeMessage?: string;
  outOfOfficeReturnDate?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  title: string;
  category: CategoryType;
  subcategory: string; // e.g., 'Engine', 'Hydraulic Pump', 'Gearbox', 'Excavator Bucket', 'Bakkie Spares'
  make: string; // e.g., 'CAT', 'Komatsu', 'Toyota', 'Scania', 'JCB', 'Cummins', 'Volvo'
  model: string; // e.g., '320D', 'Hilux GD-6', 'R560', 'JS200'
  year?: number;
  partNumber?: string;
  condition: PartCondition;
  priceZar: number;
  province: SAProvince;
  city: string;
  description: string;
  specifications: Record<string, string>;
  images: string[];
  isFeatured?: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerBankingDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  swiftCode?: string;
  paymentReferenceFormat: string;
  additionalInstructions: string;
  updatedAt: string;
}

export interface OwnerSettings {
  passwordHash: string; // Default password 'admin123' or customizable
  bankingDetails: OwnerBankingDetails;
  ownerEmail: string;
  ownerPhone: string;
  whatsappAutoReply?: {
    enabledByDefault?: boolean;
    defaultOutOfOfficeTemplate?: string;
    platformEmergencyPhone?: string;
  };
}

export interface SellerSpecial {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  sellerCity: string;
  sellerProvince: SAProvince;
  title: string;
  category: CategoryType;
  subcategory: string;
  badge: string; // e.g. "45% OFF", "Clearance Deal", "Free Delivery in GP", "Bundle Combo"
  originalPriceZar: number;
  specialPriceZar: number;
  description: string;
  terms?: string;
  expiresAt: string; // ISO string
  imageUrl: string;
  isFeatured?: boolean;
  views?: number;
  createdAt: string;
}

export interface CompetitionPrize {
  rank: string; // e.g. "1st Place", "2nd Place", "3rd Place"
  reward: string; // e.g. "R15,000 Cash + 6 Months Free Unlimited Dealer Plan"
  badge: string; // e.g. "Gold Trophy Yard"
}

export interface CompetitionLeaderboardItem {
  sellerId: string;
  sellerName: string;
  city: string;
  province: SAProvince;
  metricLabel: string;
  metricValue: string | number;
  rank: number;
  badgeTitle: string;
  highlightNote?: string;
}

export interface SellerCompetition {
  id: string;
  title: string;
  tagline: string;
  description: string;
  categoryType: 'all' | CategoryType | 'yard_excellence';
  prizePool: string;
  prizes: CompetitionPrize[];
  startDate: string;
  endDate: string;
  status: 'active' | 'judging' | 'completed';
  bannerImage: string;
  rules: string[];
  criteria: string[];
  participantsCount: number;
  leaderboard: CompetitionLeaderboardItem[];
  createdAt: string;
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  sellerId: string;
  sellerName: string;
  sellerWhatsapp: string;
  sellerCity: string;
  entryTitle: string;
  entryDescription: string;
  imageUrl?: string;
  proofMetrics?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'winner';
}

export interface FilterState {
  searchQuery: string;
  category: CategoryType | 'all';
  subcategory: string;
  condition: PartCondition | 'all';
  province: SAProvince | 'all';
  minPrice?: number;
  maxPrice?: number;
  make: string;
  sortBy: 'newest' | 'price_low' | 'price_high' | 'views';
  onlyFavorites?: boolean;
}
