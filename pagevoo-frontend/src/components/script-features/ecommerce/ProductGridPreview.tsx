import React from 'react'
import { MdShoppingCart, MdImage } from 'react-icons/md'

interface ProductGridPreviewProps {
  content: {
    ecommerceConfig?: {
      layout?: 'grid' | 'list'
      columns?: number
      showPrice?: boolean
      showAddToCart?: boolean
      showCategory?: boolean
      primaryColor?: string
    }
    title?: string
    subtitle?: string
  }
  css?: any
  products?: any[]
}

const ProductGridPreview: React.FC<ProductGridPreviewProps> = ({ content, css, products }) => {
  const config = content.ecommerceConfig || {
    layout: 'grid',
    columns: 3,
    showPrice: true,
    showAddToCart: true,
    showCategory: true,
    primaryColor: '#8B5CF6',
  }

  // Sample products for preview
  const sampleProducts = products && products.length > 0 ? products : [
    {
      id: 1,
      name: 'Premium Wireless Headphones',
      price: 299.99,
      category_name: 'Electronics',
      featured_image: null,
      stock_quantity: 15,
    },
    {
      id: 2,
      name: 'Organic Cotton T-Shirt',
      price: 29.99,
      category_name: 'Clothing',
      featured_image: null,
      stock_quantity: 50,
    },
    {
      id: 3,
      name: 'Stainless Steel Water Bottle',
      price: 24.99,
      category_name: 'Accessories',
      featured_image: null,
      stock_quantity: 30,
    },
    {
      id: 4,
      name: 'Leather Backpack',
      price: 89.99,
      category_name: 'Bags',
      featured_image: null,
      stock_quantity: 12,
    },
    {
      id: 5,
      name: 'Smart Watch',
      price: 199.99,
      category_name: 'Electronics',
      featured_image: null,
      stock_quantity: 8,
    },
    {
      id: 6,
      name: 'Yoga Mat',
      price: 34.99,
      category_name: 'Fitness',
      featured_image: null,
      stock_quantity: 25,
    },
  ]

  const displayProducts = sampleProducts.slice(0, config.columns * 2)

  return (
    <div className="py-12 px-4" style={css}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(content.title || content.subtitle) && (
          <div className="text-center mb-12">
            {content.title && (
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h2>
            )}
            {content.subtitle && (
              <p className="text-lg text-gray-600">{content.subtitle}</p>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div
          className={`grid gap-6 ${
            config.layout === 'list'
              ? 'grid-cols-1'
              : `grid-cols-1 sm:grid-cols-2 md:grid-cols-${config.columns}`
          }`}
        >
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                config.layout === 'list' ? 'flex' : ''
              }`}
            >
              {/* Product Image */}
              <div
                className={`bg-gray-200 flex items-center justify-center ${
                  config.layout === 'list' ? 'w-48 h-48' : 'w-full h-64'
                }`}
              >
                {product.featured_image ? (
                  <img
                    src={product.featured_image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <MdImage className="text-gray-400 text-6xl" />
                )}
              </div>

              {/* Product Info */}
              <div className={`p-4 ${config.layout === 'list' ? 'flex-1' : ''}`}>
                {config.showCategory && product.category_name && (
                  <div className="text-sm text-gray-500 mb-2">{product.category_name}</div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>

                {config.showPrice && (
                  <div className="text-2xl font-bold mb-4" style={{ color: config.primaryColor }}>
                    ${product.price.toFixed(2)}
                  </div>
                )}

                {product.stock_quantity <= 0 && (
                  <div className="text-red-600 text-sm font-medium mb-2">Out of Stock</div>
                )}

                {config.showAddToCart && (
                  <button
                    className="w-full py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: config.primaryColor }}
                    disabled={product.stock_quantity <= 0}
                  >
                    <MdShoppingCart size={20} />
                    {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {displayProducts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MdShoppingCart className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">No products to display</p>
            <p className="text-gray-400 text-sm">
              Install the E-commerce feature and add products to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductGridPreview
