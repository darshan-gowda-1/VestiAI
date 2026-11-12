import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { GarmentCategory } from '../types';
import { ProductCard } from '../components/catalog/ProductCard';
import { Search, SlidersHorizontal, RotateCcw, PackageOpen, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

export const CatalogPage: React.FC = () => {
  const { products, isCatalogLoading, catalogError, refreshCatalog } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<GarmentCategory | 'all'>(
    (searchParams.get('category') as GarmentCategory) || 'all'
  );
  const [priceRange, setPriceRange] = useState<'all' | 'under-35' | '35-65' | 'over-65'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc' | 'title'>('featured');

  // Sync category query param
  useEffect(() => {
    const cat = searchParams.get('category') as GarmentCategory | null;
    if (cat) {
      setCategory(cat);
    }
  }, [searchParams]);

  const categories: { label: string; value: GarmentCategory | 'all' }[] = [
    { label: 'All Tops', value: 'all' },
    { label: 'T-Shirts', value: 't-shirt' },
    { label: 'Shirts', value: 'shirt' },
    { label: 'Sweatshirts', value: 'sweatshirt' },
    { label: 'Blouses', value: 'blouse' },
  ];

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = category === 'all' || p.category === category;
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase()) ||
          p.color.toLowerCase().includes(search.toLowerCase()) ||
          p.material.toLowerCase().includes(search.toLowerCase());
        const matchesPrice =
          priceRange === 'all' ||
          (priceRange === 'under-35' && p.price < 35) ||
          (priceRange === '35-65' && p.price >= 35 && p.price <= 65) ||
          (priceRange === 'over-65' && p.price > 65);
        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'newest') {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, category, search, priceRange, sortBy]);

  const handleCategoryChange = (newCat: GarmentCategory | 'all') => {
    setCategory(newCat);
    if (newCat === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', newCat);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setPriceRange('all');
    setSortBy('featured');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-canvas-dark/60 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal">
          VestiAI Fashion Store
        </h1>
        <p className="text-sm text-charcoal-muted font-light max-w-2xl">
          Discover curated tops and retailer styles. Search, filter by category or price, save favorites, and launch live 2D virtual try-on.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                category === cat.value
                  ? 'bg-charcoal text-canvas shadow-xs'
                  : 'bg-white text-charcoal-muted hover:text-charcoal border border-canvas-dark/60 hover:border-charcoal/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-light" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tops, colors..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-canvas-dark text-xs bg-white text-charcoal focus:outline-none focus:border-charcoal shadow-xs"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <select
              aria-label="Filter by price"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as typeof priceRange)}
              className="bg-white border border-canvas-dark text-xs text-charcoal rounded-full px-3 py-2 focus:outline-none focus:border-charcoal shadow-xs cursor-pointer"
            >
              <option value="all">All Prices</option>
              <option value="under-35">Under $35</option>
              <option value="35-65">$35 – $65</option>
              <option value="over-65">Over $65</option>
            </select>

            <SlidersHorizontal className="w-3.5 h-3.5 text-charcoal-muted" />
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-white border border-canvas-dark text-xs text-charcoal rounded-full px-3 py-2 focus:outline-none focus:border-charcoal shadow-xs cursor-pointer"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid or Loading / Error / Empty State */}
      {isCatalogLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : catalogError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50/60 py-14 px-6 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-white border border-red-200 flex items-center justify-center text-red-600 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-charcoal">Unable to Load Catalog</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">{catalogError}</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => refreshCatalog()} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Retry Connection</span>
          </Button>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-canvas-dark bg-white/70 py-16 px-6 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-canvas-subtle border border-canvas-dark flex items-center justify-center text-charcoal-light mx-auto">
            <PackageOpen className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-medium text-charcoal">No Matching Tops Found</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed font-light">
              We couldn't find any tops matching your current search or category filter.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleResetFilters} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset All Filters</span>
          </Button>
        </div>
      )}
    </div>
  );
};
