import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Droplets, Zap } from 'lucide-react'

interface SectorAnalyticsProps {
  sectorId: string
  wsData: any
}

export default function SectorAnalytics({ sectorId, wsData }: SectorAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<any[]>([])

  useEffect(() => {
    // Simulate historical data for the sector
    const generateHistoricalData = () => {
      const data = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        data.push({
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          efficiency: 85 + Math.random() * 10,
          dustLevel: 200 + Math.random() * 200,
          powerOutput: 15 + Math.random() * 5,
          panelsCleaned: i === 3 ? 15 : 0
        })
      }
      return data
    }

    setAnalyticsData(generateHistoricalData())
  }, [sectorId])

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp size={20} />
        Sector {sectorId} Analytics
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Efficiency Trend */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Efficiency Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} domain={[80, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dust Accumulation */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Dust Levels & Cleaning</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" style={{ fontSize: '12px' }} />
              <YAxis style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="dustLevel" fill="#f59e0b" />
              <Bar dataKey="panelsCleaned" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Insights */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Zap className="text-green-600" size={20} />
            <span className="text-xs text-green-600 font-medium">+3.2%</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-1">Efficiency Gain</p>
          <p className="text-xs text-gray-600">vs. last week</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <Droplets className="text-blue-600" size={20} />
            <span className="text-xs text-blue-600 font-medium">156L</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-1">Water Used</p>
          <p className="text-xs text-gray-600">This week</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-xs text-purple-600 font-medium">$2,450</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-1">Revenue Impact</p>
          <p className="text-xs text-gray-600">From optimization</p>
        </div>
      </div>
    </div>
  )
}