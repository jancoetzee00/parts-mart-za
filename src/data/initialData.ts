import {
  InventoryItem,
  OwnerSettings,
  Seller,
  SubscriptionPlan,
  CategoryType,
  PartCondition,
  SAProvince,
  SellerSpecial,
  SellerCompetition,
  CompetitionEntry
} from '../types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceZar: 450,
    maxListings: 10,
    description: 'Essential advertising for small auto scrap yards & local spares shops.',
    features: [
      'Up to 10 active inventory listings',
      'Direct WhatsApp & Phone lead routing',
      'Standard search directory placement',
      'Basic listing views counter',
      'Community email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    priceZar: 850,
    maxListings: 50,
    description: 'High-visibility advertising for commercial truck breakers & equipment suppliers.',
    features: [
      'Up to 50 active inventory listings',
      'Featured Yard Badge on search results',
      'Priority Province & City search ranking',
      'Direct WhatsApp & Phone lead routing',
      'Detailed buyer inquiry analytics',
      'Priority Email & WhatsApp support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceZar: 1850,
    maxListings: 9999,
    description: 'Maximum exposure & unlimited listings for major equipment dealers & fleet yards.',
    features: [
      'Unlimited inventory listings',
      'Top homepage banner exposure',
      'Verified Heavy Dealer badge',
      'Bulk inventory CSV upload assistant',
      'Dedicated account manager',
      'Instant auto-check EFT verification'
    ]
  }
];

export const INITIAL_OWNER_SETTINGS: OwnerSettings = {
  passwordHash: 'admin123', // Default admin password
  ownerEmail: 'accounts@partsmart.co.za',
  ownerPhone: '+27 11 892 4000',
  bankingDetails: {
    bankName: 'First National Bank (FNB)',
    accountHolder: 'Part-Smart ZA (Pty) Ltd',
    accountNumber: '62849102384',
    branchCode: '250655',
    accountType: 'Business Cheque Account',
    swiftCode: 'FIRNZAJJ',
    paymentReferenceFormat: 'PS-[COMPANY-NAME] or PS-[SELLER-ID]',
    additionalInstructions: 'Please use your registered Company Name or Seller ID as the EFT payment reference. Email proof of payment (POP) to accounts@partsmart.co.za or upload your reference number in the Seller Portal for instant review.',
    updatedAt: new Date().toISOString()
  },
  whatsappAutoReply: {
    enabledByDefault: false,
    defaultOutOfOfficeTemplate: 'Our scrap yard sales desk is currently closed or out of office. All spare part enquiries will be prioritised once trading opens. For urgent commercial breakdown emergencies, please leave your vehicle VIN and engine code.',
    platformEmergencyPhone: '+27 82 459 1102'
  }
};

