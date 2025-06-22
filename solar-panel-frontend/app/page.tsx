'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Sun, 
  Droplets, 
  AlertTriangle, 
  Activity,
  Wind,
  Thermometer,
  Zap,
  TrendingUp,
  Eye,
  Sparkles,
  Grid3x3,
  BarChart3
} from 'lucide-react'
import SectorMap from '@/components/SectorMap'
import PanelGrid from '@/components/PanelGrid'
import FarmStatistics from '@/components/FarmStatistics'
import SectorAnalytics from '@/components/SectorAnalytics'
import WeatherWidget from '@/components/WeatherWidget'
import { useWebSocket } from '@/hooks/useWebSocket'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'map' | 'panels'>('map')
  const [sectorPanels, setSectorPanels] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  
  const wsData = useWebSocket()
  const hasShownConnectionToast = useRef(false)

  useEffect(() => {
    // Show connection status
    if (wsData && !hasShownConnectionToast.current) {
      toast.success('Connected to solar farm monitoring system')
      hasShownConnectionToast.current = true
    }
  }, [wsData])

  useEffect(() => {
    // Fetch initial statistics
    fetchStatistics()
  }, [])

  useEffect(() => {
    // Fetch panels when sector is selected
    if (selectedSector) {
      fetchSectorPanels(selectedSector)
    }
  }, [selectedSector])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/statistics')
      const data = await response.json()
      setStatistics(data)
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const fetchSectorPanels = async (sectorId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/sectors/${sectorId}/panels`)
      const data = await response.json()
      setSectorPanels(data.panels)
      setViewMode('panels')
    } catch (error) {
      console.error('Failed to fetch sector panels:', error)
      toast.error('Failed to load sector panels')
    }
  }

  // Refresh sector panels
  const refreshPanels = () => {
    if (selectedSector) {
      fetchSectorPanels(selectedSector)
    }
  }

  const handleBackToMap = () => {
    setViewMode('map')
    setSelectedPanel(null)
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Sun className="text-yellow-500" size={36} />
              SolarSense AI - Large Scale
            </h1>
            <p className="text-gray-600 mt-2">
              Monitoring {statistics?.total_panels || '2,700'} panels across {statistics?.total_sectors || '81'} sectors • 100 km² solar farm
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Capacity</p>
              <p className="text-lg font-semibold text-green-600">
                {statistics?.total_capacity_mw || '1.35'} MW
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">System Status</p>
              <p className="text-lg font-semibold text-green-600 flex items-center gap-2">
                <Activity size={20} />
                Operational
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Statistics Bar */}
      {wsData?.farm_statistics && (
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-4 mb-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm opacity-90">Overall Efficiency</p>
              <p className="text-2xl font-bold">{wsData.farm_statistics.total_efficiency}%</p>
              <p className="text-xs opacity-75">Real-time average</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Power Output</p>
              <p className="text-2xl font-bold">{wsData.farm_statistics.total_power_output_mw} MW</p>
              <p className="text-xs opacity-75">Current generation</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Panels Need Cleaning</p>
              <p className="text-2xl font-bold">{wsData.farm_statistics.panels_needing_cleaning}</p>
              <p className="text-xs opacity-75">{wsData.farm_statistics.cleaning_percentage}% of total</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Daily Revenue</p>
              <p className="text-2xl font-bold">${statistics?.estimated_daily_revenue || '0'}</p>
              <p className="text-xs opacity-75">Projected earnings</p>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBackToMap}
          disabled={viewMode === 'map'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'map' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Grid3x3 size={20} />
          Sector Map
        </button>
        <button
          disabled={!selectedSector || viewMode === 'panels'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'panels' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 size={20} />
          Panel View {selectedSector && `(${selectedSector})`}
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Map or Panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {viewMode === 'map' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Eye size={20} />
                  Solar Farm Sector Overview
                </h2>
                <SectorMap 
                  onSelectSector={setSelectedSector}
                  selectedSector={selectedSector}
                  wsData={wsData}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Eye size={20} />
                    Sector {selectedSector} Panels
                  </h2>
                  <button
                    onClick={handleBackToMap}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Back to Map
                  </button>
                </div>
                <PanelGrid 
                  panels={sectorPanels}
                  wsData={wsData}
                  onSelectPanel={setSelectedPanel}
                  selectedPanel={selectedPanel}
                  onPanelCleaned={refreshPanels}
                />
              </>
            )}
          </div>

          {/* Analytics Section */}
          {selectedSector && (
            <SectorAnalytics 
              sectorId={selectedSector} 
              wsData={wsData}
            />
          )}
        </div>

        {/* Right Column - Statistics & Insights */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <WeatherWidget wsData={wsData} />

          {/* Farm Statistics */}
          <FarmStatistics statistics={statistics} />

          {/* Best/Worst Performing Sectors */}
          {statistics && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Sector Performance
              </h3>
              
              {/* Best Sectors */}
              <div className="mb-4">
                <p className="text-sm font-medium text-green-600 mb-2">Top Performing</p>
                <div className="space-y-2">
                  {statistics.best_performing_sectors?.slice(0, 3).map((sector: any) => (
                    <div key={sector.sector_id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sector.sector_id}</span>
                      <span className="text-green-600">{sector.efficiency.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worst Sectors */}
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">Need Attention</p>
                <div className="space-y-2">
                  {statistics.worst_performing_sectors?.slice(0, 3).map((sector: any) => (
                    <div key={sector.sector_id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sector.sector_id}</span>
                      <span className="text-red-600">{sector.efficiency.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Sample Panels */}
          {wsData?.sample_panels && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity size={20} />
                Live Panel Monitoring
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {wsData.sample_panels.slice(0, 5).map((panel: any) => (
                  <div key={panel.id} className="text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{panel.id}</span>
                      <span className="text-xs text-gray-500">{panel.sector}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                      <span>Eff: {panel.efficiency}%</span>
                      <span>Power: {panel.power_output}W</span>
                      <span>Dust: {panel.dust_level}</span>
                      <span>Temp: {panel.temperature}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Water Saved (Monthly)</p>
              <p className="text-2xl font-bold text-blue-600">45,230 L</p>
              <p className="text-xs text-gray-400">vs. scheduled cleaning</p>
            </div>
            <Droplets className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Energy Efficiency</p>
              <p className="text-2xl font-bold text-green-600">+18.4%</p>
              <p className="text-xs text-gray-400">AI optimization impact</p>
            </div>
            <Zap className="text-yellow-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">$486K</p>
              <p className="text-xs text-gray-400">+$72K from AI</p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AI Predictions</p>
              <p className="text-2xl font-bold text-purple-600">96.2%</p>
              <p className="text-xs text-gray-400">Accuracy rate</p>
            </div>
            <Sparkles className="text-purple-500" size={32} />
          </div>
        </div>
      </div>
    </div>
  )
}