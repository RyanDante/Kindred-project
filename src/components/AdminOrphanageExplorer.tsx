import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, Plus, MapPin, Navigation, ExternalLink, Info } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { OrphanageStatus, CAMEROON_REGIONS } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface PlaceMarkerProps {
  place: google.maps.places.Place;
  onSelect: (place: google.maps.places.Place) => void;
}

const PlaceMarker: React.FC<PlaceMarkerProps> = ({ place, onSelect }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  if (!place.location) return null;

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={place.location} 
        onClick={() => setOpen(true)}
      >
        <Pin background="#f59e0b" glyphColor="#fff" borderColor="#b45309" />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 min-w-[200px] space-y-3">
             <div>
                <h3 className="font-bold text-slate-900 text-sm">{place.displayName}</h3>
                <p className="text-[10px] text-slate-500">{place.formattedAddress}</p>
             </div>
             <button 
               onClick={() => onSelect(place)}
               className="w-full flex items-center justify-center gap-2 py-2 bg-brand-primary text-white text-[10px] font-bold rounded-lg hover:bg-opacity-90 transition-all"
             >
               <Plus size={14} /> Import to Kindred
             </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapControl: React.FC<{ onSearch: (places: google.maps.places.Place[]) => void }> = ({ onSearch }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState('orphanage');
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesLib || !map) return;

    setSearching(true);
    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: query,
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'viewport'],
        locationBias: map.getCenter(),
        maxResultCount: 20
      });
      onSearch(places || []);
      if (places && places[0] && places[0].viewport) {
         map.fitBounds(places[0].viewport);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <form onSubmit={handleSearch} className="flex bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden min-w-[300px]">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places..."
          className="flex-1 px-4 py-2.5 text-sm font-medium outline-none"
        />
        <button disabled={searching} type="submit" className="p-2.5 bg-brand-primary text-white hover:bg-opacity-90 transition-all disabled:opacity-50">
          <Search size={18} />
        </button>
      </form>
    </div>
  );
};

export const AdminOrphanageExplorer: React.FC = () => {
  const [places, setPlaces] = useState<google.maps.places.Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [region, setRegion] = useState(CAMEROON_REGIONS[0]);

  const handleImport = async () => {
    if (!selectedPlace) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orphanages'), {
        name: selectedPlace.displayName || 'Unknown Institution',
        city: selectedPlace.formattedAddress?.split(',')[0] || 'Unknown City',
        region: region,
        latitude: selectedPlace.location?.lat(),
        longitude: selectedPlace.location?.lng(),
        status: OrphanageStatus.APPROVED,
        description: `Imported from Google Maps. ID: ${selectedPlace.id}`,
        createdAt: serverTimestamp()
      });
      alert('Orphanage imported successfully!');
      setSelectedPlace(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orphanages/import');
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasValidKey) return <div className="p-10 text-center text-slate-400">Map setup pending...</div>;

  return (
    <div className="flex flex-col h-[70vh] rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-slate-800">Spatial Intelligence Explorer</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest">Powered by GMP</span>
         </div>
         {selectedPlace && (
            <div className="flex items-center gap-4 animate-in slide-in-from-right-4">
               <div className="flex flex-col items-end">
                  <p className="text-xs font-bold text-slate-700">{selectedPlace.displayName}</p>
                  <select 
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-transparent outline-none border-none"
                  >
                    {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
               </div>
               <button 
                 onClick={handleImport}
                 disabled={submitting}
                 className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                 {submitting ? 'Importing...' : 'Confirm Import'}
               </button>
            </div>
         )}
      </div>
      
      <div className="flex-1 relative">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: 7.3697, lng: 12.3547 }}
            defaultZoom={6}
            mapId="Admin_Explorer"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <MapControl onSearch={setPlaces} />
            {places.map(p => (
              <PlaceMarker key={p.id} place={p} onSelect={setSelectedPlace} />
            ))}
          </Map>
        </APIProvider>
      </div>
    </div>
  );
};
