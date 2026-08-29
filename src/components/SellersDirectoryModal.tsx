import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  Search,
  SlidersHorizontal,
  ChevronRight,
  HardHat,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SAProvince, Seller } from '../types';
import { PROVINCES_LIST } from '../data/initialData';

interface SellersDirectoryModalProps {
  onClose: () => void;
  onSelectSellerFilter?: (sellerId: string) => void;
  onOpenSellerPortal: () => void;
}

export const SellersDirectoryModal: React.FC<SellersDirectoryModalProps> = ({
  onClose,
  onSelectSellerFilter,
  onOpenSellerPortal
}) => {
  const { sellers, inventory, setFilter } = useApp();

  const [selectedProvince, setSelectedProvince] = useState<SAProvince | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'province_city' | 'company_asc' | 'listings_desc'>('province_city');

  // Count active inventory items per seller
  const sellerListingsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((item) => {
      map[item.sellerId] = (map[item.sellerId] || 0) + 1;
    });
    return map;
  }, [inventory]);

  // Filter sellers
  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      // Province filter
      if (selectedProvince !== 'all' && seller.province !== selectedProvince) {
        return false;
      }

      // Search query filter (matches company, contact, city, or province)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCompany = seller.companyName.toLowerCase().includes(q);
        const matchesContact = seller.contactName.toLowerCase().includes(q);
        const matchesCity = seller.city.toLowerCase().includes(q);
        const matchesProvince = seller.province.toLowerCase().includes(q);
        const matchesEmail = seller.email.toLowerCase().includes(q);
        if (!matchesCompany && !matchesContact && !matchesCity && !matchesProvince && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [sellers, selectedProvince, searchQuery]);

  // Primary Sorting: Always sorted strictly by Province (alphabetical), then City/Town (alphabetical), then Company Name
  const sortedSellers = useMemo(() => {
    const list = [...filteredSellers];

    if (sortBy === 'company_asc') {
      return list.sort((a, b) => a.companyName.localeCompare(b.companyName));
    }

    if (sortBy === 'listings_desc') {
      return list.sort((a, b) => {
        const countA = sellerListingsCountMap[a.id] || 0;
        const countB = sellerListingsCountMap[b.id] || 0;
        if (countB !== countA) return countB - countA;
        if (a.province !== b.province) return a.province.localeCompare(b.province);
        return a.city.localeCompare(b.city);
      });
    }

    // Default 'province_city': Sort by Province -> City/Town -> Company Name
    return list.sort((a, b) => {
      if (a.province !== b.province) {
        return a.province.localeCompare(b.province);
      }
      if (a.city !== b.city) {
        return a.city.localeCompare(b.city);
      }
      return a.companyName.localeCompare(b.companyName);
    });
  }, [filteredSellers, sortBy, sellerListingsCountMap]);

  // Group sorted sellers by Province and City for structured geographic view
  const groupedByProvinceAndCity = useMemo(() => {
    const groups: {
      province: SAProvince;
      cities: {
        city: string;
        sellers: Seller[];
      }[];
    }[] = [];

    // Order of provinces
    PROVINCES_LIST.forEach((prov) => {
      const sellersInProv = sortedSellers.filter((s) => s.province === prov);
      if (sellersInProv.length > 0) {
        // Group cities within this province
        const cityMap: Record<string, Seller[]> = {};
        sellersInProv.forEach((s) => {
          if (!cityMap[s.city]) cityMap[s.city] = [];
          cityMap[s.city].push(s);
        });

        const cities = Object.keys(cityMap)
          .sort((a, b) => a.localeCompare(b))
          .map((cityName) => ({
            city: cityName,
            sellers: cityMap[cityName].sort((a, b) => a.companyName.localeCompare(b.companyName))
          }));

        groups.push({
          province: prov,
          cities
        });
      }
    });

    return groups;
  }, [sortedSellers]);

  const handleSelectSeller = (seller: Seller) => {
    // Set filter to search for this seller or set seller query
    setFilter({ searchQuery: seller.companyName });
    if (onSelectSellerFilter) {
      onSelectSellerFilter(seller.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl text-white my-auto flex flex-col">
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>South African Seller & Yard Directory</span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Sorted by Province & City/Town
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Find verified commercial breakers, heavy equipment yards, and auto scrap yards by location
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSellerPortal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              Advertise Your Yard
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search yard name, city (e.g. Witbank, eMalahleni), or province..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-indigo-400" /> Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-white cursor-pointer focus:outline-none focus:border-indigo-500"
              >
                <option value="province_city">Province → City/Town (Geographic Order)</option>
                <option value="company_asc">Company Name (A - Z)</option>
                <option value="listings_desc">Most Active Listings</option>
              </select>
            </div>

          </div>

          {/* Province Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mr-1 shrink-0">
              Province:
            </span>
            <button
              onClick={() => setSelectedProvince('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer ${
                selectedProvince === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              All SA ({sellers.length})
            </button>
            {PROVINCES_LIST.map((prov) => {
              const count = sellers.filter((s) => s.province === prov).length;
              return (
                <button
                  key={prov}
                  onClick={() => setSelectedProvince(prov)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedProvince === prov
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{prov}</span>
                  {count > 0 && (
                    <span className="bg-slate-800/80 text-[10px] px-1.5 py-0.2 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Body */}
        <div className="p-6 space-y-8 flex-1">
          {groupedByProvinceAndCity.length > 0 ? (
            groupedByProvinceAndCity.map(({ province, cities }) => (
              <div key={province} className="space-y-4">
                
                {/* Province Header Banner */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-3.5 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-black">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        {province}
                      </h3>
                      <p className="text-[10px] text-indigo-300">
                        {cities.reduce((sum, c) => sum + c.sellers.length, 0)} Verified Sellers / Equipment Yards
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    Province Group
                  </span>
                </div>

                {/* Cities Grid within this Province */}
                <div className="space-y-4 pl-2 sm:pl-4">
                  {cities.map(({ city, sellers: citySellers }) => (
                    <div key={city} className="space-y-3">
                      
                      {/* City/Town Subheader */}
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                          {city} <span className="text-slate-500 text-[10px] font-normal">({citySellers.length} {citySellers.length === 1 ? 'Yard' : 'Yards'})</span>
                        </h4>
                      </div>

                      {/* Sellers Cards in this City */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {citySellers.map((seller) => {
                          const listingsCount = sellerListingsCountMap[seller.id] || 0;
                          return (
                            <div
                              key={seller.id}
                              className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3 group shadow-md"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                                      {seller.companyName}
                                    </h5>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <span>{seller.address || `${seller.city}, ${seller.province}`}</span>
                                    </div>
                                  </div>

                                  {seller.subscriptionStatus === 'active' ? (
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED YARD
                                    </span>
                                  ) : (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">
                                      {seller.subscriptionStatus.toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                {/* Contact Details */}
                                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                                  <div>
                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Contact Person</span>
                                    <span className="font-semibold">{seller.contactName}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Phone / Direct</span>
                                    <span className="font-mono text-indigo-300 font-semibold">{seller.phone}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">WhatsApp</span>
                                    <span className="font-mono text-emerald-400 font-semibold">{seller.whatsapp}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Active Listings</span>
                                    <span className="font-bold text-amber-400">{listingsCount} Parts</span>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Action */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                                <a
                                  href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(seller.companyName)},%20I%20found%20your%20yard%20on%20Part-Smart-ZA.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg transition-all font-semibold flex items-center gap-1.5 text-[11px]"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Yard
                                </a>

                                <button
                                  onClick={() => handleSelectSeller(seller)}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all flex items-center gap-1 text-[11px] cursor-pointer"
                                >
                                  <span>Browse Yard Inventory</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))
          ) : (
            <div className="bg-slate-950 p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Sellers Found</h4>
              <p className="text-xs text-slate-400">
                No yards or sellers match your selected province or search query.
              </p>
              <button
                onClick={() => {
                  setSelectedProvince('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Reset Location Filters
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Showing <strong>{sortedSellers.length}</strong> sellers across South African provinces
          </div>
          <button
            onClick={onOpenSellerPortal}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Are you a breaker or equipment dealer? Register your yard</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
};
