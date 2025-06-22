import { Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface SystemMetricsProps {
  wsData: any
  panels: any[]
}

export default function SystemMetrics({ wsData, panels }: SystemMetricsProps) {
  const systemStatus = wsData?.system_status || {}
  const panelsNeedingCleaning = panels.filter(p => p.needs_cleaning).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <Zap className="text-yellow-500" size={24} />
          <span className="text-xs text-gray-500">Live</span>
        </div>
        <p className="text-sm text-gray-600">Total Power Output</p>
        <p className="text-2xl font-bold text-gray-900">
          {systemStatus.total_power_output?.toFixed(0) || '0'} W
        </p>
        <p className="text-xs text-green-600 mt-1">↑ Operating normally</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp className="text-green-500" size={24} />
          <span className="text-xs text-gray-500">Live</span>
        </div>
        <p className="text-sm text-gray-600">System Efficiency</p>
        <p className="text-2xl font-bold text-gray-900">
          {systemStatus.total_efficiency?.toFixed(1) || '0'}%
        </p>
        <p className="text-xs text-gray-600 mt-1">Average across all panels</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <AlertTriangle className="text-orange-500" size={24} />
          <span className="text-xs text-gray-500">Status</span>
        </div>
        <p className="text-sm text-gray-600">Panels Need Cleaning</p>
        <p className="text-2xl font-bold text-gray-900">{panelsNeedingCleaning}</p>
        <p className="text-xs text-orange-600 mt-1">
          {panelsNeedingCleaning > 0 ? 'Action required' : 'All panels clean'}
        </p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <CheckCircle className="text-blue-500" size={24} />
          <span className="text-xs text-gray-500">Total</span>
        </div>
        <p className="text-sm text-gray-600">Active Panels</p>
        <p className="text-2xl font-bold text-gray-900">{panels.length}</p>
        <p className="text-xs text-gray-600 mt-1">All systems monitored</p>
      </div>
    </div>
  )
}