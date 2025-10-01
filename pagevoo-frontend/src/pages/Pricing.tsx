export default function Pricing() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-[#4b4b4b] mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Choose the plan that fits your business
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {/* Placeholder for pricing tiers */}
          <div className="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition">
            <h3 className="text-2xl font-bold text-[#4b4b4b] mb-4">Brochure</h3>
            <p className="text-4xl font-bold text-[#98b290] mb-6">£19<span className="text-lg text-gray-600">/mo</span></p>
            <p className="text-gray-600">Perfect for small businesses getting started</p>
          </div>

          <div className="border-2 border-[#98b290] rounded-lg p-8 shadow-lg transform scale-105">
            <h3 className="text-2xl font-bold text-[#4b4b4b] mb-4">Niche</h3>
            <p className="text-4xl font-bold text-[#98b290] mb-6">£39<span className="text-lg text-gray-600">/mo</span></p>
            <p className="text-gray-600">Most popular for growing businesses</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-8 hover:shadow-lg transition">
            <h3 className="text-2xl font-bold text-[#4b4b4b] mb-4">Pro</h3>
            <p className="text-4xl font-bold text-[#98b290] mb-6">£59<span className="text-lg text-gray-600">/mo</span></p>
            <p className="text-gray-600">For established businesses with high volume</p>
          </div>
        </div>
      </div>
    </div>
  )
}
