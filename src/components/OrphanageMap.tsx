import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Orphanage } from '../types';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Navigation } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface OrphanageMapProps {
  orphanages: Orphanage[];
  selectedId?: string;
  onSelect: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

const MarkerWithInfoWindow: React.FC<{ orphanage: Orphanage, onSelect: (id: string) => void, isSelected: boolean }> = ({ orphanage, onSelect, isSelected }) => {
  const { t } = useTranslation();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(isSelected);

  useEffect(() => {
    if (isSelected) setOpen(true);
  }, [isSelected]);

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        position={{ lat: orphanage.latitude, lng: orphanage.longitude }} 
        onClick={() => {
          setOpen(true);
          onSelect(orphanage.id);
        }}
      >
        <Pin background="#3b82f6" glyphColor="#fff" borderColor="#1e40af" />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-1 min-w-[150px]">
            <h3 className="font-bold text-brand-primary text-sm">{orphanage.name}</h3>
            <p className="text-[10px] text-gray-600 mb-2">{orphanage.city}, {t(`regions.${orphanage.region}`)}</p>
            <button 
              onClick={() => onSelect(orphanage.id)}
              className="w-full py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded hover:bg-opacity-90 transition-all"
            >
              {t('common.details')}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapSearch: React.FC = () => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [inputValue, setInputValue] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesLib || !map || !inputValue) return;

    try {
      const { places } = await placesLib.Place.searchByText({
        textQuery: inputValue,
        fields: ['location', 'viewport', 'displayName'],
        locationBias: map.getCenter(),
        maxResultCount: 1,
      });

      if (places && places[0] && places[0].location) {
        map.panTo(places[0].location);
        if (places[0].viewport) {
          map.fitBounds(places[0].viewport);
        } else {
          map.setZoom(14);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-full max-w-xs px-2">
      <form onSubmit={handleSearch} className="flex bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search location..."
          className="flex-1 px-4 py-2.5 text-xs font-medium outline-none"
        />
        <button type="submit" className="p-2.5 bg-brand-primary text-white hover:bg-opacity-90 transition-all">
          <Search size={18} />
        </button>
      </form>
    </div>
  );
};

export const OrphanageMap: React.FC<OrphanageMapProps> = ({ 
  orphanages, 
  selectedId, 
  onSelect,
  center = [7.3697, 12.3547], 
  zoom = 6
}) => {
  if (!hasValidKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Navigation size={40} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-800">Google Maps API Key Required</h2>
          <div className="space-y-4 text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600"><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-blue-500 underline">Get an API Key</a></p>
            <p className="text-sm text-slate-600"><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
            <ul className="text-xs text-slate-500 space-y-2 list-disc pl-5">
              <li>Open <strong>Settings</strong> (⚙️ gear icon)</li>
              <li>Select <strong>Secrets</strong></li>
              <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code>, press <strong>Enter</strong></li>
              <li>Paste your API key, press <strong>Enter</strong></li>
            </ul>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">The app rebuilds automatically after setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{ lat: center[0], lng: center[1] }}
          defaultZoom={zoom}
          mapId="Kindred_Map"
          disableDefaultUI={true}
          zoomControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <MapSearch />
          {orphanages.map((o) => (
            <MarkerWithInfoWindow 
              key={o.id} 
              orphanage={o} 
              onSelect={onSelect}
              isSelected={selectedId === o.id}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};
