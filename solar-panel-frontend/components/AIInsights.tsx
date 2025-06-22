import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Droplets, Clock } from 'lucide-react'
import { predictCleaning } from '@/lib/api'

interface AIInsightsProps {
  panels: any[]
  wsData: any
}

export default function AIInsights({ panels, wsData }: AIInsightsProps) {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPredictions = async () => {
      if (panels.length === 0) return
      
      setLoading(true)
      try {
        // Get predictions for panels that need attention
        const panelsToCheck = panels
          .filter(p => p.dust_level > 200 || p.current_efficiency < 90)
          .slice(0, 3) // Top 3 panels

        const predictionPromises = panelsToCheck.map(panel => 
          predictCleaning({
            panel_id: panel.panel_id,
            dust_level: panel.dust_level,
            days_since_cleaning: 5, // Mock value
            current_efficiency: panel.current_efficiency
          })
        )

        const results = await Promise.all(predictionPromises)
        setPredictions(results)
      } catch (error) {
        console.error('Failed to get AI predictions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [panels])

  const topPrediction = predictions.find(p => p.should_clean) || predictions[0]

  return (
    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={24} />
        <h3 className="text-lg font-semibold">AI Insights</h3>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
      ) : topPrediction ? (
        <div className="space-y-4">
          {/* Main Recommendation */}
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Priority Action</p>
            <p className="text-xs opacity-90">{topPrediction.recommendation}</p>
            
            {topPrediction.should_clean && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <TrendingUp size={14} />
                <span>Expected efficiency gain: +{topPrediction.estimated_efficiency_gain}%</span>
              </div>
            )}
          </div>

          {/* AI Factors */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Analysis Factors</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white/10 rounded p-2 text-center">
                <p className="opacity-70">Dust</p>
                <p className="font-semibold">{(topPrediction.factors?.dust_impact * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-white/10 rounded p-2 text-center">
                <p className="opacity-70">Time</p>
                <p className="font-semibold">{(topPrediction.factors?.time_impact * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-white/10 rounded p-2 text-center">
                <p className="opacity-70">Efficiency</p>
                <p className="font-semibold">{(topPrediction.factors?.efficiency_impact * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Water Optimization */}
          {topPrediction.water_optimization && (
            <div className="border-t border-white/20 pt-3 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Droplets size={14} />
                Water Optimization
              </p>
              <div className="text-xs space-y-1 opacity-90">
                <p>Volume: {topPrediction.water_optimization.recommended_volume}L</p>
                <p>Pattern: {topPrediction.water_optimization.spray_pattern}</p>
                <p>Duration: {topPrediction.water_optimization.duration_seconds}s</p>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/20">
            <span className="opacity-70">AI Confidence</span>
            <span className="font-semibold">{(topPrediction.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      ) : (
        <p className="text-sm opacity-90">All panels operating efficiently!</p>
      )}
    </div>
  )
}