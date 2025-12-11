import React, { useState, useEffect } from 'react'
import { MdClose, MdAdd, MdEdit, MdDelete, MdShoppingCart, MdStorefront, MdInventory, MdSettings, MdImage, MdSubdirectoryArrowRight } from 'react-icons/md'
import { api } from '../services/api'

type TabType = 'products' | 'marketplaces' | 'orders' | 'customers' | 'settings'

interface EcommerceManagerProps {
  isOpen: boolean
  onClose: () => void
  type: 'template' | 'website'
  referenceId: number
}

interface Product {
  id: number
  name: string
  slug: string
  description?: string
  sku?: string
  price: number
  compare_at_price?: number
  stock_quantity: number
  marketplace_id?: number
  marketplace_name?: string
  featured_image?: string
  is_active: boolean
  type: 'physical' | 'digital'
  has_variants: boolean
  variants_count?: number
}

interface Marketplace {
  id: number
  name: string
  slug: string
  description?: string
  parent_id?: number
  products_count?: number
  submarkets_count?: number
  is_active: boolean
}

interface Order {
  id: number
  order_number: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  status: string
  payment_status: string
  total_amount: number
  items_count: number
  created_at: string
}

interface Settings {
  store_name: string
  store_email: string
  currency: string
  currency_symbol: string
  tax_enabled: boolean
  tax_rate: number
  payment_stripe_enabled: boolean
  payment_stripe_publishable_key?: string
  payment_stripe_secret_key?: string
  payment_paypal_enabled: boolean
  payment_paypal_client_id?: string
  payment_paypal_secret?: string
}

