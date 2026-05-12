import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Phone, Users, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CAMEROON_REGIONS, Orphanage } from '../types';
import Fuse from 'fuse.js';
import { motion } from 'motion/react';

export const ListView: React.FC<{ onSelect: (o: Orphanage) => void }> = ({ onSelect }) => {
  const { t } = useTranslation();
  const { 
    orphanages, 
    searchFilter, setSearchFilter, 
    regionFilter, setRegionFilter,
    capacityFilter, setCapacityFilter,
    ageFilter, setAgeFilter
  } = useAppContext();

  const filteredOrphanages = useMemo(() => {
    let result = orphanages;

    if (regionFilter) {
      result = result.filter(o => o.region === regionFilter);
    }

    if (capacityFilter > 0) {
      result = result.filter(o => (o.capacity || 0) >= capacityFilter);
    }

    if (ageFilter) {
      result = result.filter(o => o.ageGroups?.toLowerCase().includes(ageFilter.toLowerCase()));
    }

    if (searchFilter) {
      const fuse = new Fuse(result, {
        keys: ['name', 'city', 'description', 'ageGroups'],
        threshold: 0.3
      });
      result = fuse.search(searchFilter).map(res => res.item);
    }

    return result;
  }, [orphanages, searchFilter, regionFilter, capacityFilter, ageFilter]);

  return (
    <div className="flex flex-col h-full bg-brand-bg">
      <div className="p-4 bg-white shadow-sm space-y-3 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder={t('common.search')}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button 
            onClick={() => setRegionFilter('')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!regionFilter ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-primary'}`}
          >
            {t('common.all_regions')}
          </button>
          {CAMEROON_REGIONS.map(r => (
            <button 
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${regionFilter === r ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-primary'}`}
            >
              {t(`regions.${r}`)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <select 
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
            >
              <option value={0}>Min Capacity</option>
              <option value={10}>10+ Children</option>
              <option value={30}>30+ Children</option>
              <option value={50}>50+ Children</option>
              <option value={100}>100+ Children</option>
            </select>
          </div>
          <div className="flex-1">
            <select 
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
            >
              <option value="">Any Age Group</option>
              <option value="infant">Infants</option>
              <option value="toddler">Toddlers</option>
              <option value="children">Children</option>
              <option value="teens">Teens</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 md:pb-6">
        {filteredOrphanages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {filteredOrphanages.map((o, idx) => (
              <motion.div 
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => onSelect(o)}
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-brand-primary/30 transition-all cursor-pointer group flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-brand-primary bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    {t(`regions.${o.region}`)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
                    VERIFIED
                  </span>
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-brand-primary transition-colors truncate">{o.name}</h3>
                  <p className="text-xs text-slate-500 italic flex items-center gap-1">
                    <MapPin size={10} /> {o.city}
                  </p>
                </div>

                <div className="flex items-center gap-6 py-3 border-y border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Capacity</span>
                    <span className="font-bold text-sm text-slate-700">{o.capacity || '--'} {t('common.children')}</span>
                  </div>
                  {o.contactPhone && (
                    <div className="flex flex-col border-l border-slate-100 pl-6">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Contact</span>
                      <span className="font-bold text-sm text-slate-700 font-mono italic">{o.contactPhone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button className="flex-1 bg-slate-50 text-slate-700 text-[10px] font-bold py-2.5 rounded uppercase tracking-widest hover:bg-slate-100 transition-colors">
                    {t('common.details')}
                  </button>
                  <button className="flex-1 bg-blue-50 text-brand-primary text-[10px] font-bold py-2.5 rounded uppercase tracking-widest hover:bg-blue-100 transition-colors">
                    Directions
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
              <Search size={32} />
            </div>
            <p className="text-gray-500 font-medium">{t('common.no_results')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
