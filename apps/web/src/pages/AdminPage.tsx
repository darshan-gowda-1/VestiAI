import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import { GarmentCategory } from '../types';
import { Shield, Plus, Trash2, Activity, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export const AdminPage: React.FC = () => {
  const { products, jobsHistory, deleteProduct, addProduct, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'products' | 'jobs'>('products');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('Atelier Vesti');
  const [category, setCategory] = useState<GarmentCategory>('t-shirt');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('50');
  const [description, setDescription] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-medium text-charcoal">Administrator Access Required</h2>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This workspace is restricted to accounts with the <code className="font-mono">admin</code> role.
        </p>
        <Link to="/login">
          <Button variant="primary" size="sm">Sign In with Admin Account</Button>
        </Link>
      </div>
    );
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !color.trim()) return;
    setAdminError(null);
    setIsSubmitting(true);
    try {
      await addProduct({
        title: title.trim(),
        brand: brand.trim() || 'Atelier Vesti',
        category,
        color: color.trim(),
        price: parseFloat(price) || 45,
        description: description.trim() || 'Premium upper-body apparel tailored for virtual try-on.',
      });
      setIsAddModalOpen(false);
      setTitle('');
      setColor('');
      setDescription('');
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setAdminError(null);
    try {
      await deleteProduct(productId);
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to archive product.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-canvas-dark/60 pb-6">
        <div className="space-y-1">
          <Badge variant="accent" className="text-xs uppercase tracking-wider mb-1">
            Catalog & System Admin
          </Badge>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal flex items-center space-x-2">
            <Shield className="w-7 h-7 text-accent" />
            <span>Administrator Workspace</span>
          </h1>
          <p className="text-sm text-charcoal-muted font-light">
            Manage catalog tops, monitor asynchronous worker queues, and audit system performance.
          </p>
        </div>
      </div>

      {adminError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{adminError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-4 border-b border-canvas-dark/60">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'products' ? 'text-charcoal font-semibold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <span>Catalog Inventory ({products.length})</span>
          {activeTab === 'products' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'jobs' ? 'text-charcoal font-semibold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <span>Worker Job Monitor ({jobsHistory.length})</span>
          {activeTab === 'jobs' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      {/* Tab 1: Products Table */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-charcoal-light uppercase font-semibold">
              Active Upper-Body Garments
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add New Top</span>
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-canvas-dark/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal">
                <thead className="bg-canvas-subtle/70 border-b border-canvas-dark/60 text-[11px] font-semibold uppercase text-charcoal-light">
                  <tr>
                    <th className="py-3.5 px-6">Garment</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Color</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Material</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-subtle">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas-subtle/30 transition-colors">
                      <td className="py-3.5 px-6 flex items-center space-x-3">
                        <div className="w-9 h-11 bg-canvas-subtle rounded-lg p-1 shrink-0 flex items-center justify-center">
                          <img src={p.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{p.title}</p>
                          <p className="text-[10px] text-charcoal-light">{p.brand}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="text-[10px]">
                          {p.categoryLabel}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-muted">{p.color}</td>
                      <td className="py-3.5 px-4 font-mono font-medium">${p.price}</td>
                      <td className="py-3.5 px-4 text-charcoal-light max-w-[150px] truncate">
                        {p.material}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg text-charcoal-light hover:text-red-600 hover:bg-red-50 transition"
                          title="Archive Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Job Monitor Table */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-dark/60 text-xs text-charcoal-muted flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Worker Pool Status:</strong> Healthy • Inference Engine: IDM-VTON / CatVTON Dual Adapter
              </span>
            </div>
            <span className="font-mono text-[10px] bg-white px-2.5 py-1 rounded-full border border-canvas-dark">
              Worker PID: 2194
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-canvas-dark/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal">
                <thead className="bg-canvas-subtle/70 border-b border-canvas-dark/60 text-[11px] font-semibold uppercase text-charcoal-light">
                  <tr>
                    <th className="py-3.5 px-6">Job ID</th>
                    <th className="py-3.5 px-4">Garment</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-subtle">
                  {jobsHistory.length > 0 ? (
                    jobsHistory.map((j) => (
                      <tr key={j.id} className="hover:bg-canvas-subtle/30 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-medium text-accent">
                          {j.id}
                        </td>
                        <td className="py-3.5 px-4">{j.product.title}</td>
                        <td className="py-3.5 px-4 font-mono text-charcoal-muted">
                          {(j.processingTimeMs ? j.processingTimeMs / 1000 : 3.4).toFixed(1)}s
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="success" className="text-[10px]">
                            {j.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6 text-charcoal-light">
                          {new Date(j.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-charcoal-light">
                        No active or recent jobs recorded in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Catalog Garment"
        description="Add a new upper-body top to the VestiAI product inventory."
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input
            id="title"
            label="Garment Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Classic Pima Cotton Tee"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-11 rounded-xl border border-canvas-dark bg-white px-3 text-xs text-charcoal focus:outline-none focus:border-charcoal"
              >
                <option value="t-shirt">T-Shirt</option>
                <option value="shirt">Shirt</option>
                <option value="sweatshirt">Sweatshirt</option>
                <option value="blouse">Blouse</option>
              </select>
            </div>

            <Input
              id="color"
              label="Colorway"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Olive Green"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="brand"
              label="Brand / Label"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Atelier Vesti"
            />

            <Input
              id="price"
              label="Demo Price ($)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <Input
            id="desc"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breathable organic cotton silhouette..."
          />

          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Publish Garment
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
