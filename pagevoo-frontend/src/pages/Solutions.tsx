export default function Solutions() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-[#4b4b4b] mb-4">
          Industry Solutions
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Ready-to-launch websites tailored for your industry
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Placeholder for industry solutions */}
          {['Restaurants', 'Barbershops', 'Pizza Shops', 'Cafes', 'Gyms', 'Salons'].map((industry) => (
            <div key={industry} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-2xl font-bold text-[#98b290] mb-2">{industry}</h3>
              <p className="text-gray-600">Everything your {industry.toLowerCase()} needs, ready to go.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
