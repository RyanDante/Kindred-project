import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Save, MapPin, Info, Users, Calendar, X, Check, Search, Target } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CAMEROON_REGIONS, OrphanageStatus } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// Fix Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface StagedOrphanage {
  tempId: string;
  name: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  ageGroups?: string;
  description: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    suburb?: string;
    state?: string;
  };
}

const MapEvents: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

export const BulkImport: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [staged, setStaged] = useState<StagedOrphanage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTempId, setActiveTempId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.3697, 12.3547]);
  const [mapZoom, setMapZoom] = useState(6);

  const addStaged = (lat: number, lng: number, name?: string, city?: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setStaged([...staged, {
      tempId: newId,
      name: name || `New Institution ${staged.length + 1}`,
      region: CAMEROON_REGIONS[0],
      city: city || '',
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      description: ''
    }]);
    setActiveTempId(newId);
    setMapCenter([lat, lng]);
    setMapZoom(14);
  };

  const updateStaged = (tempId: string, updates: Partial<StagedOrphanage>) => {
    setStaged(staged.map(s => s.tempId === tempId ? { ...s, ...updates } : s));
  };

  const removeStaged = (tempId: string) => {
    setStaged(staged.filter(s => s.tempId !== tempId));
    if (activeTempId === tempId) setActiveTempId(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Limit search to Cameroon for better results, include extra tags
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Cameroon')}&addressdetails=1&extratags=1&limit=5`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const city = result.address?.city || result.address?.town || result.address?.suburb || result.address?.village || '';
    
    // Extract info from extra tags
    const website = result.extratags?.website || result.extratags?.url || '';
    const phone = result.extratags?.phone || result.extratags?.['contact:phone'] || '';
    const email = result.extratags?.email || result.extratags?.['contact:email'] || '';
    const description = result.extratags?.description || result.extratags?.note || `A location found in ${city}. (Category: ${result.type})`;
    
    addStaged(lat, lng, result.display_name.split(',')[0], city);
    
    // Update the last added item with extra info
    setStaged(prev => {
      const items = [...prev];
      const lastIdx = items.length - 1;
      if (lastIdx >= 0) {
        items[lastIdx] = {
          ...items[lastIdx],
          contactEmail: email,
          contactPhone: phone,
          website: website,
          description: description
        };
      }
      return items;
    });

    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSaveAll = async () => {
    if (staged.length === 0) return;
    setLoading(true);
    try {
      for (const item of staged) {
        const { tempId, ...data } = item;
        await addDoc(collection(db, 'orphanages'), {
          ...data,
          status: OrphanageStatus.APPROVED,
          createdAt: serverTimestamp(),
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          website: data.website || ''
        });
      }
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orphanages/bulk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 text-blue-600">
          <Info className="shrink-0" size={18} />
          <p className="text-[10px] font-bold uppercase leading-relaxed">
            Search for a place or click on the map to add a new institution location.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative z-[1001]">
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location in Cameroon..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Target size={14} />}
            </button>
          </form>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto"
              >
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSearchResult(result)}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{result.display_name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {result.lat}, {result.lon}
                    </p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-4 flex-1">
          <AnimatePresence>
            {staged.map((item) => (
              <motion.div 
                key={item.tempId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${activeTempId === item.tempId ? 'bg-white border-brand-primary shadow-lg ring-2 ring-brand-primary/5' : 'bg-white/50 border-slate-200'}`}
                onClick={() => {
                  setActiveTempId(item.tempId);
                  setMapCenter([item.latitude, item.longitude]);
                  setMapZoom(14);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-[10px] font-black">
                      {staged.indexOf(item) + 1}
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{item.name || 'Unnamed Institution'}</h4>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeStaged(item.tempId); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>

                {activeTempId === item.tempId ? (
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-1">Name</label>
                        <input 
                          placeholder="Institution Name"
                          value={item.name}
                          onChange={e => updateStaged(item.tempId, { name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-1">Region</label>
                          <select 
                            value={item.region}
                            onChange={e => updateStaged(item.tempId, { region: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                          >
                            {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-1">City</label>
                          <input 
                            placeholder="City"
                            value={item.city}
                            onChange={e => updateStaged(item.tempId, { city: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-1">Phone</label>
                          <input 
                            placeholder="Contact Phone"
                            value={item.contactPhone}
                            onChange={e => updateStaged(item.tempId, { contactPhone: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-1">Email</label>
                          <input 
                            placeholder="Contact Email"
                            value={item.contactEmail}
                            onChange={e => updateStaged(item.tempId, { contactEmail: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-1">Description</label>
                        <textarea 
                          rows={2}
                          placeholder="Brief description..."
                          value={item.description}
                          onChange={e => updateStaged(item.tempId, { description: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase overflow-hidden whitespace-nowrap">
                    <div className="flex items-center gap-1"><MapPin size={12} /> {item.city || 'No City'}</div>
                    <div className="flex items-center gap-1">{item.region}</div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {staged.length === 0 && (
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-[32px] text-center space-y-3">
               <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto"><Plus size={24} /></div>
               <p className="text-slate-400 italic text-sm">No institutions staged yet.</p>
            </div>
          )}
        </div>

        {staged.length > 0 && (
          <button 
            onClick={handleSaveAll}
            disabled={loading}
            className="mt-auto sticky bottom-0 w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 z-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={20} /> Publish {staged.length} Institutions</>}
          </button>
        )}
      </div>

      {/* Map View */}
      <div className="flex-1 bg-slate-100 rounded-[40px] overflow-hidden border border-slate-200 shadow-inner relative">
         <MapContainer 
           center={mapCenter} 
           zoom={mapZoom} 
           className="w-full h-full"
         >
           <TileLayer
             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
           />
           <ChangeView center={mapCenter} zoom={mapZoom} />
           <MapEvents onMapClick={addStaged} />
           {staged.map((s) => (
             <Marker 
               key={s.tempId} 
               position={[s.latitude, s.longitude]}
               eventHandlers={{
                 click: () => {
                   setActiveTempId(s.tempId);
                   setMapCenter([s.latitude, s.longitude]);
                   setMapZoom(14);
                 }
               }}
             >
               <Popup>
                 <div className="p-2 min-w-[150px]">
                   <h4 className="font-bold text-brand-primary">{s.name}</h4>
                   <p className="text-xs text-slate-500">{s.city}, {s.region}</p>
                 </div>
               </Popup>
             </Marker>
           ))}
         </MapContainer>
         <div className="absolute top-6 right-6 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl space-y-2 pointer-events-auto border border-slate-200">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Status</p>
               <p className="text-sm font-bold text-slate-800">{staged.length} Pins Placed</p>
            </div>
         </div>
      </div>
    </div>
  );
};
