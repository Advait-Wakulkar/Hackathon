import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Droplets } from 'lucide-react'
import { cleanPanel } from '@/lib/api'
import toast from 'react-hot-toast'

interface Panel {
  panel_id: string
  current_efficiency: number
  dust_level: number
  voltage: number
  needs_cleaning: boolean
  zone?: string
  sector_id?: string
}

interface PanelGridProps {
  panels: Panel[]
  wsData: any
  onSelectPanel: (panelId: string) => void
  selectedPanel: string | null
  onPanelCleaned?: () => void
}

export default function PanelGrid({ panels, wsData, onSelectPanel, selectedPanel, onPanelCleaned }: PanelGridProps) {
  const [cleaningPanels, setCleaningPanels] = useState<Set<string>>(new Set())
  const [localPanels, setLocalPanels] = useState<Panel[]>(panels)
  const [cleanedPanels, setCleanedPanels] = useState<Set<string>>(new Set())

  // Update local panels when props change
  useEffect(() => {
    setLocalPanels(panels)
  }, [panels])

  // Update panels with WebSocket data
  useEffect(() => {
    if (wsData?.sample_panels) {
      setLocalPanels(prevPanels => 
        prevPanels.map(panel => {
          const wsPanel = wsData.sample_panels.find((p: any) => p.id === panel.panel_id)
          if (wsPanel && !cleanedPanels.has(panel.panel_id)) {
            return {
              ...panel,
              current_efficiency: wsPanel.efficiency,
              dust_level: wsPanel.dust_level,
              voltage: wsPanel.voltage,
              needs_cleaning: wsPanel.dust_level > 300 || wsPanel.efficiency < 85
            }
          }
          return panel
        })
      )
    }
  }, [wsData, cleanedPanels])

  const handleClean = async (panelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCleaningPanels(prev => new Set(prev).add(panelId))
    
    try {
      const result = await cleanPanel(panelId)
      toast.success(`Cleaning initiated for ${panelId}`)
      
      // Update local state immediately
      setLocalPanels(prevPanels =>
        prevPanels.map(panel =>
          panel.panel_id === panelId
            ? {
                ...panel,
                dust_level: result.new_dust_level || 100,
                current_efficiency: result.new_efficiency || 95,
                voltage: 19.5 * ((result.new_efficiency || 95) / 100),
                needs_cleaning: false
              }
            : panel
        )
      )
      
      // Mark as cleaned to prevent WebSocket updates from overriding
      setCleanedPanels(prev => new Set(prev).add(panelId))
      
      // Simulate cleaning animation
      setTimeout(() => {
        setCleaningPanels(prev => {
          const next = new Set(prev)
          next.delete(panelId)
          return next
        })
        toast.success(`${panelId} cleaning completed!`)
        
        // Allow WebSocket updates again after 10 seconds
        setTimeout(() => {
          setCleanedPanels(prev => {
            const next = new Set(prev)
            next.delete(panelId)
            return next
          })
        }, 10000)
      }, 2000)
      
      // Refresh parent data if callback provided
      if (onPanelCleaned) {
        setTimeout(onPanelCleaned, 2500)
      }
    } catch (error) {
      console.error('Cleaning error:', error)
      toast.error('Failed to initiate cleaning')
      setCleaningPanels(prev => {
        const next = new Set(prev)
        next.delete(panelId)
        return next
      })
    }
  }

  const getPanelColor = (panel: Panel) => {
    const panelId = panel.panel_id
    const efficiency = panel.current_efficiency
    const dustLevel = panel.dust_level
    
    if (cleaningPanels.has(panelId)) {
      return 'bg-blue-100 border-blue-500 animate-pulse'
    }
    
    if (cleanedPanels.has(panelId)) {
      return 'bg-green-100 border-green-500'
    }
    
    if (efficiency < 80 || dustLevel > 400) {
      return 'bg-red-100 border-red-500'
    }
    
    if (efficiency < 85 || dustLevel > 300) {
      return 'bg-yellow-100 border-yellow-500'
    }
    
    return 'bg-green-100 border-green-500'
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600'
    if (efficiency >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDustColor = (dustLevel: number) => {
    if (dustLevel > 400) return 'text-red-600'
    if (dustLevel > 300) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {localPanels.map((panel) => {
        const isSelected = selectedPanel === panel.panel_id
        const isCleaning = cleaningPanels.has(panel.panel_id)
        const needsCleaning = panel.needs_cleaning && !cleanedPanels.has(panel.panel_id)
        
        return (
          <div
            key={panel.panel_id}
            onClick={() => onSelectPanel(panel.panel_id)}
            className={`
              relative p-3 rounded-lg border-2 cursor-pointer transition-all
              ${getPanelColor(panel)}
              ${isSelected ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'hover:shadow-md hover:scale-102'}
            `}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 text-sm">{panel.panel_id}</h3>
              {needsCleaning ? (
                <AlertTriangle className="text-orange-500" size={16} />
              ) : (
                <CheckCircle className="text-green-500" size={16} />
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Eff:</span>
                <span className={`font-medium ${getEfficiencyColor(panel.current_efficiency)}`}>
                  {panel.current_efficiency.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dust:</span>
                <span className={`font-medium ${getDustColor(panel.dust_level)}`}>
                  {Math.round(panel.dust_level)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">V:</span>
                <span className="font-medium">{panel.voltage.toFixed(1)}V</span>
              </div>
            </div>

            {/* Sector Badge */}
            {panel.sector_id && (
              <div className="absolute top-1 right-1">
                <span className="text-xs bg-gray-200 text-gray-700 px-1 py-0.5 rounded">
                  {panel.sector_id}
                </span>
              </div>
            )}

            {/* Cleaning Button */}
            {needsCleaning && !isCleaning && (
              <button
                onClick={(e) => handleClean(panel.panel_id, e)}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <Droplets size={12} />
                Clean
              </button>
            )}

            {/* Cleaning Status */}
            {isCleaning && (
              <div className="mt-2 w-full bg-blue-100 text-blue-700 text-xs py-1 px-2 rounded text-center">
                <span className="flex items-center justify-center gap-1">
                  <Droplets size={12} className="animate-bounce" />
                  Cleaning...
                </span>
              </div>
            )}

            {/* Recently Cleaned */}
            {cleanedPanels.has(panel.panel_id) && !isCleaning && (
              <div className="mt-2 w-full bg-green-100 text-green-700 text-xs py-1 px-2 rounded text-center">
                <span className="flex items-center justify-center gap-1">
                  <CheckCircle size={12} />
                  Clean
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}