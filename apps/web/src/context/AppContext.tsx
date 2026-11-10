import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, TryOnJob, User } from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';

interface AppContextType {
  products: Product[];
  selectedGarment: Product | null;
  setSelectedGarment: (product: Product | null) => void;
  uploadedPersonImage: string | null;
  setUploadedPersonImage: (img: string | null) => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
  currentJob: TryOnJob | null;
  jobsHistory: TryOnJob[];
  wishlist: string[];
  currentUser: User | null;
  toggleWishlist: (productId: string) => void;
  startTryOnJob: (product: Product, personImageUrl: string) => Promise<TryOnJob>;
  deleteJob: (jobId: string) => void;
  deleteAllJobs: () => void;
  login: (role?: 'user' | 'admin') => void;
  logout: () => void;
  updateUserConsent: (consent: boolean) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedGarment, setSelectedGarment] = useState<Product | null>(MOCK_PRODUCTS[0]);
  const [uploadedPersonImage, setUploadedPersonImage] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<TryOnJob | null>(null);
  
  // Local storage persisted state
  const [jobsHistory, setJobsHistory] = useState<TryOnJob[]>(() => {
    const saved = localStorage.getItem('vestiai_jobs_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('vestiai_wishlist');
    return saved ? JSON.parse(saved) : ['prod-001', 'prod-003'];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vestiai_user');
    return saved ? JSON.parse(saved) : {
      id: 'usr-demo-01',
      name: 'College Evaluator',
      email: 'evaluator@college.edu',
      role: 'user',
      consentGiven: true,
    };
  });

  useEffect(() => {
    localStorage.setItem('vestiai_jobs_history', JSON.stringify(jobsHistory));
  }, [jobsHistory]);

  useEffect(() => {
    localStorage.setItem('vestiai_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('vestiai_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('vestiai_user');
    }
  }, [currentUser]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const login = (role: 'user' | 'admin' = 'user') => {
    setCurrentUser({
      id: role === 'admin' ? 'admin-01' : 'usr-demo-01',
      name: role === 'admin' ? 'Catalog Administrator' : 'Demo Shopper',
      email: role === 'admin' ? 'admin@vestiai.internal' : 'shopper@vestiai.demo',
      role,
      consentGiven: true,
    });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateUserConsent = (consent: boolean) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, consentGiven: consent });
    }
    setConsentGiven(consent);
  };

  const deleteJob = (jobId: string) => {
    setJobsHistory((prev) => prev.filter((j) => j.id !== jobId));
    if (currentJob?.id === jobId) {
      setCurrentJob(null);
    }
  };

  const deleteAllJobs = () => {
    setJobsHistory([]);
    setCurrentJob(null);
    setUploadedPersonImage(null);
  };

  const addProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Simulates realistic asynchronous job processing with progressive stages
  const startTryOnJob = async (product: Product, personImageUrl: string): Promise<TryOnJob> => {
    const newJobId = `job-${Date.now()}`;
    const initialJob: TryOnJob = {
      id: newJobId,
      productId: product.id,
      product,
      personImageUrl,
      status: 'queued',
      createdAt: new Date().toISOString(),
      isSimulated: true,
    };

    setCurrentJob(initialJob);

    // Transition: queued -> processing
    await new Promise((r) => setTimeout(r, 1200));
    const processingJob: TryOnJob = { ...initialJob, status: 'processing' };
    setCurrentJob(processingJob);

    // Transition: processing -> completed (with simulated synthesized garment preview)
    await new Promise((r) => setTimeout(r, 2200));
    const completedJob: TryOnJob = {
      ...processingJob,
      status: 'completed',
      completedAt: new Date().toISOString(),
      processingTimeMs: 3420,
      resultImageUrl: product.imageUrl, // In full integration, replaced by model output
    };

    setCurrentJob(completedJob);
    setJobsHistory((prev) => [completedJob, ...prev]);
    return completedJob;
  };

  return (
    <AppContext.Provider
      value={{
        products,
        selectedGarment,
        setSelectedGarment,
        uploadedPersonImage,
        setUploadedPersonImage,
        consentGiven,
        setConsentGiven,
        currentJob,
        jobsHistory,
        wishlist,
        currentUser,
        toggleWishlist,
        startTryOnJob,
        deleteJob,
        deleteAllJobs,
        login,
        logout,
        updateUserConsent,
        addProduct,
        deleteProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
