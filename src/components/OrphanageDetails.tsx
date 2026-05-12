import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Phone, Mail, Users, Calendar, Share2, Globe, ExternalLink } from 'lucide-react';
import { Orphanage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDistance, formatDistance } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';

export const OrphanageDetails: React.FC<{ orphanage: Orphanage, onBack: () => void, onSelectNearby: (o: Orphanage) => void }> = ({ orphanage, onBack, onSelectNearby }) => {
  const { t } = useTranslation();
  const { orphanages } = useAppContext();
  const { location } = useGeolocation();

  const nearbyOrphanages = useMemo(() => {
    return orphanages
      .filter(o => o.id !== orphanage.id)
      .map(o => ({
        ...o,
        distance: calculateDistance(orphanage.latitude, orphanage.longitude, o.latitude, o.longitude)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [orphanages, orphanage]);

  const userDistance = useMemo(() => {
    if (!location) return null;
    return calculateDistance(location.latitude, location.longitude, orphanage.latitude, orphanage.longitude);
  }, [location, orphanage]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: orphanage.name,
        text: `Check out ${orphanage.name} on Kindred Cameroon`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-50 bg-brand-bg md:relative md:inset-auto md:z-0 md:h-full md:w-full overflow-y-auto"
    >
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {orphanage.photoUrl ? (
          <img src={orphanage.photoUrl} alt={orphanage.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
            <MapPin size={64} strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/20"
        >
          <ArrowLeft size={24} />
        </button>
        
        <button 
          onClick={handleShare}
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/20"
        >
          <Share2 size={24} />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <span className="text-[10px] font-bold text-brand-accent bg-white px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">
            Verified Institution
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight">{orphanage.name}</h2>
          <div className="flex items-center gap-2 text-white/90 text-sm mt-3 font-medium">
            <MapPin size={16} />
            <span className="underline decoration-brand-accent/50 underline-offset-4">{orphanage.city}, {t(`regions.${orphanage.region}`)}</span>
            {userDistance !== null && (
              <span className="bg-brand-accent px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ml-2">
                {formatDistance(userDistance)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-brand-primary transition-all">
            <Users className="text-brand-primary mb-3 group-hover:scale-110 transition-transform" size={28} />
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{t('common.capacity')}</span>
            <span className="text-xl font-bold text-slate-900">{orphanage.capacity || '--'} {t('common.children')}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-brand-accent transition-all">
            <Calendar className="text-brand-accent mb-3 group-hover:scale-110 transition-transform" size={28} />
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{t('common.age_groups')}</span>
            <span className="text-xl font-bold text-slate-900">{orphanage.ageGroups || '--'}</span>
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="font-serif font-bold text-2xl text-slate-900">Background</h3>
          <p className="text-slate-600 leading-relaxed text-lg font-light border-l-4 border-slate-100 pl-6 py-2 italic bg-white rounded-r-2xl pr-4 shadow-sm">
            {orphanage.description || 'No detailed background currently available for this verified institution.'}
          </p>
        </section>

        <section className="space-y-6">
          <h3 className="font-serif font-bold text-2xl text-slate-900">{t('common.contact')} Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orphanage.contactPhone && (
              <a href={`tel:${orphanage.contactPhone}`} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-primary hover:shadow-md group transition-all">
                <div className="p-3 bg-brand-primary/5 rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                  <Phone size={22} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{t('common.contact')}</span>
                  <span className="font-mono font-bold text-lg text-slate-800">{orphanage.contactPhone}</span>
                </div>
              </a>
            )}
            {orphanage.contactEmail && (
              <a href={`mailto:${orphanage.contactEmail}`} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-accent hover:shadow-md group transition-all">
                <div className="p-3 bg-brand-accent/5 rounded-xl text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all shadow-inner">
                  <Mail size={22} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Official Email</span>
                  <span className="font-bold text-slate-800 break-all">{orphanage.contactEmail}</span>
                </div>
              </a>
            )}
          </div>
          
          <div className="bg-brand-primary text-white p-6 rounded-2xl flex items-center justify-between shadow-lg shadow-brand-primary/20">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Navigate to Institution</h4>
                <p className="text-xs text-white/70 font-medium">Get real-time directions on Google Maps</p>
              </div>
            </div>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${orphanage.latitude},${orphanage.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white text-brand-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2 shadow-sm"
            >
              Get Directions <ExternalLink size={16} />
            </a>
          </div>
        </section>

        <section className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-gray-900">{t('common.nearby')}</h3>
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest italic">Within distance</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nearbyOrphanages.map(nearby => (
              <div 
                key={nearby.id}
                onClick={() => onSelectNearby(nearby)}
                className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer transition-all flex gap-3 items-center group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {nearby.photoUrl && <img src={nearby.photoUrl} alt={nearby.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate group-hover:text-brand-primary transition-colors">{nearby.name}</h4>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                    {formatDistance(nearby.distance)} • {nearby.city}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};
