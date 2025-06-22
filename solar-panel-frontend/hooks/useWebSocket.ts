import { useEffect, useState } from 'react'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export function useWebSocket() {
  const [data, setData] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    
    const connect = () => {
      try {
        // Using native WebSocket for FastAPI
        ws = new WebSocket(`${WS_URL}/ws`)

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
        }

        ws.onmessage = (event) => {
          try {
            const messageData = JSON.parse(event.data)
            setData(messageData)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error occurred')
          // Don't log the error object as it doesn't contain useful info in browsers
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...')
            connect()
          }, 3000)
        }
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [])

  return data
}