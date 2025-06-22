import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Droplets, Zap, TrendingUp, Sparkles } from 'lucide-react'
import { getSectors, cleanSector, predictSectorCleaning } from '@/lib/api'
import toast from 'react-hot-toast'

interface Sector {
  sector_id: string
  row: number
  col: number
  panel_count: number
  average_efficiency: number
  panels_needing_cleaning?: number
  total_power_output?: number
}

interface SectorMapProps {
  onSelectSector: (sectorId: string) => void
  selectedSector: string | null
  wsData: any
}

export default function SectorMap({ onSelectSector, selectedSector, wsData }: SectorMapProps) {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [cleaningSectors, setCleaningSectors] = useState<Set<string>>(new Set())
  const [hoveredSector, setHoveredSector] = useState<string | null>(null)
  const [aiPrediction, setAiPrediction] = useState<any>(null)

  useEffect(() => {
    fetchSectors()
  }, [])

  useEffect(() => {
    // Update sectors with real-time data
    if (wsData?.sector_summaries) {
      setSectors(prev => {
        const updated = [...prev]
        wsData.sector_summaries.forEach((summary: any) => {
          const index = updated.findIndex(s => s.sector_id === summary.sector_id)
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              average_efficiency: summary.efficiency,
              panels_needing_cleaning: summary.panels_needing_cleaning
            }
          }
        })
        return updated
      })
    }
  }, [wsData])

  const fetchSectors = async () => {
    try {
      setLoading(true)
      const data = await getSectors()
      setSectors(data)
    } catch (error) {
      console.error('Failed to fetch sectors:', error)
      toast.error('Failed to load sector data')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanSector = async (sectorId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCleaningSectors(prev => new Set(prev).add(sectorId))
    
    try {
      const result = await cleanSector(sectorId)
      toast.success(`Cleaned ${result.panels_cleaned} panels in sector ${sectorId}`)
      
      // Update sector data
      setSectors(prev => prev.map(s => 
        s.sector_id === sectorId 
          ? { ...s, average_efficiency: 95, panels_needing_cleaning: 0 }
          : s
      ))
      
      setTimeout(() => {
        setCleaningSectors(prev => {
          const next = new Set(prev)
          next.delete(sectorId)
          return next
        })
      }, 2000)
    } catch (error) {
      toast.error('Failed to clean sector')
      setCleaningSectors(prev => {
        const next = new Set(prev)
        next.delete(sectorId)
        return next
      })
    }
  }

  const handleSectorHover = async (sectorId: string) => {
    setHoveredSector(sectorId)
    if (sectorId && !aiPrediction || aiPrediction?.sector_id !== sectorId) {
      try {
        const prediction = await predictSectorCleaning(sectorId)
        setAiPrediction(prediction)
      } catch (error) {
        console.error('Failed to get AI prediction:', error)
      }
    }
  }

  const getSectorColor = (sector: Sector) => {
    if (cleaningSectors.has(sector.sector_id)) return 'bg-blue-500'
    
    const efficiency = sector.average_efficiency || 90
    const needsCleaning = sector.panels_needing_cleaning || 0
    const cleaningPercentage = sector.panel_count > 0 ? (needsCleaning / sector.panel_count) * 100 : 0
    
    // More realistic thresholds for a solar farm
    if (efficiency < 75 || cleaningPercentage > 60) return 'bg-red-500'      // Critical
    if (efficiency < 82 || cleaningPercentage > 40) return 'bg-orange-500'   // Needs attention
    if (efficiency < 88 || cleaningPercentage > 20) return 'bg-yellow-500'   // Fair
    return 'bg-green-500'  // Good
  }

  const createSectorGrid = () => {
    const grid = Array(9).fill(null).map(() => Array(9).fill(null))
    sectors.forEach(sector => {
      if (sector.row < 9 && sector.col < 9) {
        grid[sector.row][sector.col] = sector
      }
    })
    return grid
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const sectorGrid = createSectorGrid()

  return (
    <div className="space-y-4">
      {/* Map Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Excellent (88%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Good (82-88%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Fair (75-82%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Critical (0-75%)</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          10km × 10km Solar Farm • 2,700 Panels • 81 Sectors
        </div>
      </div>

      {/* Sector Grid */}
      <div className="relative">
        <div className="grid grid-cols-9 gap-1 p-4 bg-gray-100 rounded-lg">
          {sectorGrid.map((row, rowIndex) => (
            row.map((sector, colIndex) => {
              if (!sector) return <div key={`${rowIndex}-${colIndex}`} className="w-full h-full"></div>
              
              const isSelected = selectedSector === sector.sector_id
              const isHovered = hoveredSector === sector.sector_id
              const isCleaning = cleaningSectors.has(sector.sector_id)
              
              return (
                <div
                  key={sector.sector_id}
                  onClick={() => onSelectSector(sector.sector_id)}
                  onMouseEnter={() => handleSectorHover(sector.sector_id)}
                  onMouseLeave={() => setHoveredSector(null)}
                  className={`
                    relative aspect-square rounded cursor-pointer transition-all
                    ${getSectorColor(sector)}
                    ${isSelected ? 'ring-4 ring-white shadow-lg scale-110 z-10' : 'hover:scale-105'}
                    ${isCleaning ? 'animate-pulse' : ''}
                  `}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-1">
                    <span className="font-bold text-xs">{sector.sector_id}</span>
                    <span className="text-xs opacity-90">{sector.average_efficiency?.toFixed(0)}%</span>
                    {sector.panels_needing_cleaning && sector.panels_needing_cleaning > 10 && (
                      <AlertTriangle size={12} className="mt-1" />
                    )}
                  </div>
                </div>
              )
            })
          ))}
        </div>

        {/* Row Labels */}
        <div className="absolute left-0 top-4 flex flex-col gap-1 h-full">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((letter, index) => (
            <div key={letter} className="flex-1 flex items-center justify-center text-sm font-semibold text-gray-600 pr-2">
              {letter}
            </div>
          ))}
        </div>

        {/* Column Labels */}
        <div className="absolute top-0 left-4 flex gap-1 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <div key={num} className="flex-1 flex items-center justify-center text-sm font-semibold text-gray-600 pb-2">
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Hover Information Panel */}
      {hoveredSector && aiPrediction && (
        <div className="absolute z-20 bg-white rounded-lg shadow-xl p-4 max-w-sm" 
             style={{ 
               position: 'fixed',
               bottom: '20px',
               right: '20px'
             }}>
          <h4 className="font-semibold text-lg mb-2">Sector {hoveredSector}</h4>
          
          {/* Sector Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <span className="text-gray-600">Panels:</span>
              <span className="ml-2 font-medium">{sectors.find(s => s.sector_id === hoveredSector)?.panel_count}</span>
            </div>
            <div>
              <span className="text-gray-600">Efficiency:</span>
              <span className="ml-2 font-medium">{sectors.find(s => s.sector_id === hoveredSector)?.average_efficiency?.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-600">Need Cleaning:</span>
              <span className="ml-2 font-medium">{aiPrediction.panels_needing_cleaning}</span>
            </div>
            <div>
              <span className="text-gray-600">Water Needed:</span>
              <span className="ml-2 font-medium">{aiPrediction.estimated_water_usage}L</span>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="border-t pt-2">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
              <Sparkles size={14} className="text-purple-500" />
              AI Recommendation
            </p>
            <p className="text-sm text-gray-600">{aiPrediction.recommendation}</p>
          </div>

          {/* ROI Analysis */}
          {aiPrediction.roi_analysis && (
            <div className="mt-2 text-xs">
              <p className="text-green-600">
                Net Benefit: ${aiPrediction.roi_analysis.net_benefit}
              </p>
            </div>
          )}

          {/* Clean Button */}
          {aiPrediction.should_clean && (
            <button
              onClick={(e) => handleCleanSector(hoveredSector, e)}
              className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
            >
              <Droplets size={14} />
              Clean Sector
            </button>
          )}
        </div>
      )}

      {/* Selected Sector Info */}
      {selectedSector && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-medium">Selected: Sector {selectedSector}</p>
          <p className="text-gray-600">Click on panels below to see detailed information</p>
        </div>
      )}
    </div>
  )
}