const EcommerceManager: React.FC<EcommerceManagerProps> = ({ isOpen, onClose, type, referenceId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    product_type: 'physical' as 'physical' | 'digital',
    price: 0,
    sku: '',
    stock_quantity: 0,
    marketplace_id: undefined as number | undefined,
    is_active: true,
    featured_image: '' as string,
  })

  // Image picker
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [galleryImages, setGalleryImages] = useState<any[]>([])

  // Marketplace modal
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false)
  const [editingMarketplace, setEditingMarketplace] = useState<Marketplace | null>(null)
  const [marketplaceForm, setMarketplaceForm] = useState({
    name: '',
    description: '',
    parent_id: undefined as number | undefined,
    is_active: true,
  })

  useEffect(() => {
    console.log('EcommerceManager useEffect - isOpen:', isOpen, 'activeTab:', activeTab, 'type:', type, 'referenceId:', referenceId)
    if (isOpen) {
      loadData()
    }
  }, [isOpen, activeTab])

  const loadData = async () => {
    console.log('EcommerceManager loadData called - activeTab:', activeTab)
    setLoading(true)
    try {
      if (activeTab === 'products') {
        await Promise.all([loadProducts(), loadMarketplaces()])
      } else if (activeTab === 'marketplaces') {
        await loadMarketplaces()
      } else if (activeTab === 'orders') {
        await loadOrders()
      } else if (activeTab === 'settings') {
        await loadSettings()
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    console.log('EcommerceManager loadProducts called - type:', type, 'referenceId:', referenceId)
    try {
      const response = await api.get('/v1/script-features/ecommerce/products', {
        type, reference_id: referenceId
      })
      console.log('EcommerceManager loadProducts response:', response)
      setProducts(response.data || [])
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadMarketplaces = async () => {
    console.log('EcommerceManager loadMarketplaces called - type:', type, 'referenceId:', referenceId)
    try {
      const response = await api.get('/v1/script-features/ecommerce/marketplaces/all', {
        type, reference_id: referenceId
      })
      console.log('EcommerceManager loadMarketplaces response:', response)
      setMarketplaces(response.data || [])
    } catch (error) {
      console.error('Failed to load marketplaces:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await api.get('/v1/script-features/ecommerce/orders', {
        type, reference_id: referenceId
      })
      setOrders(response.data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await api.get('/v1/script-features/ecommerce/settings', {
        type, reference_id: referenceId
      })
      setSettings(response.data || {})
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadGalleryImages = async () => {
    try {
      const response = await api.get('/v1/script-features/ecommerce/gallery-images', {
        type, reference_id: referenceId
      })
      setGalleryImages(response.data || [])
    } catch (error) {
      console.error('Failed to load gallery images:', error)
    }
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      description: '',
      product_type: 'physical',
      price: 0,
      sku: '',
      stock_quantity: 0,
      marketplace_id: undefined,
      is_active: true,
      featured_image: '',
    })
    loadGalleryImages()
    setShowProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || '',
      product_type: product.type,
      price: product.price,
      sku: product.sku || '',
      stock_quantity: product.stock_quantity,
      marketplace_id: product.marketplace_id,
      is_active: product.is_active,
      featured_image: product.featured_image || '',
    })
    loadGalleryImages()
    setShowProductModal(true)
  }

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await api.put(`/v1/script-features/ecommerce/products/${editingProduct.id}`, {
          ...productForm,
          type,
          reference_id: referenceId,
        })
      } else {
        await api.post('/v1/script-features/ecommerce/products', {
          ...productForm,
          type,
          reference_id: referenceId,
        })
      }
      setShowProductModal(false)
      loadProducts()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product')
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/v1/script-features/ecommerce/products/${id}`, {
        type, reference_id: referenceId
      })
      loadProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const handleCreateMarketplace = (parentId?: number) => {
    setEditingMarketplace(null)
    setMarketplaceForm({
      name: '',
      description: '',
      parent_id: parentId,
      is_active: true,
    })
    setShowMarketplaceModal(true)
  }

  const handleEditMarketplace = (marketplace: Marketplace) => {
    setEditingMarketplace(marketplace)
    setMarketplaceForm({
      name: marketplace.name,
      description: marketplace.description || '',
      parent_id: marketplace.parent_id,
      is_active: marketplace.is_active,
    })
    setShowMarketplaceModal(true)
  }

  const handleSaveMarketplace = async () => {
    try {
      if (editingMarketplace) {
        await api.put(`/v1/script-features/ecommerce/marketplaces/${editingMarketplace.id}`, {
          ...marketplaceForm,
          type,
          reference_id: referenceId,
        })
      } else {
        await api.post('/v1/script-features/ecommerce/marketplaces', {
          ...marketplaceForm,
          type,
          reference_id: referenceId,
        })
      }
      setShowMarketplaceModal(false)
      loadMarketplaces()
    } catch (error) {
      console.error('Failed to save marketplace:', error)
      alert('Failed to save marketplace')
    }
  }

  const handleDeleteMarketplace = async (id: number) => {
    if (!confirm('Are you sure you want to delete this marketplace? Sub-markets will be moved to the parent.')) return

    try {
      await api.delete(`/v1/script-features/ecommerce/marketplaces/${id}`, {
        type, reference_id: referenceId
      })
      loadMarketplaces()
    } catch (error) {
      console.error('Failed to delete marketplace:', error)
      alert('Failed to delete marketplace')
    }
  }

  // Helper to get top-level marketplaces
  const getTopLevelMarketplaces = () => marketplaces.filter(m => !m.parent_id)

  // Helper to get sub-markets for a given marketplace
  const getSubmarkets = (parentId: number) => marketplaces.filter(m => m.parent_id === parentId)

  const handleSaveSettings = async () => {
    if (!settings) return

    try {
      await api.put('/v1/script-features/ecommerce/settings', {
        ...settings,
        type,
        reference_id: referenceId,
      })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MdShoppingCart className="text-3xl text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">E-commerce Manager</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'products'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('marketplaces')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'marketplaces'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Marketplaces
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'customers'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : (
            <>
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Products ({products.length})</h3>
                    <button
                      onClick={handleCreateProduct}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                    >
                      <MdAdd size={18} />
                      Add Product
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <MdShoppingCart className="mx-auto text-6xl text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">No products yet</p>
                      <button
                        onClick={handleCreateProduct}
                        className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Create Your First Product
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marketplace</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {product.featured_image ? (
                                    <img src={product.featured_image} alt="" className="w-10 h-10 rounded object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                      <MdImage className="text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{product.name}</div>
                                    {product.sku && <div className="text-sm text-gray-500">SKU: {product.sku}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {product.marketplace_name || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                ${parseFloat(product.price || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {product.has_variants ? (
                                  <span className="text-gray-500">{product.variants_count} variants</span>
                                ) : (
                                  <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {product.stock_quantity} in stock
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  product.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    <MdEdit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Marketplaces Tab */}
              {activeTab === 'marketplaces' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Marketplaces ({marketplaces.length})</h3>
                    <button
                      onClick={() => handleCreateMarketplace()}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                    >
                      <MdAdd size={18} />
                      Add Marketplace
                    </button>
                  </div>

                  {marketplaces.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <MdStorefront className="mx-auto text-6xl text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">No marketplaces yet</p>
                      <p className="text-sm text-gray-400 mb-4">Create marketplaces to organize your products. You can also create sub-markets within each marketplace.</p>
                      <button
                        onClick={() => handleCreateMarketplace()}
                        className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Create Your First Marketplace
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getTopLevelMarketplaces().map((marketplace) => (
                        <div key={marketplace.id} className="bg-white border rounded-lg overflow-hidden">
                          {/* Marketplace Header */}
                          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MdStorefront className="text-2xl text-purple-600" />
                              <div>
                                <h4 className="font-semibold text-gray-900">{marketplace.name}</h4>
                                <div className="text-sm text-gray-500">
                                  {marketplace.products_count || 0} products · {marketplace.submarkets_count || 0} sub-markets
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCreateMarketplace(marketplace.id)}
                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
                              >
                                <MdSubdirectoryArrowRight size={16} />
                                Add Sub-market
                              </button>
                              <button
                                onClick={() => handleEditMarketplace(marketplace)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <MdEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteMarketplace(marketplace.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Sub-markets */}
                          {getSubmarkets(marketplace.id).length > 0 && (
                            <div className="divide-y divide-gray-100">
                              {getSubmarkets(marketplace.id).map((submarket) => (
                                <div key={submarket.id} className="p-4 pl-12 flex items-center justify-between hover:bg-gray-50">
                                  <div className="flex items-center gap-3">
                                    <MdSubdirectoryArrowRight className="text-gray-400" />
                                    <div>
                                      <h5 className="font-medium text-gray-800">{submarket.name}</h5>
                                      <div className="text-sm text-gray-500">{submarket.products_count || 0} products</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${submarket.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                      {submarket.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                      onClick={() => handleEditMarketplace(submarket)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                      <MdEdit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMarketplace(submarket.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <MdDelete size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Marketplace Description (if any) */}
                          {marketplace.description && (
                            <div className="p-4 text-sm text-gray-600 border-t">
                              {marketplace.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Orders ({orders.length})</h3>

                  {orders.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <MdInventory className="mx-auto text-6xl text-gray-300 mb-4" />
                      <p className="text-gray-500">No orders yet</p>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{order.order_number}</div>
                                <div className="text-sm text-gray-500">{order.items_count} items</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-900">
                                  {order.customer_first_name} {order.customer_last_name}
                                </div>
                                <div className="text-sm text-gray-500">{order.customer_email}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                ${parseFloat(order.total_amount || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && settings && (
                <div className="space-y-6 max-w-2xl">
                  <h3 className="text-lg font-semibold">Store Settings</h3>

                  {/* Store Info */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Store Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                      <input
                        type="text"
                        value={settings.store_name}
                        onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
                      <input
                        type="email"
                        value={settings.store_email}
                        onChange={(e) => setSettings({...settings, store_email: e.target.value})}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Currency</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                        <input
                          type="text"
                          value={settings.currency}
                          onChange={(e) => setSettings({...settings, currency: e.target.value})}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                          placeholder="USD"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                        <input
                          type="text"
                          value={settings.currency_symbol}
                          onChange={(e) => setSettings({...settings, currency_symbol: e.target.value})}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                          placeholder="$"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Tax Settings</h4>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.tax_enabled}
                        onChange={(e) => setSettings({...settings, tax_enabled: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Enable Tax</span>
                    </label>
                    {settings.tax_enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          value={settings.tax_rate}
                          onChange={(e) => setSettings({...settings, tax_rate: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Payment Methods</h4>

                    {/* Stripe */}
                    <div className="border rounded p-4 space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings?.payment_stripe_enabled || false}
                          onChange={(e) => setSettings({...settings, payment_stripe_enabled: e.target.checked})}
                          className="rounded"
                        />
                        <span className="font-medium text-gray-900">Stripe</span>
                      </label>
                      {settings.payment_stripe_enabled && (
                        <div className="space-y-3 pl-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                            <input
                              type="text"
                              value={settings.payment_stripe_publishable_key || ''}
                              onChange={(e) => setSettings({...settings, payment_stripe_publishable_key: e.target.value})}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                              placeholder="pk_..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                            <input
                              type="password"
                              value={settings.payment_stripe_secret_key || ''}
                              onChange={(e) => setSettings({...settings, payment_stripe_secret_key: e.target.value})}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                              placeholder="sk_..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PayPal */}
                    <div className="border rounded p-4 space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.payment_paypal_enabled}
                          onChange={(e) => setSettings({...settings, payment_paypal_enabled: e.target.checked})}
                          className="rounded"
                        />
                        <span className="font-medium text-gray-900">PayPal</span>
                      </label>
                      {settings.payment_paypal_enabled && (
                        <div className="space-y-3 pl-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                            <input
                              type="text"
                              value={settings.payment_paypal_client_id || ''}
                              onChange={(e) => setSettings({...settings, payment_paypal_client_id: e.target.value})}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secret</label>
                            <input
                              type="password"
                              value={settings.payment_paypal_secret || ''}
                              onChange={(e) => setSettings({...settings, payment_paypal_secret: e.target.value})}
                              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
                  >
                    Save Settings
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({...productForm, stock_quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace</label>
                  <select
                    value={productForm.marketplace_id || ''}
                    onChange={(e) => setProductForm({...productForm, marketplace_id: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No Marketplace</option>
                    {marketplaces.map((m) => (
                      <option key={m.id} value={m.id}>{m.parent_id ? '— ' : ''}{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <select
                  value={productForm.product_type}
                  onChange={(e) => setProductForm({...productForm, product_type: e.target.value as 'physical' | 'digital'})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                >
                  <option value="physical">Physical Product</option>
                  <option value="digital">Digital Product</option>
                </select>
              </div>

              {/* Featured Image Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <div className="flex items-start gap-4">
                  {productForm.featured_image ? (
                    <div className="relative">
                      <img
                        src={productForm.featured_image}
                        alt="Product"
                        className="w-24 h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm({...productForm, featured_image: ''})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                      >
                        <MdClose size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <MdImage size={32} />
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(true)}
                      className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 mb-2"
                    >
                      Choose from Gallery
                    </button>
                    <div className="text-xs text-gray-500">
                      Or enter URL directly:
                    </div>
                    <input
                      type="text"
                      value={productForm.featured_image}
                      onChange={(e) => setProductForm({...productForm, featured_image: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                      className="w-full mt-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm({...productForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Product is active</span>
              </label>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {editingProduct ? 'Update' : 'Create'} Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Modal */}
      {showMarketplaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingMarketplace ? 'Edit' : 'Add'} {marketplaceForm.parent_id ? 'Sub-market' : 'Marketplace'}
              </h3>
              <button onClick={() => setShowMarketplaceModal(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {marketplaceForm.parent_id ? 'Sub-market' : 'Marketplace'} Name *
                </label>
                <input
                  type="text"
                  value={marketplaceForm.name}
                  onChange={(e) => setMarketplaceForm({...marketplaceForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  placeholder={marketplaceForm.parent_id ? 'e.g., Winter Collection' : 'e.g., Fashion Store'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={marketplaceForm.description}
                  onChange={(e) => setMarketplaceForm({...marketplaceForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              {!marketplaceForm.parent_id && !editingMarketplace && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Marketplace (optional)</label>
                  <select
                    value={marketplaceForm.parent_id || ''}
                    onChange={(e) => setMarketplaceForm({...marketplaceForm, parent_id: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">None (Top-level Marketplace)</option>
                    {getTopLevelMarketplaces().map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={marketplaceForm.is_active}
                  onChange={(e) => setMarketplaceForm({...marketplaceForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowMarketplaceModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMarketplace}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {editingMarketplace ? 'Update' : 'Create'} {marketplaceForm.parent_id ? 'Sub-market' : 'Marketplace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowImagePicker(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Choose Image from Gallery</h3>
              <button onClick={() => setShowImagePicker(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {galleryImages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MdImage size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No images in gallery yet.</p>
                  <p className="text-sm">Upload images in the Image Gallery manager first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImages.map((image) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        // Use the full path for the image
                        const imageUrl = image.path.startsWith('http')
                          ? image.path
                          : `${window.location.origin}/storage/${image.path}`
                        setProductForm({...productForm, featured_image: imageUrl})
                        setShowImagePicker(false)
                      }}
                      className="aspect-square rounded border-2 border-transparent hover:border-purple-500 overflow-hidden"
                    >
                      <img
                        src={image.thumbnail_path
                          ? (image.thumbnail_path.startsWith('http') ? image.thumbnail_path : `${window.location.origin}/storage/${image.thumbnail_path}`)
                          : (image.path.startsWith('http') ? image.path : `${window.location.origin}/storage/${image.path}`)
                        }
                        alt={image.title || image.filename}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EcommerceManager
