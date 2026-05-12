import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bug, Lightbulb, Info } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FeedbackType } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export const FeedbackForm: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState<FeedbackType>(FeedbackType.SUGGESTION);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type,
        message,
        createdAt: serverTimestamp(),
        resolved: false
      });
      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-40 bg-white text-brand-primary p-3 rounded-full shadow-lg border border-slate-200 md:bottom-8 hover:scale-110 active:scale-95 transition-all"
        title="Send Feedback"
      >
        <MessageSquare size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  <h2 className="font-bold">Share Your Feedback</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {success ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Send size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Thank You!</h3>
                  <p className="text-slate-500">Your feedback has been submitted successfully. Our team will review it shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Feedback Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => setType(FeedbackType.SUGGESTION)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${type === FeedbackType.SUGGESTION ? 'bg-blue-50 border-brand-primary text-brand-primary' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        <Lightbulb size={20} />
                        <span className="text-[10px] font-bold uppercase">Idea</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setType(FeedbackType.BUG)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${type === FeedbackType.BUG ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        <Bug size={20} />
                        <span className="text-[10px] font-bold uppercase">Bug</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setType(FeedbackType.OTHER)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${type === FeedbackType.OTHER ? 'bg-slate-50 border-slate-500 text-slate-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        <Info size={20} />
                        <span className="text-[10px] font-bold uppercase">Other</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Your Message</label>
                    <textarea 
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none text-slate-700"
                    />
                  </div>

                  <button 
                    disabled={loading || !auth.currentUser}
                    className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={18} /> Send Feedback
                      </>
                    )}
                  </button>

                  {!auth.currentUser && (
                    <p className="text-[10px] text-center text-red-500 font-bold uppercase">Please sign in to send feedback</p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
