import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  TOKEN_STORAGE_KEY,
  authApi,
  catalogApi,
  collectionsApi,
  mapProductDto,
  mapTryOnJobDto,
  mapUserDto,
  registerSessionExpiredHandler,
  tryonApi,
} from '../services/api';
import { GarmentCategory, Product, TryOnJob, User } from '../types';

interface AppContextType {
  products: Product[];
  isCatalogLoading: boolean;
  catalogError: string | null;
  refreshCatalog: () => Promise<void>;
  selectedGarment: Product | null;
  setSelectedGarment: (product: Product | null) => void;
  uploadedPersonImage: string | null;
  uploadedPersonFile: File | null;
  setUploadedPersonPhoto: (previewUrl: string | null, file: File | null) => void;
  consentGiven: boolean;
  setConsentGiven: (consent: boolean) => void;
  currentJob: TryOnJob | null;
  clearCurrentJob: () => void;
  jobsHistory: TryOnJob[];
  savedLookIds: string[];
  wishlist: string[];
  currentUser: User | null;
  isAuthLoading: boolean;
  sessionExpiredMessage: string | null;
  clearSessionExpiredMessage: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  toggleSaveLook: (jobId: string) => Promise<void>;
  startTryOnJob: (product: Product, personFile: File, category?: string) => Promise<TryOnJob>;
  cancelTryOnJob: (jobId: string) => Promise<void>;
  fetchJobById: (jobId: string) => Promise<TryOnJob>;
  deleteJob: (jobId: string) => Promise<void>;
  deleteAllJobs: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<User>;
  registerAccount: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfileName: (fullName: string) => Promise<void>;
  updateUserConsent: (consent: boolean) => void;
  addProduct: (payload: {
    title: string;
    brand: string;
    category: GarmentCategory;
    color: string;
    price: number;
    description: string;
  }) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const FALLBACK_PRODUCT_PLACEHOLDER: Product = {
  id: 'unknown',
  title: 'Catalog Garment',
  brand: 'Atelier Vesti',
  category: 't-shirt',
  categoryLabel: 'T-Shirts',
  color: 'Classic',
  price: 45,
  imageUrl: '',
  flatGarmentUrl: '',
  description: '',
  material: '100% Cotton',
  fit: 'Regular Fit',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [selectedGarment, setSelectedGarment] = useState<Product | null>(null);
  const [uploadedPersonImage, setUploadedPersonImage] = useState<string | null>(null);
  const [uploadedPersonFile, setUploadedPersonFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [currentJob, setCurrentJob] = useState<TryOnJob | null>(null);

  const [jobsHistory, setJobsHistory] = useState<TryOnJob[]>([]);
  const [savedLookIds, setSavedLookIds] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const cancelPollRef = useRef<boolean>(false);

  const resolveProductById = useCallback(
    (productId: string, list: Product[] = products): Product => {
      return list.find((p) => p.id === productId) || { ...FALLBACK_PRODUCT_PLACEHOLDER, id: productId };
    },
    [products]
  );

  const refreshCatalog = useCallback(async () => {
    setIsCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await catalogApi.listProducts({ limit: 50 });
      const mapped = res.items.map(mapProductDto);
      setProducts(mapped);
      setSelectedGarment((prev) => prev || mapped[0] || null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load catalog from API.';
      setCatalogError(msg);
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  const loadUserCollections = useCallback(
    async (catalogList: Product[]) => {
      try {
        const [jobsRes, wishlistRes, savedRes] = await Promise.all([
          tryonApi.listJobs(1, 50),
          collectionsApi.listWishlist(),
          collectionsApi.listSavedLooks(),
        ]);
        const mappedJobs = jobsRes.items.map((dto) =>
          mapTryOnJobDto(dto, resolveProductById(dto.product_id, catalogList))
        );
        setJobsHistory(mappedJobs);
        setWishlist(wishlistRes.map((w) => w.product_id));
        setSavedLookIds(savedRes.map((s) => s.job_id));
      } catch {
        // Handled cleanly by interceptor if 401
      }
    },
    [resolveProductById]
  );

  // Register 401 session expiration handler
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setCurrentUser(null);
      setJobsHistory([]);
      setWishlist([]);
      setSavedLookIds([]);
      setSessionExpiredMessage('Your session expired. Please sign in again to continue.');
    });
  }, []);

  // Initial load: catalog + session hydration
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      let loadedProducts: Product[] = [];
      setIsCatalogLoading(true);
      try {
        const res = await catalogApi.listProducts({ limit: 50 });
        loadedProducts = res.items.map(mapProductDto);
        if (mounted) {
          setProducts(loadedProducts);
          setSelectedGarment((prev) => prev || loadedProducts[0] || null);
          setCatalogError(null);
        }
      } catch (err) {
        if (mounted) {
          setCatalogError(err instanceof ApiError ? err.message : 'Unable to fetch catalog.');
        }
      } finally {
        if (mounted) setIsCatalogLoading(false);
      }

      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        try {
          const me = await authApi.getMe();
          if (mounted) {
            setCurrentUser(mapUserDto(me));
            await loadUserCollections(loadedProducts);
          }
        } catch {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          if (mounted) setCurrentUser(null);
        }
      }
      if (mounted) setIsAuthLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, [loadUserCollections]);

  const setUploadedPersonPhoto = (previewUrl: string | null, file: File | null) => {
    setUploadedPersonImage(previewUrl);
    setUploadedPersonFile(file);
  };

  const clearCurrentJob = () => {
    cancelPollRef.current = true;
    setCurrentJob(null);
  };

  const clearSessionExpiredMessage = () => setSessionExpiredMessage(null);

  const loginWithCredentials = async (email: string, password: string): Promise<User> => {
    const tokenRes = await authApi.login(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenRes.access_token);
    const user = mapUserDto(tokenRes.user);
    setCurrentUser(user);
    setSessionExpiredMessage(null);
    await loadUserCollections(products);
    return user;
  };

  const registerAccount = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<User> => {
    const tokenRes = await authApi.register(email, password, fullName);
    localStorage.setItem(TOKEN_STORAGE_KEY, tokenRes.access_token);
    const user = mapUserDto(tokenRes.user);
    setCurrentUser(user);
    setSessionExpiredMessage(null);
    await loadUserCollections(products);
    return user;
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network error on logout; clear client state regardless
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setCurrentUser(null);
      setJobsHistory([]);
      setWishlist([]);
      setSavedLookIds([]);
      setCurrentJob(null);
    }
  };

  const updateProfileName = async (fullName: string): Promise<void> => {
    const updated = await authApi.updateProfile(fullName);
    setCurrentUser(mapUserDto(updated, currentUser?.consentGiven ?? true));
  };

  const updateUserConsent = (consent: boolean) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, consentGiven: consent });
    }
    setConsentGiven(consent);
  };

  const toggleWishlist = async (productId: string): Promise<void> => {
    if (!currentUser) {
      throw new ApiError('Please sign in to manage your wishlist.', 'UNAUTHORIZED', 401);
    }
    const isPresent = wishlist.includes(productId);
    if (isPresent) {
      await collectionsApi.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((id) => id !== productId));
    } else {
      await collectionsApi.addToWishlist(productId);
      setWishlist((prev) => [productId, ...prev]);
    }
  };

  const toggleSaveLook = async (jobId: string): Promise<void> => {
    if (!currentUser) {
      throw new ApiError('Please sign in to save looks.', 'UNAUTHORIZED', 401);
    }
    const isSaved = savedLookIds.includes(jobId);
    if (isSaved) {
      await collectionsApi.removeSavedLook(jobId);
      setSavedLookIds((prev) => prev.filter((id) => id !== jobId));
    } else {
      await collectionsApi.saveLook(jobId);
      setSavedLookIds((prev) => [jobId, ...prev]);
    }
  };

  const fetchJobById = async (jobId: string): Promise<TryOnJob> => {
    const dto = await tryonApi.getJob(jobId);
    const mapped = mapTryOnJobDto(dto, resolveProductById(dto.product_id));
    setCurrentJob((prev) => (prev?.id === mapped.id ? mapped : prev));
    return mapped;
  };

  const startTryOnJob = async (
    product: Product,
    personFile: File,
    category = 'upper_body'
  ): Promise<TryOnJob> => {
    cancelPollRef.current = false;
    const created = await tryonApi.submitJob({
      personImageFile: personFile,
      productId: product.id,
      consent: true,
      category,
    });

    const initialJob: TryOnJob = {
      id: created.job_id,
      productId: product.id,
      product,
      personImageUrl: uploadedPersonImage || '',
      status: created.status,
      category,
      createdAt: new Date().toISOString(),
    };
    setCurrentJob(initialJob);

    // Poll backend until terminal state
    const maxPolls = 120;
    for (let attempt = 0; attempt < maxPolls; attempt++) {
      if (cancelPollRef.current) {
        return initialJob;
      }
      await new Promise((r) => setTimeout(r, 1000));
      if (cancelPollRef.current) {
        return initialJob;
      }

      const dto = await tryonApi.getJob(created.job_id);
      const mapped = mapTryOnJobDto(dto, product);
      setCurrentJob(mapped);

      if (mapped.status === 'completed') {
        setJobsHistory((prev) => [mapped, ...prev.filter((j) => j.id !== mapped.id)]);
        return mapped;
      }
      if (mapped.status === 'failed' || mapped.status === 'cancelled') {
        return mapped;
      }
    }

    throw new ApiError(
      'Try-on job is taking longer than expected. Check History shortly for updates.',
      'POLL_TIMEOUT',
      408
    );
  };

  const cancelTryOnJob = async (jobId: string): Promise<void> => {
    cancelPollRef.current = true;
    try {
      const dto = await tryonApi.cancelJob(jobId);
      const mapped = mapTryOnJobDto(dto, resolveProductById(dto.product_id));
      setCurrentJob(mapped);
    } finally {
      setCurrentJob(null);
    }
  };

  const deleteJob = async (jobId: string): Promise<void> => {
    await tryonApi.deleteJob(jobId);
    setJobsHistory((prev) => prev.filter((j) => j.id !== jobId));
    setSavedLookIds((prev) => prev.filter((id) => id !== jobId));
    if (currentJob?.id === jobId) {
      setCurrentJob(null);
    }
  };

  const deleteAllJobs = async (): Promise<void> => {
    await Promise.all(jobsHistory.map((job) => tryonApi.deleteJob(job.id)));
    setJobsHistory([]);
    setSavedLookIds([]);
    setCurrentJob(null);
    setUploadedPersonPhoto(null, null);
  };

  const addProduct = async (payload: {
    title: string;
    brand: string;
    category: GarmentCategory;
    color: string;
    price: number;
    description: string;
  }): Promise<void> => {
    const createdDto = await catalogApi.adminCreateProduct({
      ...payload,
      image_key: 'catalog/prod-001.png',
      tryon_image_key: 'catalog/prod-001.png',
    });
    const mapped = mapProductDto(createdDto);
    setProducts((prev) => [mapped, ...prev]);
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    await catalogApi.adminArchiveProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <AppContext.Provider
      value={{
        products,
        isCatalogLoading,
        catalogError,
        refreshCatalog,
        selectedGarment,
        setSelectedGarment,
        uploadedPersonImage,
        uploadedPersonFile,
        setUploadedPersonPhoto,
        consentGiven,
        setConsentGiven,
        currentJob,
        clearCurrentJob,
        jobsHistory,
        savedLookIds,
        wishlist,
        currentUser,
        isAuthLoading,
        sessionExpiredMessage,
        clearSessionExpiredMessage,
        toggleWishlist,
        toggleSaveLook,
        startTryOnJob,
        cancelTryOnJob,
        fetchJobById,
        deleteJob,
        deleteAllJobs,
        loginWithCredentials,
        registerAccount,
        logout,
        updateProfileName,
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
