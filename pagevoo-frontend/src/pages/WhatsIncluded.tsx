export default function WhatsIncluded() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-[#4b4b4b] mb-4">
          What's Included
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Everything your business needs, already built-in
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { title: 'Booking System', desc: 'Let customers schedule appointments online' },
            { title: 'Online Ordering', desc: 'Accept orders and payments directly' },
            { title: 'Content Management', desc: 'Easy-to-use CMS for updates' },
            { title: 'Photo Galleries', desc: 'Showcase your work beautifully' },
            { title: 'Customer Management', desc: 'Track and engage with customers' },
            { title: 'Blog & Forums', desc: 'Build community around your business' },
          ].map((feature) => (
            <div key={feature.title} className="border-l-4 border-[#98b290] pl-6 py-4">
              <h3 className="text-2xl font-bold text-[#4b4b4b] mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
