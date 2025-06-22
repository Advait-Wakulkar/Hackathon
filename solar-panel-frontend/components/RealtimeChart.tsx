import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface RealtimeChartProps {
  wsData: any
  selectedPanel: string | null
}

export default function RealtimeChart({ wsData, selectedPanel }: RealtimeChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (wsData?.panels) {
      const timestamp = new Date(wsData.timestamp).toLocaleTimeString()
      
      if (selectedPanel) {
        // Show data for selected panel
        const panel = wsData.panels.find((p: any) => p.id === selectedPanel)
        if (panel) {
          setChartData(prev => {
            const newData = [...prev, {
              time: timestamp,
              efficiency: panel.efficiency,
              dustLevel: panel.dust_level / 10, // Scale down for better visualization
              voltage: panel.voltage,
              power: panel.power_output
            }]
            return newData.slice(-20) // Keep last 20 data points
          })
        }
      } else {
        // Show system average
        const avgEfficiency = wsData.system_status.total_efficiency
        const avgDust = wsData.panels.reduce((sum: number, p: any) => sum + p.dust_level, 0) / wsData.panels.length
        
        setChartData(prev => {
          const newData = [...prev, {
            time: timestamp,
            efficiency: avgEfficiency,
            dustLevel: avgDust / 10,
            totalPower: wsData.system_status.total_power_output / 10 // Scale for visualization
          }]
          return newData.slice(-20)
        })
      }
    }
  }, [wsData, selectedPanel])

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <Legend />
          
          <Line 
            type="monotone" 
            dataKey="efficiency" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Efficiency (%)"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="dustLevel" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Dust Level (÷10)"
            dot={false}
          />
          
          {selectedPanel ? (
            <>
              <Line 
                type="monotone" 
                dataKey="voltage" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Voltage (V)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="power" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Power (W)"
                dot={false}
              />
            </>
          ) : (
            <Line 
              type="monotone" 
              dataKey="totalPower" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Total Power (÷10)"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      
      {selectedPanel && (
        <p className="text-center text-sm text-gray-600 mt-2">
          Showing data for {selectedPanel}
        </p>
      )}
    </div>
  )
}