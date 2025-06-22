import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, X, Bell } from 'lucide-react'
import { getAlerts, resolveAlert } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId)
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      toast.success('Alert resolved')
    } catch (error) {
      toast.error('Failed to resolve alert')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={20} />
          Active Alerts
        </h3>
        <span className="text-sm text-gray-500">
          {alerts.length} active
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
          <p className="text-gray-600">No active alerts</p>
          <p className="text-sm text-gray-500 mt-1">All systems operating normally</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id || alert._id}
              className={`p-3 rounded-lg border ${
                alert.severity === 'high' ? 'border-red-300' :
                alert.severity === 'medium' ? 'border-yellow-300' : 'border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {alert.panel_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handleResolve(alert.id || alert._id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Resolve alert"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}