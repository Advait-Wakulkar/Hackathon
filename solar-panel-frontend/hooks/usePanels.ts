import { useState, useEffect } from 'react'
import { getPanels } from '@/lib/api'

export function usePanels() {
  const [panels, setPanels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPanels = async () => {
    try {
      setLoading(true)
      const data = await getPanels()
      setPanels(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch panels')
      console.error('Error fetching panels:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPanels()
  }, [])

  return {
    panels,
    loading,
    error,
    refetch: fetchPanels
  }
}