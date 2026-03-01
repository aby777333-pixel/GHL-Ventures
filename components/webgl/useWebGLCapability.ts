'use client'

import { useState, useEffect } from 'react'

let cachedResult: boolean | null = null

export function useWebGLCapability(): boolean {
  const [supported, setSupported] = useState(cachedResult ?? false)

  useEffect(() => {
    if (cachedResult !== null) {
      setSupported(cachedResult)
      return
    }
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      cachedResult = !!gl
      setSupported(cachedResult)
      if (gl) {
        const ext = gl.getExtension('WEBGL_lose_context')
        ext?.loseContext()
      }
    } catch {
      cachedResult = false
      setSupported(false)
    }
  }, [])

  return supported
}
