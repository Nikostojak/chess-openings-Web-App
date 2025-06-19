// components/training/TrainingTimer.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Zap } from 'lucide-react'

interface TrainingTimerProps {
  timeLimit: number // seconds
  onTimeUp: () => void
  isPaused?: boolean
  onTick?: (timeRemaining: number) => void
}

export default function TrainingTimer({ 
  timeLimit, 
  onTimeUp, 
  isPaused = false,
  onTick 
}: TrainingTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit)
  const [isRunning, setIsRunning] = useState(true)
  
  useEffect(() => {
    if (isPaused || !isRunning) return
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 0.1)
        
        // Call onTick every second
        if (Math.floor(newTime) !== Math.floor(prev) && onTick) {
          onTick(Math.floor(newTime))
        }
        
        if (newTime === 0) {
          setIsRunning(false)
          onTimeUp()
        }
        
        return newTime
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [isPaused, isRunning, onTimeUp, onTick])
  
  const percentage = (timeRemaining / timeLimit) * 100
  const displayTime = Math.ceil(timeRemaining)
  
  // Color based on time remaining
  const getColor = () => {
    if (percentage > 60) return 'text-green-600 bg-green-100'
    if (percentage > 30) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100 animate-pulse'
  }
  
  const getBarColor = () => {
    if (percentage > 60) return 'bg-green-500'
    if (percentage > 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  return (
    <div className="relative">
      {/* Circular Timer for Blitz Mode */}
      <div className="flex flex-col items-center">
        <div className={`relative w-24 h-24 rounded-full ${getColor()} flex items-center justify-center`}>
          {/* Background circle */}
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              opacity="0.2"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          
          {/* Time display */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-3xl font-bold font-mono">
              {displayTime}
            </span>
            <span className="text-xs uppercase">sec</span>
          </div>
        </div>
        
        {/* Speed indicator */}
        {displayTime <= 3 && (
          <div className="mt-2 flex items-center text-orange-600">
            <Zap className="h-4 w-4 mr-1 animate-pulse" />
            <span className="text-sm font-medium">Hurry!</span>
          </div>
        )}
      </div>
      
      {/* Linear progress bar */}
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}