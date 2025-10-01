export default function FeatureSections() {
  return (
    <>
      {/* What is Pagevoo Section */}
      <section className="bg-[#4b4b4b] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-4 text-[#98b290]">What is Pagevoo?</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Pagevoo is a website builder designed to speed up the
                process of modern website development. From HTML to coding
                and everything in between, we simplify creating professional,
                functional websites for niche local businesses like restaurants,
                barbers, and pizza shops.
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
              <h2 className="text-5xl font-bold text-[#4b4b4b] mb-6">PLATFORM 1.0</h2>
              <p className="text-white text-lg leading-relaxed mb-6">
                We have developed our very own PLATFORM engine packed full of excellent
                features to make modern standards of site building and working across all platforms
                a seamless experience.
              </p>
              <ul className="space-y-3 text-white">
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">•</span>
                  <span>Pre-built templates for local businesses</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">•</span>
                  <span>Integrated booking and reservation systems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">•</span>
                  <span>Built-in CMS for easy content management</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#4b4b4b] mr-2">•</span>
                  <span>Online shop, forums, blogs, and galleries</span>
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
            Ready to build your website?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using Pagevoo to create stunning,
            functional websites without the complexity.
          </p>
          <button className="bg-[#98b290] hover:bg-[#88a280] text-white px-8 py-3 rounded-lg text-lg font-semibold transition">
            Get Started Free
          </button>
        </div>
      </section>
    </>
  )
}
