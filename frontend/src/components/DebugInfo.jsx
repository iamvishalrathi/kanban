import React from 'react'

export const DebugInfo = () => {
  // Only show in development or if explicitly enabled
  const showDebug = import.meta.env.DEV || localStorage.getItem('showDebugInfo') === 'true'
  
  if (!showDebug) return null

  const envInfo = {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    apiUrl: import.meta.env.VITE_API_URL,
    hostname: window.location.hostname,
    origin: window.location.origin,
    allEnv: import.meta.env
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white p-3 rounded text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Debug Info</div>
      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">
        {JSON.stringify(envInfo, null, 2)}
      </pre>
      <button 
        onClick={() => localStorage.removeItem('showDebugInfo')}
        className="mt-2 text-red-300 hover:text-red-100"
      >
        Hide
      </button>
    </div>
  )
}

// To show debug info in production, run in console:
// localStorage.setItem('showDebugInfo', 'true')
// Then refresh the page