import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Map as MapIcon, PlusCircle, User, Languages as LangIcon, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export const Navbar: React.FC<{ 
  activeTab: 'list' | 'map', 
  setActiveTab: (t: 'list' | 'map') => void,
  onAdminClick: () => void 
}> = ({ activeTab, setActiveTab, onAdminClick }) => {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, login, logout } = useAppContext();

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('en') ? 'fr' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:bottom-auto md:bg-brand-primary md:text-white md:border-b-0 h-16 px-4 md:px-8 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-primary shadow-sm">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
        </div>
        <span className="text-xl md:text-2xl font-bold tracking-tight">KINDRED <span className="font-light opacity-80 underline decoration-brand-accent">CAMEROON</span></span>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => setActiveTab('list')}
          className={`flex flex-col md:flex-row items-center gap-2 transition-all ${activeTab === 'list' ? 'text-brand-accent font-bold md:border-b-2 md:border-brand-accent' : 'text-gray-500 md:text-white/80 hover:text-brand-accent'}`}
        >
          <Search size={20} className="md:hidden" />
          <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">{t('common.search')}</span>
        </button>
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex flex-col md:flex-row items-center gap-2 transition-all ${activeTab === 'map' ? 'text-brand-accent font-bold md:border-b-2 md:border-brand-accent' : 'text-gray-500 md:text-white/80 hover:text-brand-accent'}`}
        >
          <MapIcon size={20} className="md:hidden" />
          <span className="text-[10px] md:text-sm font-medium uppercase tracking-wider">{t('common.view_on_map')}</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <button 
            onClick={onAdminClick}
            className="p-2 text-brand-accent hover:bg-white/10 rounded-full transition-colors relative"
            title="Admin Panel"
          >
            <Shield size={22} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full border-2 border-brand-primary" />
          </button>
        )}

        <div className="hidden md:flex bg-brand-secondary rounded-full px-1 py-1">
          <button 
            onClick={() => i18n.changeLanguage('en')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${i18n.language.startsWith('en') ? 'bg-white text-brand-primary shadow-sm' : 'text-white opacity-70'}`}
          >
            EN
          </button>
          <button 
            onClick={() => i18n.changeLanguage('fr')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${i18n.language.startsWith('fr') ? 'bg-white text-brand-primary shadow-sm' : 'text-white opacity-70'}`}
          >
            FR
          </button>
        </div>

        <button 
          onClick={toggleLanguage}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1"
        >
          <LangIcon size={20} />
          <span className="text-xs font-bold uppercase">{i18n.language.slice(0, 2)}</span>
        </button>

        {user ? (
          <div className="flex items-center gap-3">
            <button onClick={logout} className="flex items-center gap-2 bg-brand-secondary/50 md:bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-700 md:text-white">
              <User size={18} />
              <span className="hidden sm:block text-xs font-semibold">{user.displayName?.split(' ')[0]}</span>
            </button>
          </div>
        ) : (
          <button onClick={login} className="bg-brand-accent text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-brand-accent/90 transition-all shadow-sm">
            {t('common.login_google')}
          </button>
        )}
      </div>
    </nav>
  );
};
