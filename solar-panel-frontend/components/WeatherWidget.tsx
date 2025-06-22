import { Cloud, Sun, Wind, Droplets, Thermometer } from 'lucide-react'

interface WeatherWidgetProps {
  wsData: any
}

export default function WeatherWidget({ wsData }: WeatherWidgetProps) {
  const weather = wsData?.system_status?.weather || {
    temperature: 28,
    humidity: 45,
    wind_speed: 3.5,
    conditions: 'clear'
  }

  const getWeatherIcon = () => {
    switch (weather.conditions) {
      case 'clear':
        return <Sun className="text-yellow-500" size={48} />
      case 'cloudy':
        return <Cloud className="text-gray-500" size={48} />
      default:
        return <Sun className="text-yellow-500" size={48} />
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Weather Conditions</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-3xl font-bold">{weather.temperature?.toFixed(1)}°C</p>
          <p className="text-sm opacity-90 capitalize">{weather.conditions}</p>
        </div>
        {getWeatherIcon()}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Droplets size={16} />
          <div>
            <p className="opacity-80">Humidity</p>
            <p className="font-semibold">{weather.humidity?.toFixed(0)}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind size={16} />
          <div>
            <p className="opacity-80">Wind</p>
            <p className="font-semibold">{weather.wind_speed?.toFixed(1)} m/s</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-xs opacity-80">
          {weather.conditions === 'clear' 
            ? '✅ Optimal conditions for solar generation'
            : '⚠️ Reduced solar efficiency expected'}
        </p>
      </div>
    </div>
  )
}