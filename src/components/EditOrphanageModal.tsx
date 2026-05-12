import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, MapPin, Info, Phone, Mail, Users, Calendar } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Orphanage, CAMEROON_REGIONS, OrphanageStatus } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface EditOrphanageModalProps {
  orphanage: Orphanage;
  onClose: () => void;
  onUpdate: () => void;
}

export const EditOrphanageModal: React.FC<EditOrphanageModalProps> = ({ orphanage, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: orphanage.name,
    region: orphanage.region,
    city: orphanage.city,
    latitude: orphanage.latitude.toString(),
    longitude: orphanage.longitude.toString(),
    contactPhone: orphanage.contactPhone || '',
    contactEmail: orphanage.contactEmail || '',
    capacity: orphanage.capacity?.toString() || '',
    ageGroups: orphanage.ageGroups || '',
    description: orphanage.description || '',
    status: orphanage.status
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, 'orphanages', orphanage.id), {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        updatedAt: serverTimestamp()
      });
      onUpdate();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orphanages/${orphanage.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-800">Edit Institution</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Direct Administrative Override</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as OrphanageStatus})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value={OrphanageStatus.PENDING}>Pending</option>
                <option value={OrphanageStatus.APPROVED}>Approved</option>
                <option value={OrphanageStatus.REJECTED}>Rejected</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Region</label>
              <select 
                value={formData.region}
                onChange={e => setFormData({...formData, region: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">City</label>
              <input 
                required
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Lat</label>
              <input 
                type="number" step="any"
                value={formData.latitude}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
                className="w-full px-3 py-3 bg-orange-50/30 border border-orange-100 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Lng</label>
              <input 
                type="number" step="any"
                value={formData.longitude}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
                className="w-full px-3 py-3 bg-orange-50/30 border border-orange-100 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Capacity</label>
              <input 
                type="number"
                value={formData.capacity}
                onChange={e => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-3 py-3 bg-blue-50/30 border border-blue-100 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Age Groups</label>
              <input 
                value={formData.ageGroups}
                onChange={e => setFormData({...formData, ageGroups: e.target.value})}
                className="w-full px-3 py-3 bg-blue-50/30 border border-blue-100 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Phone</label>
              <input 
                value={formData.contactPhone}
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Email</label>
              <input 
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none text-sm leading-relaxed"
            />
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
