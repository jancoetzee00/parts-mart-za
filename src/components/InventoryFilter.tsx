import React from 'react';
import { Filter, RotateCcw, MapPin, Tag, ArrowUpDown, HardHat, Truck, Car, Bus, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PROVINCES_LIST, SUBCATEGORIES } from '../data/initialData';
import { CategoryType, PartCondition, SAProvince, FilterState } from '../types';

export const InventoryFilter: React.FC = () => {
  const { filter, setFilter, resetFilters, favorites } = useApp();

  const currentCategory = filter.category;

  // Get available subcategories for selected category
  const availableSubcategories =
    currentCategory === 'all'
      ? ['All', 'Hydraulics & Pumps', 'Engines & Transmissions', 'Gearboxes', 'Buckets & Attachments', 'Stripping for Spares']
      : SUBCATEGORIES[currentCategory] || ['All'];

  const handleConditionChange = (cond: PartCondition | 'all') => {
    setFilter({ condition: cond });
  };

  const handleSubcategoryChange = (sub: string) => {
    setFilter({ subcategory: sub });
  };

  const isFiltered =
    filter.searchQuery !== '' ||
    filter.category !== 'all' ||
    filter.subcategory !== 'All' ||
    filter.condition !== 'all' ||
    filter.province !== 'all' ||
    filter.make !== '' ||
    !!filter.onlyFavorites;

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white py-3 px-3 sm:px-4 shadow-md sticky top-12 md:top-14 z-30">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Top Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Main Category Selector Tabs & Favorites Tab */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none shrink-0 max-w-full">
            <button
              onClick={() => setFilter({ category: 'all', subcategory: 'All', onlyFavorites: false })}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] flex items-center ${
                filter.category === 'all' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Categories
            </button>
            <button
              onClick={() => setFilter({ category: 'heavy_equipment', subcategory: 'All', onlyFavorites: false })}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                filter.category === 'heavy_equipment' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              Heavy
            </button>
            <button
              onClick={() => setFilter({ category: 'trucks', subcategory: 'All', onlyFavorites: false })}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                filter.category === 'trucks' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Trucks
            </button>
            <button
              onClick={() => setFilter({ category: 'minibus_taxis', subcategory: 'All', onlyFavorites: false })}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                filter.category === 'minibus_taxis' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              Minibus / Taxi
            </button>
            <button
              onClick={() => setFilter({ category: 'cars', subcategory: 'All', onlyFavorites: false })}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                filter.category === 'cars' && !filter.onlyFavorites
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              Cars
            </button>

            {/* Saved Parts Toggle Pill */}
            <div className="h-4 w-px bg-slate-800 mx-0.5 shrink-0"></div>
            <button
              onClick={() => setFilter({ onlyFavorites: !filter.onlyFavorites })}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                filter.onlyFavorites
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
              }`}
              title="Toggle Saved Inventory Items"
            >
              <Heart className={`w-3.5 h-3.5 ${filter.onlyFavorites ? 'fill-white text-white' : 'text-rose-400'}`} />
              <span>Saved ({favorites.length})</span>
            </button>
          </div>

          {/* Location & Sort Controls */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
            {/* Province Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs shrink-0 min-h-[36px]">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={filter.province}
                onChange={(e) => setFilter({ province: e.target.value as SAProvince | 'all' })}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-slate-900">All SA Provinces</option>
                {PROVINCES_LIST.map((prov) => (
                  <option key={prov} value={prov} className="bg-slate-900">
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs shrink-0 min-h-[36px]">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter({ sortBy: e.target.value as FilterState['sortBy'] })}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="newest" className="bg-slate-900">Newest</option>
                <option value="price_low" className="bg-slate-900">Price: Low-High</option>
                <option value="price_high" className="bg-slate-900">Price: High-Low</option>
                <option value="views" className="bg-slate-900">Most Popular</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl border border-amber-500/20 flex items-center gap-1 transition-colors cursor-pointer shrink-0 min-h-[36px]"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Subcategories & Condition Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          
          {/* Subcategory Pills - Mobile horizontal scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              Subcategory:
            </span>
            {availableSubcategories.map((sub) => {
              const isSelected = filter.subcategory === sub || (sub === 'All' && filter.subcategory === 'All');
              return (
                <button
                  key={sub}
                  onClick={() => handleSubcategoryChange(sub)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all font-medium shrink-0 cursor-pointer min-h-[30px] flex items-center ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          {/* Condition Pills - Mobile horizontal scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0 hidden sm:inline">
              Condition:
            </span>
            <button
              onClick={() => handleConditionChange('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[30px] flex items-center ${
                filter.condition === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleConditionChange('new')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[30px] flex items-center ${
                filter.condition === 'new'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              New
            </button>
            <button
              onClick={() => handleConditionChange('reconditioned')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[30px] flex items-center ${
                filter.condition === 'reconditioned'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Reconditioned
            </button>
            <button
              onClick={() => handleConditionChange('used')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[30px] flex items-center ${
                filter.condition === 'used'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Used
            </button>
            <button
              onClick={() => handleConditionChange('stripping_spares')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[30px] flex items-center ${
                filter.condition === 'stripping_spares'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Stripping for Spares
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
