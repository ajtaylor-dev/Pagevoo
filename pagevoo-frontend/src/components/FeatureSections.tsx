export default function FeatureSections() {
  return (
    <>
      {/* What is Pagevoo Section */}
      <section className="bg-[#4b4b4b] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-4 text-[#98b290]">What is Pagevoo?</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                Pagevoo is a turnkey business solution platform designed for local businesses.
                No coding, no complexity — just ready-to-launch websites tailored to your industry.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Whether you run a restaurant, barbershop, or pizza shop, we provide everything
                you need: online ordering, booking systems, galleries, and more — all built-in from day one.
              </p>
            </div>
            <div className="bg-[#3a3a3a] rounded-lg p-8 h-64 flex items-center justify-center">
              <p className="text-gray-400 text-center">Feature Image Placeholder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="bg-[#98b290] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-[#88a280] rounded-lg p-8 h-64 flex items-center justify-center">
              <p className="text-[#4b4b4b] text-center font-semibold">Platform Demo Placeholder</p>
            </div>
            <div className="text-white">
              <h2 className="text-5xl font-bold text-[#4b4b4b] mb-6">Everything Included</h2>
              <p className="text-white text-lg leading-relaxed mb-6">
                Your business deserves more than just a website. Get a complete online presence
                with all the tools you need to grow and manage your business — no additional setup required.
              </p>
              <ul className="space-y-3 text-white">
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">✓</span>
                  <span>Industry-specific templates ready to launch</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">✓</span>
                  <span>Booking & reservation systems built-in</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">✓</span>
                  <span>Online ordering & payment processing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">✓</span>
                  <span>Customer management & communication tools</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="bg-[#4b4b4b] py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#98b290] mb-6">
            Ready to launch your business online?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Everything you need to run your online presence with booking, ordering,
            and customer management — all in one place.
          </p>
          <button className="bg-[#98b290] hover:bg-[#88a280] text-white px-8 py-3 rounded-lg text-lg font-semibold transition">
            Get Started Today
          </button>
        </div>
      </section>
    </>
  )
}
