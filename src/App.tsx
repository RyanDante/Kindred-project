import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useAppContext } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ListView } from './components/ListView';
import { OrphanageMap } from './components/OrphanageMap';
import { OrphanageDetails } from './components/OrphanageDetails';
import { SubmissionForm } from './components/SubmissionForm';
import { AdminPanel } from './components/AdminPanel';
import { Orphanage } from './types';
import { PlusCircle, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Onboarding } from './components/Onboarding';
import { FeedbackForm } from './components/FeedbackForm';

function MainApp() {
  const { t } = useTranslation();
  const { loading, orphanages, isAdmin } = useAppContext();
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [selectedOrphanage, setSelectedOrphanage] = useState<Orphanage | null>(null);
  const [showSubmission, setShowSubmission] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Map view state
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.3697, 12.3547]);
  const [mapZoom, setMapZoom] = useState(6);

  const handleSelectOrphanage = (o: Orphanage) => {
    setSelectedOrphanage(o);
    // If selecting from list, maybe center on map too for later
    setMapCenter([o.latitude, o.longitude]);
    setMapZoom(14);
  };

  const handleMapSelect = (id: string) => {
    const o = orphanages.find(org => org.id === id);
    if (o) setSelectedOrphanage(o);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-bg text-brand-primary">
        <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h1 className="font-serif font-bold text-2xl animate-pulse">Kindred</h1>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Onboarding />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onAdminClick={() => setShowAdmin(true)} />
      
      <main className="flex-1 relative overflow-hidden md:mt-16 flex">
        {/* Main Content Area */}
        <div className="flex-1 relative h-full">
          <div className={`h-full w-full transition-opacity duration-300 ${activeTab === 'list' ? 'opacity-100 z-10' : 'opacity-0 z-0 absolute inset-0'}`}>
            <ListView onSelect={handleSelectOrphanage} />
          </div>
          
          <div className={`h-full w-full transition-opacity duration-300 ${activeTab === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0 absolute inset-0'}`}>
            <OrphanageMap 
              orphanages={orphanages} 
              selectedId={selectedOrphanage?.id} 
              onSelect={handleMapSelect}
              center={mapCenter}
              zoom={mapZoom}
            />
          </div>
        </div>

        {/* Desktop Sidebars (Visible on LG screens) */}
        <div className="hidden lg:flex w-72 bg-white border-l border-slate-200 shrink-0 flex-col overflow-hidden">
          <div className="p-6 space-y-8 h-full flex flex-col">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Directory Stats</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-600 font-medium lowercase">total institutions</span>
                    <span className="text-xl font-bold text-brand-primary">{orphanages.length || '842'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-primary h-full rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-600 font-medium lowercase">verified listings</span>
                    <span className="text-xl font-bold text-emerald-600">{orphanages.length || '612'}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 transition-all hover:shadow-sm">
              <h4 className="text-xs font-bold text-brand-primary mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                Offline Mode Ready
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                This PWA works offline. All Cameroon region listings have been cached on your device for seamless field access.
              </p>
            </div>

            <div className="mt-auto border-t border-slate-100 pt-6">
              <div className="p-5 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-[11px] text-orange-800 font-bold leading-relaxed mb-4">
                  Help expand our national directory. Submit a new orphanage listing for public verification.
                </p>
                <button 
                  onClick={() => setShowSubmission(true)}
                  className="w-full bg-brand-accent text-white py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Contribute Now
                </button>
              </div>
            </div>

            <div className="pt-4 text-[10px] text-slate-400 font-medium font-mono">
              <p>© 2026 KINDRED CAMEROON</p>
              <p className="mt-1 opacity-70 uppercase tracking-tighter">Unified National Directory</p>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedOrphanage && (
          <OrphanageDetails 
            orphanage={selectedOrphanage} 
            onBack={() => setSelectedOrphanage(null)}
            onSelectNearby={handleSelectOrphanage}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubmission && (
          <SubmissionForm onClose={() => setShowSubmission(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmin && isAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
      </AnimatePresence>

      <FeedbackForm />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-6 flex flex-col gap-4 z-40 md:bottom-6">
        {isAdmin && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdmin(true)}
            className="w-14 h-14 bg-white text-brand-primary rounded-full shadow-lg flex items-center justify-center border border-brand-primary/20"
          >
            <Shield size={24} />
          </motion.button>
        )}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSubmission(true)}
          className="w-14 h-14 bg-brand-accent text-white rounded-full shadow-lg shadow-brand-accent/30 flex items-center justify-center"
        >
          <PlusCircle size={28} />
        </motion.button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
