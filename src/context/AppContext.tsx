import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut, db } from '../lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Orphanage, OrphanageStatus } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  orphanages: Orphanage[];
  loading: boolean;
  searchFilter: string;
  regionFilter: string;
  capacityFilter: number;
  ageFilter: string;
  setSearchFilter: (s: string) => void;
  setRegionFilter: (r: string) => void;
  setCapacityFilter: (c: number) => void;
  setAgeFilter: (a: string) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshOrphanages: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orphanages, setOrphanages] = useState<Orphanage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState(0);
  const [ageFilter, setAgeFilter] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(adminDoc.exists() || u.email === 'tsezamanji123@gmail.com');
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `admins/${u.uid}`);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  const refreshOrphanages = async () => {
    try {
      const q = query(collection(db, 'orphanages'), where('status', '==', OrphanageStatus.APPROVED));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Orphanage));
      setOrphanages(list);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'orphanages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrphanages();
  }, []);

  return (
    <AppContext.Provider value={{
      user, isAdmin, orphanages, loading,
      searchFilter, regionFilter, capacityFilter, ageFilter,
      setSearchFilter, setRegionFilter, setCapacityFilter, setAgeFilter,
      login: signInWithGoogle,
      logout: logOut,
      refreshOrphanages
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
