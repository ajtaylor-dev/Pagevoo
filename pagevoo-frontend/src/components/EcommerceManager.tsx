import React, { useState, useEffect } from 'react'
import { MdClose, MdAdd, MdEdit, MdDelete, MdShoppingCart, MdCategory, MdInventory, MdSettings, MdImage } from 'react-icons/md'
import { api } from '../services/api'

type TabType = 'products' | 'orders' | 'customers' | 'settings'

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
  sku?: string
  price: number
  compare_at_price?: number
  stock_quantity: number
  category_id?: number
  category_name?: string
  featured_image?: string
  is_active: boolean
  type: 'physical' | 'digital'
  has_variants: boolean
  variants_count?: number
}

interface Category {
  id: number
  name: string
  slug: string
  description?: string
  products_count?: number
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
  const [categories, setCategories] = useState<Category[]>([])
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
    category_id: undefined as number | undefined,
    is_active: true,
  })

  // Category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'products') {
        await Promise.all([loadProducts(), loadCategories()])
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
    try {
      const response = await api.get('/v1/script-features/ecommerce/products', {
        type, reference_id: referenceId
      })
      setProducts(response.data.data || [])
    } catch (error) {
      console.error('Failed to load products:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await api.get('/v1/script-features/ecommerce/categories/all', {
        type, reference_id: referenceId
      })
      setCategories(response.data.data || [])
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const response = await api.get('/v1/script-features/ecommerce/orders', {
        type, reference_id: referenceId
      })
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await api.get('/v1/script-features/ecommerce/settings', {
        type, reference_id: referenceId
      })
      setSettings(response.data.data || {})
    } catch (error) {
      console.error('Failed to load settings:', error)
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
      category_id: undefined,
      is_active: true,
    })
    setShowProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: '',
      product_type: product.type,
      price: product.price,
      sku: product.sku || '',
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      is_active: product.is_active,
    })
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

  const handleCreateCategory = () => {
    setCategoryForm({
      name: '',
      description: '',
      is_active: true,
    })
    setShowCategoryModal(true)
  }

  const handleSaveCategory = async () => {
    try {
      await api.post('/v1/script-features/ecommerce/categories', {
        ...categoryForm,
        type,
        reference_id: referenceId,
      })
      setShowCategoryModal(false)
      loadCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    }
  }

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
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateCategory}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                      >
                        <MdCategory size={18} />
                        Add Category
                      </button>
                      <button
                        onClick={handleCreateProduct}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                      >
                        <MdAdd size={18} />
                        Add Product
                      </button>
                    </div>
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
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
                                {product.category_name || '—'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                ${product.price.toFixed(2)}
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
                                ${order.total_amount.toFixed(2)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.category_id || ''}
                    onChange={(e) => setProductForm({...productForm, category_id: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
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

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold">Add Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EcommerceManager
