
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Panel endpoints
export const getPanels = async (skip: number = 0, limit: number = 100, sectorId?: string) => {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  })
  if (sectorId) params.append('sector_id', sectorId)
  
  const response = await api.get(`/api/panels?${params}`)
  return response.data
}

export const getPanel = async (panelId: string) => {
  const response = await api.get(`/api/panels/${panelId}`)
  return response.data
}

// Sector endpoints
export const getSectors = async () => {
  const response = await api.get('/api/sectors')
  return response.data
}

export const getSectorPanels = async (sectorId: string) => {
  const response = await api.get(`/api/sectors/${sectorId}/panels`)
  return response.data
}

export const cleanSector = async (sectorId: string) => {
  const response = await api.post(`/api/sectors/${sectorId}/clean`)
  return response.data
}

// Statistics
export const getStatistics = async () => {
  const response = await api.get('/api/statistics')
  return response.data
}

// Sensor data
export const submitSensorData = async (data: any) => {
  const response = await api.post('/api/sensor-data', data)
  return response.data
}

export const getSensorHistory = async (panelId: string, hours: number = 24) => {
  const response = await api.get(`/api/sensor-history/${panelId}?hours=${hours}`)
  return response.data
}

// Analytics
export const getAnalytics = async (panelId: string) => {
  const response = await api.get(`/api/analytics/${panelId}`)
  return response.data
}

// Cleaning
export const cleanPanel = async (panelId: string) => {
  const response = await api.post(`/api/clean/${panelId}`)
  return response.data
}

// AI Predictions
export const predictCleaning = async (data: {
  panel_id: string
  dust_level: number
  days_since_cleaning: number
  current_efficiency: number
}) => {
  const response = await api.post('/api/predict', data)
  return response.data
}

export const predictSectorCleaning = async (sectorId: string) => {
  const response = await api.post(`/api/predict/sector/${sectorId}`)
  return response.data
}

// Alerts
export const getAlerts = async () => {
  const response = await api.get('/api/alerts')
  return response.data
}

export const getAlertsSummary = async () => {
  const response = await api.get('/api/alerts/summary')
  return response.data
}

export const resolveAlert = async (alertId: string) => {
  const response = await api.put(`/api/alerts/${alertId}/resolve`)
  return response.data
}