export const INITIAL_SELLERS: Seller[] = [
  {
    id: 'seller-1',
    companyName: 'Highveld Earthmoving Spares',
    contactName: 'Johan van der Merwe',
    phone: '+27 82 459 1102',
    whatsapp: '27824591102',
    email: 'johan@highveldspares.co.za',
    province: 'Gauteng',
    city: 'Boksburg, Johannesburg',
    address: '45 Commissioner Street, Jet Park',
    planId: 'dealer_unlimited',
    subscriptionStatus: 'active',
    subscriptionDueDate: '2026-09-01T00:00:00.000Z',
    lastPaymentRef: 'PS-HIGHVELD-AUG26',
    outOfOfficeEnabled: false,
    outOfOfficeMessage: 'Sales counter online. Inquiries received during business hours (07:30 - 17:00) answered within 15 minutes.',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'seller-2',
    companyName: 'Cape Truck Breakers & Diesels',
    contactName: 'Thabo Mokoena',
    phone: '+27 83 912 3344',
    whatsapp: '27839123344',
    email: 'sales@capetruckbreakers.co.za',
    province: 'Western Cape',
    city: 'Epping, Cape Town',
    address: '12 Viking Way, Epping Industria',
    planId: 'pro',
    subscriptionStatus: 'active',
    subscriptionDueDate: '2026-08-25T00:00:00.000Z',
    lastPaymentRef: 'PS-CAPETRUCK-9812',
    outOfOfficeEnabled: true,
    outOfOfficeMessage: '⚠️ Yard closed for weekend inventory audit & loadshedding cycle. All parts courier dispatches resume Monday at 08:00. For emergency fleet breakdown parts (Scania/Volvo/Freightliner), please WhatsApp our standby technician at 083 912 3344.',
    outOfOfficeReturnDate: 'Monday 08:00',
    createdAt: '2026-02-10T00:00:00.000Z'
  },
  {
    id: 'seller-3',
    companyName: 'KZN Bakkie & Auto Strippers',
    contactName: 'Devan Naidoo',
    phone: '+27 71 884 9201',
    whatsapp: '27718849201',
    email: 'devan@kznbakkiespares.co.za',
    province: 'KwaZulu-Natal',
    city: 'Pinetown, Durban',
    address: '88 Old Main Road',
    planId: 'starter',
    subscriptionStatus: 'unpaid', // UNPAID SELLER FOR OWNER TO TEST REMOVING/EDITING UNPAID SUBSCRIPTIONS
    subscriptionDueDate: '2026-07-30T00:00:00.000Z',
    lastPaymentRef: 'EFT-PENDING-JULY',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'seller-4',
    companyName: 'Limpopo Heavy Machinery & Hydraulics',
    contactName: 'Francois Botha',
    phone: '+27 84 300 7711',
    whatsapp: '27843007711',
    email: 'info@limpopomachinery.co.za',
    province: 'Limpopo',
    city: 'Polokwane',
    address: '22 Industrial Loop',
    planId: 'pro',
    subscriptionStatus: 'pending_verification',
    subscriptionDueDate: '2026-08-15T00:00:00.000Z',
    lastPaymentRef: 'FNB-REF-77112026',
    paymentProofSubmittedAt: '2026-08-08T10:30:00.000Z',
    createdAt: '2026-04-12T00:00:00.000Z'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item-101',
    sellerId: 'seller-1',
    sellerName: 'Highveld Earthmoving Spares',
    sellerPhone: '+27 82 459 1102',
    sellerWhatsapp: '27824591102',
    title: 'Caterpillar 320D Excavator Main Hydraulic Pump (Regulated)',
    category: 'heavy_equipment',
    subcategory: 'Hydraulics & Pumps',
    make: 'Caterpillar',
    model: '320D / 320C',
    year: 2021,
    partNumber: 'CAT-259-0815',
    condition: 'reconditioned',
    priceZar: 85000,
    province: 'Gauteng',
    city: 'Jet Park, Boksburg',
    description: 'Fully reconditioned Caterpillar 320D main twin-variable piston hydraulic pump. Pressure bench tested at 350 bar with full test certificate included. Ready for immediate fitment with 6-month warranty.',
    specifications: {
      'Displacement': '112 cc/rev',
      'Max Working Pressure': '350 Bar',
      'Warranty': '6 Months Mechanical',
      'Stock Condition': 'In Stock - Boksburg Yard'
    },
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    views: 342,
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z'
  },
  {
    id: 'item-102',
    sellerId: 'seller-1',
    sellerName: 'Highveld Earthmoving Spares',
    sellerPhone: '+27 82 459 1102',
    sellerWhatsapp: '27824591102',
    title: 'Komatsu PC200-8 Heavy Duty Excavator Bucket (1.2m³)',
    category: 'heavy_equipment',
    subcategory: 'Buckets & Attachments',
    make: 'Komatsu',
    model: 'PC200 / PC210-8',
    year: 2022,
    partNumber: 'KOM-207-70-K12',
    condition: 'new',
    priceZar: 42500,
    province: 'Gauteng',
    city: 'Boksburg',
    description: 'Brand new reinforced rock bucket for 20-ton excavator class. Features Hardox 400 wear strips, heavy duty side cutters, and 5 x ESCO style bucket teeth. Pin diameter 80mm.',
    specifications: {
      'Capacity': '1.2 Cubic Meters',
      'Pin Diameter': '80 mm',
      'Material': 'Hardox 400 Steel',
      'Tooth Style': 'ESCO V29'
    },
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    views: 189,
    createdAt: '2026-08-02T11:20:00.000Z',
    updatedAt: '2026-08-02T11:20:00.000Z'
  },
  {
    id: 'item-103',
    sellerId: 'seller-2',
    sellerName: 'Cape Truck Breakers & Diesels',
    sellerPhone: '+27 83 912 3344',
    sellerWhatsapp: '27839123344',
    title: 'Scania DC13 V8 Euro 5 Complete Engine Assembly',
    category: 'trucks',
    subcategory: 'Engine & Turbo',
    make: 'Scania',
    model: 'R500 / R560 Streamline',
    year: 2019,
    partNumber: 'DC13-115-SCA',
    condition: 'used',
    priceZar: 165000,
    province: 'Western Cape',
    city: 'Cape Town',
    description: 'Complete runner Scania DC13 13-liter 6-cylinder / V8 diesel engine removed from a clean 2019 Scania R-Series horse with 420,000 km. Complete with turbo, high pressure fuel pump, and ECU harness.',
    specifications: {
      'Horsepower': '500 HP',
      'Mileage': '420,000 km',
      'Fuel System': 'XPI Common Rail',
      'Status': 'Running engine - Dyno tested'
    },
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    views: 512,
    createdAt: '2026-08-03T14:15:00.000Z',
    updatedAt: '2026-08-03T14:15:00.000Z'
  },
  {
    id: 'item-104',
    sellerId: 'seller-2',
    sellerName: 'Cape Truck Breakers & Diesels',
    sellerPhone: '+27 83 912 3344',
    sellerWhatsapp: '27839123344',
    title: 'Volvo FH16 Optidrive 12-Speed Automated Gearbox',
    category: 'trucks',
    subcategory: 'Gearboxes & Drivetrain',
    make: 'Volvo Trucks',
    model: 'FH16 / FM440',
    year: 2020,
    partNumber: 'ATO2612D',
    condition: 'reconditioned',
    priceZar: 95000,
    province: 'Western Cape',
    city: 'Epping, Cape Town',
    description: 'Fully overhauled Volvo Optidrive 12-speed automated transmission box with built-in retarder controller. Complete bearing overhaul with genuine Volvo seals.',
    specifications: {
      'Speeds': '12 Forward + 2 Reverse',
      'Retarder': 'Integrated Hydraulic',
      'Warranty': '3 Month Yard Guarantee'
    },
    images: [
      'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    views: 260,
    createdAt: '2026-08-04T08:45:00.000Z',
    updatedAt: '2026-08-04T08:45:00.000Z'
  },
  {
    id: 'item-105',
    sellerId: 'seller-3',
    sellerName: 'KZN Bakkie & Auto Strippers',
    sellerPhone: '+27 71 884 9201',
    sellerWhatsapp: '27718849201',
    title: 'Toyota Hilux GD-6 2.8L Complete Engine & 6-Speed Manual Gearbox',
    category: 'cars',
    subcategory: 'Engines & Transmissions',
    make: 'Toyota',
    model: 'Hilux Revo GD-6 2.8L',
    year: 2021,
    partNumber: '1GD-FTV-8812',
    condition: 'used',
    priceZar: 68000,
    province: 'KwaZulu-Natal',
    city: 'Pinetown, Durban',
    description: 'Clean running 1GD-FTV 2.8L Turbo Diesel engine with manual 4x4 gearbox from accident damage Toyota Hilux Raider bakkie. Low mileage (78,000 km). Perfect for bakkie conversion or engine replacement.',
    specifications: {
      'Engine Code': '1GD-FTV Turbo Diesel',
      'Displacement': '2755 cc',
      'Drivetrain': '4x4 Manual 6-Speed',
      'Mileage': '78,400 km'
    },
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    views: 410,
    createdAt: '2026-08-05T16:30:00.000Z',
    updatedAt: '2026-08-05T16:30:00.000Z'
  },
  {
    id: 'item-106',
    sellerId: 'seller-3',
    sellerName: 'KZN Bakkie & Auto Strippers',
    sellerPhone: '+27 71 884 9201',
    sellerWhatsapp: '27718849201',
    title: '2020 Ford Ranger 3.2 TDCi Wildtrak Stripping for Spares',
    category: 'cars',
    subcategory: 'Stripping for Spares',
    make: 'Ford',
    model: 'Ranger Wildtrak 3.2 Duratorq',
    year: 2020,
    partNumber: 'FORD-WILD-3.2-STRIP',
    condition: 'stripping_spares',
    priceZar: 12000,
    province: 'KwaZulu-Natal',
    city: 'Durban',
    description: 'Currently stripping 2020 Ford Ranger 3.2 4x4 Wildtrak. Front impact damage. Rear diff assembly, doors, tailgate, leather seats, dashboard, suspension arms, transfer case available.',
    specifications: {
      'Available Parts': 'Rear Axle, Doors, Transfer Case, Seats, ECU',
      'Color': 'Pride Orange',
      'Stripping Status': '90% Parts intact'
    },
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    views: 590,
    createdAt: '2026-08-06T10:00:00.000Z',
    updatedAt: '2026-08-06T10:00:00.000Z'
  },
  {
    id: 'item-107',
    sellerId: 'seller-4',
    sellerName: 'Limpopo Heavy Machinery & Hydraulics',
    sellerPhone: '+27 84 300 7711',
    sellerWhatsapp: '27843007711',
    title: 'JCB 3CX Backhoe Loader Perkins 444 Diesel Engine',
    category: 'heavy_equipment',
    subcategory: 'Engine & Spares',
    make: 'JCB',
    model: '3CX / 4CX Eco',
    year: 2018,
    partNumber: 'JCB-320/04001',
    condition: 'reconditioned',
    priceZar: 78000,
    province: 'Limpopo',
    city: 'Polokwane',
    description: 'Fully reconditioned JCB Dieselmax 4.4L turbocharged engine assembly. New pistons, rings, bearings, and reconditioned cylinder head. Tested on bench.',
    specifications: {
      'Engine Type': 'JCB Dieselmax 444',
      'Power': '68 kW / 92 HP',
      'Warranty': '6 Months'
    },
    images: [
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    views: 215,
    createdAt: '2026-08-07T12:00:00.000Z',
    updatedAt: '2026-08-07T12:00:00.000Z'
  }
];

export const SUBCATEGORIES: Record<CategoryType, string[]> = {
  cars: [
    'All Car Parts',
    'Engines & Transmissions',
    'Stripping for Spares',
    'Body Parts & Panels',
    'Suspension & Steering',
    'Brakes & Hydraulics',
    'Electrical & ECUs',
    'Interior & Seats'
  ],
  trucks: [
    'All Truck Parts',
    'Engine & Turbo',
    'Gearboxes & Drivetrain',
    'Axles, Differentials & Hubs',
    'Truck Cabins & Chassis',
    'Air Brake Systems',
    'Trailer Spares & Fifth Wheels',
    'Stripping Trucks for Spares'
  ],
  heavy_equipment: [
    'All Equipment Parts',
    'Hydraulics & Pumps',
    'Buckets & Attachments',
    'Under carriage & Rubber Tracks',
    'Engine & Spares',
    'Transmission & Final Drive',
    'Cabins & Operator Controls',
    'Breakers & Hammers'
  ]
};

export const PROVINCES_LIST: SAProvince[] = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Mpumalanga',
  'Free State',
  'Eastern Cape',
  'Limpopo',
  'North West',
  'Northern Cape'
];

export const INITIAL_SPECIALS: SellerSpecial[] = [
  {
    id: 'special-1',
    sellerId: 'seller-1',
    sellerName: 'Highveld Earthmoving Spares',
    sellerPhone: '+27 82 459 1102',
    sellerWhatsapp: '27824591102',
    sellerCity: 'Boksburg',
    sellerProvince: 'Gauteng',
    title: 'CAT 320D Main Hydraulic Pump (Refurbished)',
    category: 'heavy_equipment',
    subcategory: 'Hydraulics & Pumps',
    badge: '28% OFF FLASH SALE',
    originalPriceZar: 48000,
    specialPriceZar: 34500,
    description: 'Fully overhauled Kawasaki / CAT main hydraulic pump assembly. Flow tested under simulated 350 bar working pressure. Includes 6-month yard exchange warranty and free same-day freight anywhere in Gauteng.',
    terms: 'Valid until 30 September 2026 or while 2 units remain. Price excludes VAT.',
    expiresAt: '2026-09-30T23:59:59.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    views: 342,
    createdAt: '2026-08-10T08:00:00.000Z'
  },
  {
    id: 'special-2',
    sellerId: 'seller-2',
    sellerName: 'Cape Truck Breakers & Diesels',
    sellerPhone: '+27 83 912 3344',
    sellerWhatsapp: '27839123344',
    sellerCity: 'Epping',
    sellerProvince: 'Western Cape',
    title: 'Scania R500 / R560 V8 Complete Gearbox (GRS905R)',
    category: 'trucks',
    subcategory: 'Gearboxes & Drivetrain',
    badge: 'CLEARANCE DEAL',
    originalPriceZar: 75000,
    specialPriceZar: 58000,
    description: 'Direct import European low-mileage Scania Opticruise transmission with built-in retarder. Stripped, synchros inspected, and ready for drop-in replacement. Immediate nationwide courier dispatch available.',
    terms: 'Exchange unit required or R5,000 core deposit applies. Valid while stocks last.',
    expiresAt: '2026-09-15T23:59:59.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    views: 418,
    createdAt: '2026-08-12T10:30:00.000Z'
  },
  {
    id: 'special-3',
    sellerId: 'seller-4',
    sellerName: 'Jozi Scrap & Auto Recyclers',
    sellerPhone: '+27 84 332 9988',
    sellerWhatsapp: '27843329988',
    sellerCity: 'Soweto',
    sellerProvince: 'Gauteng',
    title: 'Toyota Hilux 2.8 GD-6 Complete Running Engine (1GD-FTV)',
    category: 'cars',
    subcategory: 'Engine & Components',
    badge: 'SAVE R14,000',
    originalPriceZar: 68000,
    specialPriceZar: 54000,
    description: 'Low 42,000km salvage Toyota Hilux 2.8 GD-6 complete with turbo, injectors, diesel common rail pump, and alternator. Compression tested and video of engine running on test bench available on WhatsApp.',
    terms: 'Sold with microdot clearance certificate and scrap purchase invoice.',
    expiresAt: '2026-09-25T23:59:59.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    views: 589,
    createdAt: '2026-08-14T14:15:00.000Z'
  },
  {
    id: 'special-4',
    sellerId: 'seller-3',
    sellerName: 'Durban Commercial Truck Dismantlers',
    sellerPhone: '+27 71 884 5511',
    sellerWhatsapp: '27718845511',
    sellerCity: 'Pinetown',
    sellerProvince: 'KwaZulu-Natal',
    title: 'Mercedes-Benz Actros MP3 / MP4 Front Steer Axle Combo',
    category: 'trucks',
    subcategory: 'Axles, Differentials & Hubs',
    badge: 'BUNDLE COMBO',
    originalPriceZar: 32000,
    specialPriceZar: 24500,
    description: 'Complete front steer axle with heavy-duty disc brake calipers, ABS sensor rings, and wheel hubs. Perfect for quick fleet overhaul and roadworthy preparation.',
    terms: 'Special yard pickup or Durban harbor dispatch.',
    expiresAt: '2026-09-20T23:59:59.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
    isFeatured: false,
    views: 215,
    createdAt: '2026-08-15T09:00:00.000Z'
  },
  {
    id: 'special-5',
    sellerId: 'seller-5',
    sellerName: 'Lowveld Mining & Plant Salvage',
    sellerPhone: '+27 79 123 7744',
    sellerWhatsapp: '27791237744',
    sellerCity: 'Witbank',
    sellerProvince: 'Mpumalanga',
    title: 'Komatsu PC200/PC300 Track Link Assembly & Shoe Combo',
    category: 'heavy_equipment',
    subcategory: 'Under carriage & Rubber Tracks',
    badge: 'BULK MINING SPECIAL',
    originalPriceZar: 52000,
    specialPriceZar: 38000,
    description: 'Heavy duty sealed & lubricated track chain assembly (49 links per side). High manganese steel excavator shoes included. Suitable for harsh quarrying and coal mining applications in Mpumalanga.',
    terms: 'Price per side set. Includes new master pins.',
    expiresAt: '2026-10-05T23:59:59.000Z',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
    isFeatured: true,
    views: 310,
    createdAt: '2026-08-16T11:45:00.000Z'
  }
];

export const INITIAL_COMPETITIONS: SellerCompetition[] = [
  {
    id: 'comp-1',
    title: 'Spring 2026 Yard Master Championship',
    tagline: 'South Africa’s premier scrapyard & equipment dismantler sprint',
    description: 'Join the nation’s top equipment recyclers and commercial truck breakers! List quality verified parts with clear OEM part numbers, respond promptly to WhatsApp buyer inquiries, and earn points on every verified enquiry and five-star rating.',
    categoryType: 'yard_excellence',
    prizePool: 'R30,000 Cash + 6 Months Free Unlimited Dealer Plan + Homepage Spotlight',
    prizes: [
      { rank: '1st Place Winner', reward: 'R15,000 Cash + 6 Months Free Unlimited Dealer Tier + Platform Champion Trophy Badge', badge: '🥇 Gold Yard Master' },
      { rank: '2nd Place Runner-Up', reward: 'R10,000 Cash + 3 Months Free Pro Tier + Priority Search Placement', badge: '🥈 Silver Yard Specialist' },
      { rank: '3rd Place', reward: 'R5,000 Cash + 1 Month Free Pro Tier + Verified Dismantler Badge', badge: '🥉 Bronze Yard Pro' }
    ],
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: '2026-09-30T23:59:59.000Z',
    status: 'active',
    bannerImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    rules: [
      'Must be a registered seller yard in South Africa with an active or pending subscription.',
      'Inventory listings must contain genuine high-resolution photos and accurate OEM part numbers.',
      'Yard managers must respond to WhatsApp buyer inquiries within 30 minutes during business hours.',
      'Zero tolerance for fake serials or stolen salvage parts — all entries are vetted by PartSmart ZA admin.'
    ],
    criteria: [
      'Listing Volume & Accuracy (40% Weight)',
      'WhatsApp Inquiry Response Speed (30% Weight)',
      'Verified Part Photos & Video Demos (20% Weight)',
      'Customer Satisfaction & Deal Closures (10% Weight)'
    ],
    participantsCount: 38,
    leaderboard: [
      {
        sellerId: 'seller-1',
        sellerName: 'Highveld Earthmoving Spares',
        city: 'Boksburg',
        province: 'Gauteng',
        metricLabel: 'Verified Listings & Fast Leads',
        metricValue: '984 Pts (98% Response)',
        rank: 1,
        badgeTitle: '🥇 Current Leader',
        highlightNote: 'Top CAT & Komatsu Hydraulic inventory volume'
      },
      {
        sellerId: 'seller-2',
        sellerName: 'Cape Truck Breakers & Diesels',
        city: 'Epping',
        province: 'Western Cape',
        metricLabel: 'Verified Listings & Fast Leads',
        metricValue: '890 Pts (95% Response)',
        rank: 2,
        badgeTitle: '🥈 Contender',
        highlightNote: 'Fastest Scania & Volvo transmission quotes'
      },
      {
        sellerId: 'seller-3',
        sellerName: 'Durban Commercial Truck Dismantlers',
        city: 'Pinetown',
        province: 'KwaZulu-Natal',
        metricLabel: 'Verified Listings & Fast Leads',
        metricValue: '760 Pts (92% Response)',
        rank: 3,
        badgeTitle: '🥉 Podium Yard',
        highlightNote: 'Exceptional heavy truck axle & diff specials'
      },
      {
        sellerId: 'seller-5',
        sellerName: 'Lowveld Mining & Plant Salvage',
        city: 'Witbank',
        province: 'Mpumalanga',
        metricLabel: 'Verified Listings & Fast Leads',
        metricValue: '685 Pts (90% Response)',
        rank: 4,
        badgeTitle: '⭐ Top 5 Yard',
        highlightNote: 'Excavator & Dozer undercarriage specialists'
      },
      {
        sellerId: 'seller-4',
        sellerName: 'Jozi Scrap & Auto Recyclers',
        city: 'Soweto',
        province: 'Gauteng',
        metricLabel: 'Verified Listings & Fast Leads',
        metricValue: '610 Pts (88% Response)',
        rank: 5,
        badgeTitle: '⭐ Top 5 Yard',
        highlightNote: 'Massive volume of bakkie engines & body panels'
      }
    ],
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'comp-2',
    title: 'Lightning WhatsApp Responder Cup',
    tagline: 'Speed wins the deal: Fastest yard response times across South Africa',
    description: 'Fleet managers and mechanics need parts urgently to avoid downtime. Compete in our WhatsApp response speed sprint. Maintain an average reply time under 10 minutes and earn fuel vouchers and featured listing boosts.',
    categoryType: 'trucks',
    prizePool: 'R15,000 Fuel Vouchers + 1 Year Featured Spotlight',
    prizes: [
      { rank: '1st Place Speed King', reward: 'R8,000 Shell/Engen Fuel Voucher + 1-Year Featured Yard Spotlight', badge: '⚡ Lightning Winner' },
      { rank: '2nd Place', reward: 'R4,500 Fuel Voucher + 6-Month Pro Upgrade', badge: '⚡ Fast Responder' },
      { rank: '3rd Place', reward: 'R2,500 Fuel Voucher + 3-Month Pro Upgrade', badge: '⚡ Quick Quote Pro' }
    ],
    startDate: '2026-08-15T00:00:00.000Z',
    endDate: '2026-10-15T23:59:59.000Z',
    status: 'active',
    bannerImage: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
    rules: [
      'Response times measured on verified buyer WhatsApp leads routed through Part-Smart ZA.',
      'Must provide honest stock status and transparent pricing in the initial response.',
      'Active for all verified sellers nationwide.'
    ],
    criteria: [
      'Average Response Time (<10 minutes)',
      'Successful Quote Delivery Ratio',
      'Buyer Feedback on Professionalism'
    ],
    participantsCount: 29,
    leaderboard: [
      {
        sellerId: 'seller-2',
        sellerName: 'Cape Truck Breakers & Diesels',
        city: 'Epping',
        province: 'Western Cape',
        metricLabel: 'Avg Response Time',
        metricValue: '3.8 mins (99.2% rate)',
        rank: 1,
        badgeTitle: '⚡ Speed Leader',
        highlightNote: 'Instant automated stock quotes & video inspections'
      },
      {
        sellerId: 'seller-1',
        sellerName: 'Highveld Earthmoving Spares',
        city: 'Boksburg',
        province: 'Gauteng',
        metricLabel: 'Avg Response Time',
        metricValue: '4.5 mins (98.0% rate)',
        rank: 2,
        badgeTitle: '⚡ 2nd Place',
        highlightNote: 'Dedicated spares WhatsApp desk'
      },
      {
        sellerId: 'seller-4',
        sellerName: 'Jozi Scrap & Auto Recyclers',
        city: 'Soweto',
        province: 'Gauteng',
        metricLabel: 'Avg Response Time',
        metricValue: '6.2 mins (94.5% rate)',
        rank: 3,
        badgeTitle: '⚡ 3rd Place',
        highlightNote: 'Rapid bakkie engine and gearbox quotations'
      }
    ],
    createdAt: '2026-08-15T00:00:00.000Z'
  }
];

export const INITIAL_COMPETITION_ENTRIES: CompetitionEntry[] = [
  {
    id: 'entry-1',
    competitionId: 'comp-1',
    sellerId: 'seller-1',
    sellerName: 'Highveld Earthmoving Spares',
    sellerWhatsapp: '27824591102',
    sellerCity: 'Boksburg',
    entryTitle: 'Complete Overhaul of CAT 345C Excavator Slew Motor & Planetary Gearbox',
    entryDescription: 'We completely stripped, rebuilt, and tolerance-tested a 2.4-ton slew drive with new genuine Caterpillar seal kits and bearings. Delivered to a mining contractor in Rustenburg with zero machine downtime.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    proofMetrics: 'Overhauled in 48 hours • 350 bar pressure bench certified',
    submittedAt: '2026-08-12T14:30:00.000Z',
    status: 'approved'
  },
  {
    id: 'entry-2',
    competitionId: 'comp-1',
    sellerId: 'seller-2',
    sellerName: 'Cape Truck Breakers & Diesels',
    sellerWhatsapp: '27839123344',
    sellerCity: 'Epping',
    entryTitle: 'Fleet Salvage of 5x Scania R-Series Streamline Truck Cabs & Drivetrains',
    entryDescription: 'Dismantled 5 accident-damaged long-haul truck tractors. Cataloged over 180 individual verified items onto Part-Smart ZA within 72 hours, with full HD videos of running DC13 engines.',
    imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
    proofMetrics: '180 parts listed • 100% genuine Scania OEM codes',
    submittedAt: '2026-08-14T09:15:00.000Z',
    status: 'approved'
  }
];
