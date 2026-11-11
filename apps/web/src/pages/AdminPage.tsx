import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  AdminAuditLogDto,
  AdminJobSummaryDto,
  AdminUsageStatsDto,
  ApiError,
  adminApi,
  catalogApi,
  mapProductDto,
} from '../services/api';
import { GarmentCategory, Product } from '../types';
import {
  Shield,
  Plus,
  Trash2,
  Activity,
  AlertCircle,
  Edit3,
  Power,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { Input } from '../components/ui/input';

export const AdminPage: React.FC = () => {
  const { refreshCatalog, addProduct, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'products' | 'jobs' | 'audit'>('products');
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJobSummaryDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogDto[]>([]);
  const [stats, setStats] = useState<AdminUsageStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Add / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('Atelier Vesti');
  const [category, setCategory] = useState<GarmentCategory>('t-shirt');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('50');
  const [description, setDescription] = useState('');

  const loadAdminData = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setIsLoading(true);
    setAdminError(null);
    try {
      const [prodsRes, jobsRes, statsRes, logsRes] = await Promise.all([
        catalogApi.adminListProducts(100),
        adminApi.listJobs(1, 50),
        adminApi.getStats(),
        adminApi.listAuditLogs(1, 50),
      ]);
      setAdminProducts(prodsRes.items.map(mapProductDto));
      setAdminJobs(jobsRes.items);
      setStats(statsRes);
      setAuditLogs(logsRes.items);
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to load admin telemetry.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

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

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setBrand('Atelier Vesti');
    setCategory('t-shirt');
    setColor('');
    setPrice('50');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setBrand(product.brand);
    setCategory(product.category);
    setColor(product.color);
    setPrice(String(product.price));
    setDescription(product.description);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !color.trim()) return;
    setAdminError(null);
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await catalogApi.adminUpdateProduct(editingProduct.id, {
          title: title.trim(),
          brand: brand.trim() || 'Atelier Vesti',
          category,
          color: color.trim(),
          price: parseFloat(price) || 45,
          description: description.trim() || 'Premium upper-body apparel.',
        });
      } else {
        await addProduct({
          title: title.trim(),
          brand: brand.trim() || 'Atelier Vesti',
          category,
          color: color.trim(),
          price: parseFloat(price) || 45,
          description: description.trim() || 'Premium upper-body apparel tailored for virtual try-on.',
        });
      }
      setIsModalOpen(false);
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    setAdminError(null);
    try {
      await catalogApi.adminUpdateProduct(product.id, { is_active: !product.isActive });
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to update product status.');
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    setAdminError(null);
    try {
      await catalogApi.adminArchiveProduct(productId);
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch (err) {
      setAdminError(err instanceof ApiError ? err.message : 'Failed to archive product.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
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
            Manage catalog tops, monitor worker queues (with minimal PII), and review audit trails.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAdminData} isLoading={isLoading} className="text-xs">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Metrics</span>
        </Button>
      </div>

      {/* Live Usage Metrics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-canvas-dark/60 shadow-xs">
            <p className="text-[11px] font-semibold uppercase text-charcoal-light">Active / Archived Tops</p>
            <p className="font-serif text-2xl font-medium text-charcoal mt-1">
              {stats.active_products} <span className="text-sm text-charcoal-light">/ {stats.archived_products}</span>
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-canvas-dark/60 shadow-xs">
            <p className="text-[11px] font-semibold uppercase text-charcoal-light">Try-On Jobs (Total)</p>
            <p className="font-serif text-2xl font-medium text-charcoal mt-1">
              {stats.total_jobs}{' '}
              <span className="text-xs font-sans text-emerald-700 font-medium">
                ({stats.completed_jobs} ok / {stats.failed_jobs} err)
              </span>
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-canvas-dark/60 shadow-xs">
            <p className="text-[11px] font-semibold uppercase text-charcoal-light">Avg Processing Time</p>
            <p className="font-serif text-2xl font-medium text-charcoal mt-1">
              {stats.avg_processing_time_ms ? `${(stats.avg_processing_time_ms / 1000).toFixed(2)}s` : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-canvas-dark/60 shadow-xs">
            <p className="text-[11px] font-semibold uppercase text-charcoal-light">Registered Users / Looks</p>
            <p className="font-serif text-2xl font-medium text-charcoal mt-1">
              {stats.total_users} <span className="text-sm text-charcoal-light">/ {stats.total_saved_looks}</span>
            </p>
          </div>
        </div>
      )}

      {adminError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{adminError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-6 border-b border-canvas-dark/60">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'products' ? 'text-charcoal font-semibold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <span>Catalog Inventory ({adminProducts.length})</span>
          {activeTab === 'products' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'jobs' ? 'text-charcoal font-semibold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <span>Worker Job Monitor ({adminJobs.length})</span>
          {activeTab === 'jobs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === 'audit' ? 'text-charcoal font-semibold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <span>Audit Logs ({auditLogs.length})</span>
          {activeTab === 'audit' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
        </button>
      </div>

      {/* Tab 1: Products Table */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-charcoal-light uppercase font-semibold">
              Catalog Garments (Active & Archived)
            </p>
            <Button variant="primary" size="sm" onClick={openAddModal} className="text-xs shadow-sm">
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
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-subtle">
                  {adminProducts.map((p) => (
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
                        <Badge variant="secondary" className="text-[10px]">{p.categoryLabel}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-muted">{p.color}</td>
                      <td className="py-3.5 px-4 font-mono font-medium">${p.price}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={p.isActive ? 'success' : 'warning'} className="text-[10px]">
                          {p.isActive ? 'Active' : 'Archived'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-charcoal-light hover:text-charcoal hover:bg-canvas-subtle transition"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(p)}
                          className="p-1.5 rounded-lg text-charcoal-light hover:text-accent hover:bg-accent-subtle transition"
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        {p.isActive && (
                          <button
                            onClick={() => handleArchiveProduct(p.id)}
                            className="p-1.5 rounded-lg text-charcoal-light hover:text-red-600 hover:bg-red-50 transition"
                            title="Archive Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
                <strong>Privacy-Minimized Job Review:</strong> No user photos, emails, or personal identifiers are exposed in admin telemetry.
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-canvas-dark/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-charcoal">
                <thead className="bg-canvas-subtle/70 border-b border-canvas-dark/60 text-[11px] font-semibold uppercase text-charcoal-light">
                  <tr>
                    <th className="py-3.5 px-6">Job ID</th>
                    <th className="py-3.5 px-4">Model</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Error Code</th>
                    <th className="py-3.5 px-6">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-canvas-subtle">
                  {adminJobs.length > 0 ? (
                    adminJobs.map((j) => (
                      <tr key={j.id} className="hover:bg-canvas-subtle/30 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-medium text-accent">{j.id}</td>
                        <td className="py-3.5 px-4 font-mono">{j.model_name}</td>
                        <td className="py-3.5 px-4 font-mono text-charcoal-muted">
                          {j.processing_time_ms ? `${(j.processing_time_ms / 1000).toFixed(2)}s` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={j.status === 'completed' ? 'success' : j.status === 'failed' ? 'warning' : 'secondary'}
                            className="text-[10px]"
                          >
                            {j.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-red-600">{j.error_code || '—'}</td>
                        <td className="py-3.5 px-6 text-charcoal-light">
                          {new Date(j.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-charcoal-light">
                        No try-on jobs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-canvas-dark/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal">
              <thead className="bg-canvas-subtle/70 border-b border-canvas-dark/60 text-[11px] font-semibold uppercase text-charcoal-light">
                <tr>
                  <th className="py-3.5 px-6">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Summary</th>
                  <th className="py-3.5 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-canvas-subtle">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas-subtle/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono font-semibold text-charcoal flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-accent" />
                        <span>{log.action}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-charcoal-muted">
                        {log.entity_type}:{log.entity_id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-muted">{log.summary || '—'}</td>
                      <td className="py-3.5 px-6 text-charcoal-light">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-charcoal-light">
                      No administrative audit entries recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Catalog Garment' : 'Add Catalog Garment'}
        description={
          editingProduct
            ? 'Update catalog attributes and pricing.'
            : 'Add a new upper-body top to the VestiAI product inventory.'
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
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
                onChange={(e) => setCategory(e.target.value as GarmentCategory)}
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
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingProduct ? 'Save Changes' : 'Publish Garment'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
