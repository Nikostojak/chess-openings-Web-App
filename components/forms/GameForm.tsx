'use client'

import { useState, useEffect } from 'react'
import { Calendar, User, Trophy, BookOpen, Clock, FileText, Search, CheckCircle } from 'lucide-react'

const RESULTS = [
  { value: 'win', label: 'Win', color: 'text-emerald-400' },
  { value: 'loss', label: 'Loss', color: 'text-red-400' },
  { value: 'draw', label: 'Draw', color: 'text-amber-400' }
]

const TIME_CONTROLS = [
  'Bullet (1+0)',
  'Bullet (2+1)', 
  'Blitz (3+0)',
  'Blitz (3+2)',
  'Blitz (5+0)',
  'Blitz (5+3)',
  'Rapid (10+0)',
  'Rapid (15+10)',
  'Classical (30+0)',
  'Classical (90+30)',
  'Correspondence'
]

type GameFormProps = {
  onClose?: () => void
  onPgnChange?: (pgn: string) => void
}

type OpeningSuggestion = {
  ecoCode: string
  name: string
  family: string
  popularity: number
}

type EcoClassification = {
  ecoCode: string | null
  name: string
  family: string
  variation?: string
  subvariation?: string
  moves: string
}

export default function GameForm({ onClose, onPgnChange }: GameFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    result: '',
    opening: '',
    ecoCode: '',
    timeControl: '',
    notes: '',
    pgn: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openingSuggestions, setOpeningSuggestions] = useState<OpeningSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [ecoClassification, setEcoClassification] = useState<EcoClassification | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)

  useEffect(() => {
    loadPopularOpenings()
  }, [])

  useEffect(() => {
    if (formData.pgn) {
      classifyOpening(formData.pgn)
    } else {
      setEcoClassification(null)
    }
  }, [formData.pgn])

  const loadPopularOpenings = async () => {
    try {
      const response = await fetch('/api/openings?popular=true&limit=20')
      const data = await response.json()
      setOpeningSuggestions(data.openings || [])
    } catch (error) {
      console.error('Error loading popular openings:', error)
    }
  }

  const searchOpenings = async (query: string) => {
    if (query.length < 2) {
      setOpeningSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/openings?search=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      setOpeningSuggestions(data.openings || [])
    } catch (error) {
      console.error('Error searching openings:', error)
    }
  }

  const classifyOpening = async (pgn: string) => {
    if (!pgn.trim()) return

    setIsClassifying(true)
    try {
      const response = await fetch('/api/openings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgn })
      })

      const classification = await response.json()
      setEcoClassification(classification)

      if (classification.ecoCode) {
        setFormData(prev => ({
          ...prev,
          opening: classification.name,
          ecoCode: classification.ecoCode
        }))
      }
    } catch (error) {
      console.error('Error classifying opening:', error)
    } finally {
      setIsClassifying(false)
    }
  }

  const handlePgnChange = (pgn: string) => {
    setFormData(prev => ({ ...prev, pgn }))
    onPgnChange?.(pgn)
  }

  const handleOpeningSelect = (opening: OpeningSuggestion) => {
    setFormData(prev => ({ 
      ...prev, 
      opening: opening.name,
      ecoCode: opening.ecoCode
    }))
    setShowSuggestions(false)
  }

  const handleOpeningInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, opening: value }))
    if (value.length > 0) {
      setShowSuggestions(true)
      searchOpenings(value)
    } else {
      setShowSuggestions(false)
      setOpeningSuggestions([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ecoCode: formData.ecoCode || null
        })
      })
      
      if (response.ok) {
        const resetData = {
          date: new Date().toISOString().split('T')[0],
          opponent: '',
          result: '',
          opening: '',
          ecoCode: '',
          timeControl: '',
          notes: '',
          pgn: ''
        }
        setFormData(resetData)
        setEcoClassification(null)
        onPgnChange?.('')
        onClose?.()
        window.location.reload()
      }
    } catch (error) {
      console.error('Error saving game:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Add New Game</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Date */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            Date
          </label>
          <input 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
            required
          />
        </div>

        {/* Opponent */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <User className="h-4 w-4 mr-2" />
            Opponent
          </label>
          <input 
            type="text"
            placeholder="Opponent's name or username"
            value={formData.opponent}
            onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
            className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-500"
            required
          />
        </div>

        {/* Result */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Trophy className="h-4 w-4 mr-2" />
            Result
          </label>
          <div className="grid grid-cols-3 gap-2">
            {RESULTS.map(result => (
              <button
                key={result.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, result: result.value }))}
                className={`p-3 rounded-xl border-2 transition-all font-medium ${
                  formData.result === result.value 
                    ? 'border-green-500 bg-green-900/30 text-white' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-300'
                }`}
              >
                {result.label}
              </button>
            ))}
          </div>
        </div>

        {/* PGN Field */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <FileText className="h-4 w-4 mr-2" />
            PGN (optional) - for auto opening detection
          </label>
          <textarea
            placeholder="Paste your game PGN here for automatic opening classification..."
            value={formData.pgn}
            onChange={(e) => handlePgnChange(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm text-white placeholder-gray-500"
          />
          {isClassifying && (
            <div className="mt-2 flex items-center text-sm text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></div>
              Analyzing opening...
            </div>
          )}
          {ecoClassification && ecoClassification.ecoCode && (
            <div className="mt-2 p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-center text-green-400">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="font-medium">Opening detected: {ecoClassification.name}</span>
              </div>
              <div className="text-sm text-green-500 mt-1">
                ECO: {ecoClassification.ecoCode} | Family: {ecoClassification.family}
              </div>
            </div>
          )}
        </div>

        {/* Opening - with smart suggestions */}
        <div className="relative">
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <BookOpen className="h-4 w-4 mr-2" />
            Opening
            {formData.ecoCode && (
              <span className="ml-2 text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                {formData.ecoCode}
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type to search openings... (e.g., Sicilian, Queen's Gambit)"
              value={formData.opening}
              onChange={(e) => handleOpeningInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full p-3 pr-10 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-500"
              required
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
          
          {/* Opening Suggestions Dropdown */}
          {showSuggestions && openingSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {openingSuggestions.map((opening) => (
                <button
                  key={opening.ecoCode}
                  type="button"
                  onClick={() => handleOpeningSelect(opening)}
                  className="w-full text-left p-3 hover:bg-gray-700 border-b border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{opening.name}</div>
                      <div className="text-sm text-gray-400">{opening.family}</div>
                    </div>
                    <div className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {opening.ecoCode}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Time Control */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <Clock className="h-4 w-4 mr-2" />
            Time Control
          </label>
          <select
            value={formData.timeControl}
            onChange={(e) => setFormData(prev => ({ ...prev, timeControl: e.target.value }))}
            className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
          >
            <option value="">Select time control...</option>
            {TIME_CONTROLS.map(timeControl => (
              <option key={timeControl} value={timeControl}>{timeControl}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            <FileText className="h-4 w-4 mr-2" />
            Notes (optional)
          </label>
          <textarea
            placeholder="Game analysis, key moments, lessons learned..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full p-3 border border-gray-700 bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-white placeholder-gray-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Game'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}