import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center space-x-4">
      <h1 className="text-3xl font-bold text-white">Pagevoo</h1>
      <Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

    </div>
  )
}
