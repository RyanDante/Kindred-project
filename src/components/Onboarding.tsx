import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Search, PlusCircle, Check } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('kindred_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShow(true);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to Kindred",
      description: "A centralized directory for orphanages in Cameroon. We help you find, support, and connect with verified institutions.",
      icon: <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary"><MapPin size={32} /></div>
    },
    {
      title: "Search & Filter",
      description: "Easily find orphanages by region, city, or name. Use filters to narrow down your search based on capacity and needs.",
      icon: <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-primary"><Search size={32} /></div>
    },
    {
      title: "Details at your Fingertips",
      description: "View contact information, capacity, and location for each institution. Get directions directly on your map.",
      icon: <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Check size={32} /></div>
    },
    {
      title: "Contribute to the Map",
      description: "Help us expand! Submit new orphanage listings for verification and join our community of supporters.",
      icon: <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-brand-accent"><PlusCircle size={32} /></div>
    }
  ];

  const handleClose = () => {
    localStorage.setItem('kindred_onboarding_seen', 'true');
    setShow(false);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleClose();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-brand-primary/20 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center mb-2">
            {steps[currentStep].icon}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-slate-800">{steps[currentStep].title}</h2>
            <p className="text-slate-500 leading-relaxed font-medium">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-brand-primary' : 'w-2 bg-slate-200'}`} 
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={nextStep}
              className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
            </button>
            <button 
              onClick={handleClose}
              className="text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
            >
              Skip Tutorial
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
