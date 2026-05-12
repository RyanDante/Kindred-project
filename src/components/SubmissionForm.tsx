import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, MapPin, Info, Phone, Mail, Users, Camera } from 'lucide-react';
import { CAMEROON_REGIONS, OrphanageStatus } from '../types';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export const SubmissionForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    region: CAMEROON_REGIONS[0],
    city: '',
    latitude: '',
    longitude: '',
    contactPhone: '',
    contactEmail: '',
    capacity: '',
    ageGroups: '',
    description: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `orphanages/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'orphanages'), {
        ...formData,
        photoUrl,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        status: OrphanageStatus.PENDING,
        createdAt: serverTimestamp(),
        submittedByEmail: auth.currentUser?.email
      });
      setSuccess(true);
      setTimeout(onClose, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orphanages');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Send size={40} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">{t('common.contribution_thanks')}</h2>
        <p className="text-gray-500">{t('common.pending')}</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[60] bg-white overflow-y-auto px-6 py-8"
    >
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-white py-2 z-10">
        <h2 className="text-2xl font-serif font-bold text-brand-primary">{t('common.submit_new')}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase tracking-widest pl-2 border-l-4 border-brand-primary">
            <Info size={16} />
            <span>Basic Info</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Orphanage Name *</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Hope Village"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('common.region')} *</label>
              <select 
                required
                value={formData.region}
                onChange={e => setFormData({...formData, region: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              >
                {CAMEROON_REGIONS.map(r => (
                  <option key={r} value={r}>{t(`regions.${r}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('common.city')} *</label>
              <input 
                required
                type="text"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                placeholder="e.g. Yaoundé"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase tracking-widest pl-2 border-l-4 border-brand-primary">
            <MapPin size={16} />
            <span>Location (GPS)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Latitude *</label>
              <input 
                required
                type="number"
                step="any"
                value={formData.latitude}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
                placeholder="e.g. 3.848"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Longitude *</label>
              <input 
                required
                type="number"
                step="any"
                value={formData.longitude}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
                placeholder="e.g. 11.502"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm uppercase tracking-widest pl-2 border-l-4 border-brand-primary">
            <Phone size={16} />
            <span>Contact & Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('common.contact')} (Phone)</label>
              <input 
                type="tel"
                value={formData.contactPhone}
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
              <input 
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Capacity</label>
              <input 
                type="number"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Photo *</label>
              <div className="relative group">
                <input 
                  required
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className={`w-full h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${imagePreview ? 'border-brand-primary' : 'border-gray-200 hover:border-brand-primary bg-gray-50'}`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                  ) : (
                    <>
                      <Camera size={24} className="text-gray-400 mb-1" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Click to upload photo</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Description</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
            />
          </div>
        </section>

        <button 
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
        >
          {loading ? t('common.loading') : (
            <>
              <Send size={20} />
              {t('common.submit')}
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
