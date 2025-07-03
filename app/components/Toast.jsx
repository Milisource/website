'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const toastTypes = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-500',
    textColor: 'text-green-500',
    borderColor: 'border-green-200',
    bgLight: 'bg-green-50',
    darkBg: 'dark:bg-green-900/20',
    darkBorder: 'dark:border-green-800'
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500',
    textColor: 'text-red-500',
    borderColor: 'border-red-200',
    bgLight: 'bg-red-50',
    darkBg: 'dark:bg-red-900/20',
    darkBorder: 'dark:border-red-800'
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    borderColor: 'border-yellow-200',
    bgLight: 'bg-yellow-50',
    darkBg: 'dark:bg-yellow-900/20',
    darkBorder: 'dark:border-yellow-800'
  }
}

export default function Toast({ message, type = 'success', duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const toastStyle = toastTypes[type] || toastTypes.success
  const IconComponent = toastStyle.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(), 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${toastStyle.bgLight} ${toastStyle.darkBg}
        ${toastStyle.borderColor} ${toastStyle.darkBorder}
        max-w-sm
      `}>
        <IconComponent className={`w-5 h-5 ${toastStyle.textColor}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">
          {message}
        </span>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose(), 300)
          }}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 