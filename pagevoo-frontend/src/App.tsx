import Header from '@/components/Header'
import Hero from '@/components/Hero'
import FeatureSections from '@/components/FeatureSections'
import Footer from '@/components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-[72px]">
        <Hero />
        <FeatureSections />
      </div>
      <Footer />
    </div>
  )
}
