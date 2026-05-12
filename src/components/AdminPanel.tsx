import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { Orphanage, OrphanageStatus, Feedback, FeedbackType, CAMEROON_REGIONS } from '../types';
import { Check, X, Edit, Trash2, ArrowLeft, BarChart3, ListChecks, MessageSquare, PieChart, Info, Map as MapIcon, ChevronRight, Plus, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { EditOrphanageModal } from './EditOrphanageModal';
import { BulkImport } from './BulkImport';
import { AdminOrphanageExplorer } from './AdminOrphanageExplorer';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const [view, setView] = useState<'pending' | 'dashboard' | 'feedback' | 'directory' | 'bulk' | 'explorer'>('dashboard');
  const [pending, setPending] = useState<Orphanage[]>([]);
  const [allOrphanages, setAllOrphanages] = useState<Orphanage[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrphanage, setEditingOrphanage] = useState<Orphanage|null>(null);
  const [directoryFilters, setDirectoryFilters] = useState({
    status: 'ALL',
    region: 'ALL',
    search: ''
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Orphanages
      const snap = await getDocs(collection(db, 'orphanages'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Orphanage));
      setAllOrphanages(list);
      setPending(list.filter(o => o.status === OrphanageStatus.PENDING));

      // Feedback
      const fSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50)));
      setFeedback(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'admin_data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = useMemo(() => {
    const total = allOrphanages.length;
    const approved = allOrphanages.filter(o => o.status === OrphanageStatus.APPROVED).length;
    const pendingCount = pending.length;
    const recent = allOrphanages
      .filter(o => o.status === OrphanageStatus.APPROVED)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);

    // Regional data
    const regionCounts: Record<string, number> = {};
    allOrphanages.forEach(o => {
      regionCounts[o.region] = (regionCounts[o.region] || 0) + 1;
    });
    const regionalData = Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { total, approved, pendingCount, recent, regionalData };
  }, [allOrphanages, pending]);

  const handleStatus = async (id: string, status: OrphanageStatus) => {
    try {
      await updateDoc(doc(db, 'orphanages', id), { 
        status,
        updatedAt: serverTimestamp()
      });
      fetchStats();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orphanages/${id}`);
    }
  };

  const handleResolveFeedback = async (id: string, resolved: boolean) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { resolved });
      fetchStats();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `feedback/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteDoc(doc(db, 'orphanages', id));
        fetchStats();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orphanages/${id}`);
      }
    }
  };

  const handleSeed = async () => {
    const samples = [
        {
          name: "Saint John's Orphanage",
          region: "Central",
          city: "Yaoundé",
          latitude: 3.848,
          longitude: 11.502,
          capacity: 45,
          ageGroups: "3-16",
          description: "A well-established center in the heart of Yaoundé providing education and care for vulnerable children.",
          status: OrphanageStatus.APPROVED,
        },
        {
          name: "Hope Center Douala",
          region: "Littoral",
          city: "Douala",
          latitude: 4.051,
          longitude: 9.767,
          capacity: 30,
          ageGroups: "0-10",
          description: "Focusing on early childhood development and medical support for infants.",
          status: OrphanageStatus.APPROVED,
        }
      ];
      try {
        for (const s of samples) {
          await addDoc(collection(db, 'orphanages'), { ...s, createdAt: serverTimestamp() });
        }
        fetchStats();
        alert('Sample data added!');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'orphanages/seed');
      }
  };

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  const filteredDirectory = useMemo(() => {
    return allOrphanages.filter(o => {
      const matchStatus = directoryFilters.status === 'ALL' || o.status === directoryFilters.status;
      const matchRegion = directoryFilters.region === 'ALL' || o.region === directoryFilters.region;
      const matchSearch = o.name.toLowerCase().includes(directoryFilters.search.toLowerCase()) || 
                          o.city.toLowerCase().includes(directoryFilters.search.toLowerCase());
      return matchStatus && matchRegion && matchSearch;
    });
  }, [allOrphanages, directoryFilters]);

  return (
    <div className="fixed inset-0 z-[100] bg-brand-bg flex flex-col h-screen overflow-hidden">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900">Admin Dashboard</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Institutions & Feedback Control</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button 
             onClick={() => setView('dashboard')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'dashboard' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <BarChart3 size={16} /> Stats
           </button>
           <button 
             onClick={() => setView('pending')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'pending' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <ListChecks size={16} /> Submissions {pending.length > 0 && <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
           </button>
           <button 
             onClick={() => setView('directory')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'directory' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <MapIcon size={16} /> Directory
           </button>
           <button 
             onClick={() => setView('feedback')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'feedback' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <MessageSquare size={16} /> Feedback
           </button>
           <button 
             onClick={() => setView('bulk')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'bulk' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Plus size={16} /> Batch Entry
           </button>
           <button 
             onClick={() => setView('explorer')}
             className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'explorer' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Navigation size={16} /> Explorer
           </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Secure Data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === 'bulk' && (
              <motion.div 
                key="bulk"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-slate-800">Batch Institution Entry</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-point spatial deployment</p>
                  </div>
                </div>
                <BulkImport onComplete={() => { fetchStats(); setView('dashboard'); }} />
              </motion.div>
            )}

            {view === 'explorer' && (
              <motion.div 
                key="explorer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full space-y-6"
              >
                <div>
                   <h3 className="font-serif font-bold text-2xl text-slate-800">Map Discovery Explorer</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Discover and import national institutions from Google Maps</p>
                </div>
                <AdminOrphanageExplorer />
              </motion.div>
            )}

            {view === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><MapIcon size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Institutions</span>
                    <p className="text-3xl font-black text-slate-800 mt-1">{stats.total}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4"><Check size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Listings</span>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{stats.approved}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-4"><ListChecks size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Awaiting Review</span>
                    <p className="text-3xl font-black text-orange-600 mt-1">{stats.pendingCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-4"><MessageSquare size={20} /></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">New Feedback</span>
                    <p className="text-3xl font-black text-purple-600 mt-1">{feedback.filter(f => !f.resolved).length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Regional Chart */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="font-serif font-bold text-xl text-slate-800">Regional Distribution</h3>
                       <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><PieChart size={18} /></div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.regionalData} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                            {stats.regionalData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-serif font-bold text-xl text-slate-800 mb-6">Recently Verified</h3>
                    <div className="space-y-4">
                      {stats.recent.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100/50 group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 font-bold text-xs uppercase italic select-none">IMG</div>
                            <div>
                               <h4 className="font-bold text-slate-800 leading-none">{o.name}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{o.city}, {o.region}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => { setEditingOrphanage(o); }}
                            className="p-2 text-slate-300 hover:text-brand-primary hover:bg-white rounded-lg transition-all"
                          >
                             <ChevronRight size={20} />
                          </button>
                        </div>
                      ))}
                      {stats.recent.length === 0 && <div className="text-center py-10 text-slate-400 italic">No recent activity detected.</div>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center border-t border-slate-100 pt-10">
                  <button onClick={handleSeed} className="text-[10px] bg-slate-50 text-slate-400 px-6 py-3 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-all uppercase font-black tracking-widest border border-slate-100">Bootstrap Seed Data (Development)</button>
                </div>
              </motion.div>
            )}

            {view === 'pending' && (
              <motion.div 
                key="pending"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-2xl text-slate-800">Pending Reviews</h3>
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">{pending.length} submissions</span>
                </div>

                {pending.length === 0 ? (
                  <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300"><ListChecks size={32} /></div>
                    <p className="text-slate-400 italic">Queue is clear. No new submissions.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {pending.map(o => (
                      <motion.div layout key={o.id} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-start group">
                         <div className="w-full md:w-48 h-48 bg-slate-100 rounded-2xl overflow-hidden relative flex-shrink-0">
                            {o.photoUrl ? (
                              <img src={o.photoUrl} alt={o.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">No Image</div>
                            )}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">{o.region}</div>
                         </div>
                         <div className="flex-1 space-y-4">
                            <div>
                               <h4 className="text-2xl font-serif font-bold text-slate-800">{o.name}</h4>
                               <p className="text-slate-500 font-medium">{o.city}, {o.region}</p>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">{o.description}</p>
                            <div className="flex flex-wrap gap-4 pt-2">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                  <Users size={14} /> Capacity: {o.capacity || 'N/A'}
                               </div>
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                  <Calendar size={14} /> Ages: {o.ageGroups || 'N/A'}
                               </div>
                            </div>
                         </div>
                         <div className="flex md:flex-col gap-3 w-full md:w-auto h-full justify-end">
                            <button 
                              onClick={() => handleStatus(o.id, OrphanageStatus.APPROVED)}
                              className="flex-1 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                              <Check size={20} /> Approve
                            </button>
                            <button 
                              onClick={() => handleStatus(o.id, OrphanageStatus.REJECTED)}
                              className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                              <X size={20} /> Reject
                            </button>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === 'directory' && (
              <motion.div 
                key="directory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-slate-800">Complete Directory</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage and filter verified institutions</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input 
                      type="text"
                      placeholder="Search name or city..."
                      value={directoryFilters.search}
                      onChange={e => setDirectoryFilters({...directoryFilters, search: e.target.value})}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <select 
                      value={directoryFilters.region}
                      onChange={e => setDirectoryFilters({...directoryFilters, region: e.target.value})}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="ALL">All Regions</option>
                      {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select 
                      value={directoryFilters.status}
                      onChange={e => setDirectoryFilters({...directoryFilters, status: e.target.value})}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="ALL">All Status</option>
                      {Object.values(OrphanageStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-brand-primary text-[10px] font-black uppercase tracking-widest text-brand-primary">
                      Found: {filteredDirectory.length}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredDirectory.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{o.name}</p>
                              <p className="text-[10px] text-slate-400 truncate max-w-xs">{o.id}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-600">{o.city}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{o.region}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                                o.status === OrphanageStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' :
                                o.status === OrphanageStatus.PENDING ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => setEditingOrphanage(o)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-blue-50 rounded-lg transition-all"><Edit size={16} /></button>
                                 <button onClick={() => handleDelete(o.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </motion.div>
            )}

            {view === 'feedback' && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-bold text-2xl text-slate-800">User Insights</h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest">{feedback.length} items</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {feedback.map(f => (
                     <div key={f.id} className={`p-6 rounded-3xl border transition-all ${f.resolved ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-start justify-between">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                f.type === FeedbackType.BUG ? 'bg-red-50 text-red-500' :
                                f.type === FeedbackType.SUGGESTION ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {f.type === FeedbackType.BUG ? <Bug size={20} /> : f.type === FeedbackType.SUGGESTION ? <Lightbulb size={20} /> : <Info size={20} />}
                              </div>
                              <div>
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{f.type}</p>
                                 <p className="text-xs text-slate-500 font-bold">{f.userEmail}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleResolveFeedback(f.id, !f.resolved)}
                             className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${f.resolved ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                           >
                             {f.resolved ? 'Resolved' : 'Mark Resolved'}
                           </button>
                        </div>
                        <p className="mt-6 text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">{f.message}</p>
                        <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Submitted: {f.createdAt?.toDate().toLocaleDateString()}</p>
                     </div>
                   ))}
                   {feedback.length === 0 && <div className="text-center py-20 text-slate-400 italic">No feedback received yet.</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Editing Modal */}
      <AnimatePresence>
        {editingOrphanage && (
          <EditOrphanageModal 
            orphanage={editingOrphanage} 
            onClose={() => setEditingOrphanage(null)} 
            onUpdate={fetchStats}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Bug = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
);

const Lightbulb = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A4.5 4.5 0 0 0 13.5 3.5c-1.3 0-2.6.5-3.5 1.5C9.2 5.8 8.7 6.5 8.5 7.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
);

const Users = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const Calendar = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
