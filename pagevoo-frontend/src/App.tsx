import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { api, type ApiResponse } from '@/services/api'

export default function App() {
  const [apiStatus, setApiStatus] = useState<string>('Not tested')
  const [isLoading, setIsLoading] = useState(false)

  const testApiConnection = async () => {
    setIsLoading(true)
    setApiStatus('Testing...')

    try {
      const response: ApiResponse = await api.healthCheck()
      if (response.success) {
        setApiStatus(`✓ Connected - ${response.message}`)
      } else {
        setApiStatus('✗ Failed - API returned error')
      }
    } catch (error) {
      setApiStatus('✗ Failed - Unable to connect to API')
      console.error('API connection error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center space-y-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Pagevoo</h1>
        <p className="text-gray-400">Website Builder Platform</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4 min-w-96">
        <h2 className="text-xl font-semibold text-white">API Connection Test</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Status:</p>
          <p className="text-white font-mono">{apiStatus}</p>
        </div>
        <Button
          onClick={testApiConnection}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test API Connection'}
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  )
}
