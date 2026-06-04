import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket(namespace = '/') {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8080'
    socketRef.current = io(`${url}${namespace}`, {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('token') },
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [namespace])

  return socketRef.current
}
