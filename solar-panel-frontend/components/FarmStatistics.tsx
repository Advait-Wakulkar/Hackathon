import { TrendingUp, AlertTriangle, Zap, DollarSign } from 'lucide-react'

interface FarmStatisticsProps {
  statistics: any
}

export default function FarmStatistics({ statistics }: FarmStatisticsProps) {
  if (!statistics) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={20} />
        Farm Performance
      </h3>

      <div className="space-y-4">
        {/* Efficiency Overview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm opacity-90">Overall Efficiency</span>
            <span className="text-lg font-bold">{statistics.overall_efficiency}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${statistics.overall_efficiency}%` }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20">
          <div>
            <p className="text-xs opacity-80">Active Panels</p>
            <p className="text-xl font-bold">{statistics.total_panels}</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Need Cleaning</p>
            <p className="text-xl font-bold flex items-center gap-1">
              {statistics.panels_needing_cleaning}
              {statistics.cleaning_percentage > 30 && (
                <AlertTriangle size={16} className="text-yellow-300" />
              )}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-80">Power Output</p>
            <p className="text-xl font-bold">{(statistics.total_power_output_kw / 1000).toFixed(1)} MW</p>
          </div>
          <div>
            <p className="text-xs opacity-80">Daily Revenue</p>
            <p className="text-xl font-bold">${statistics.estimated_daily_revenue}</p>
          </div>
        </div>

        {/* Cleaning Alert */}
        {statistics.cleaning_percentage > 20 && (
          <div className="bg-white/10 rounded-lg p-3 mt-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} />
              Cleaning Recommended
            </p>
            <p className="text-xs opacity-90 mt-1">
              {statistics.cleaning_percentage.toFixed(1)}% of panels need attention
            </p>
          </div>
        )}
      </div>
    </div>
  )
}