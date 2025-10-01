export default function Support() {
  return (
    <div className="min-h-screen bg-white py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-[#4b4b4b] mb-4">
          Support & Help
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          We're here to help you succeed
        </p>

        <div className="space-y-8">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-[#4b4b4b] mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">Get in touch with our support team</p>
            <a href="mailto:support@pagevoo.com" className="text-[#98b290] hover:text-[#88a280] font-medium">
              support@pagevoo.com
            </a>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-[#4b4b4b] mb-4">Documentation</h2>
            <p className="text-gray-600">Step-by-step guides to help you get the most out of Pagevoo</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-[#4b4b4b] mb-4">Video Tutorials</h2>
            <p className="text-gray-600">Watch our video guides to learn how to use Pagevoo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
