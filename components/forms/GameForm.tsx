'use client'

import { useState } from 'react'
import { Calendar, User, Trophy, BookOpen, Clock, FileText } from 'lucide-react'
import GameAnalysis from '@/components/chess/GameAnalysis'

const OPENINGS = [
  'Sicilian Defense',
  'Queen\'s Gambit', 
  'King\'s Indian Defense',
  'French Defense',
  'Caro-Kann Defense',
  'English Opening',
  'Ruy Lopez',
  'Italian Game',
  'Queen\'s Indian Defense',
  'Nimzo-Indian Defense',
  'Alekhine Defense',
  'Scandinavian Defense',
  'Pirc Defense',
  'Modern Defense',
  'Grünfeld Defense',
  'Dutch Defense',
  'Benoni Defense',
  'King\'s Gambit',
  'Vienna Game',
  'Scotch Game'
]

const RESULTS = [
  { value: 'win', label: 'Win', color: 'text-emerald-600' },
  { value: 'loss', label: 'Loss', color: 'text-red-600' },
  { value: 'draw', label: 'Draw', color: 'text-amber-600' }
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

export default function GameForm({ onClose }: { onClose?: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    result: '',
    opening: '',
    timeControl: '',
    notes: ''
  })
  
  const [pgn, setPgn] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        // Reset form
        setFormData({
          date: new Date().toISOString().split('T')[0],
          opponent: '',
          result: '',
          opening: '',
          timeControl: '',
          notes: ''
        })
        setPgn('')
        onClose?.()
        // Refresh page to show new game
        window.location.reload()
      }
    } catch (error) {
      console.error('Error saving game:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Game</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Date */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 mr-2" />
            Date
          </label>
          <input 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          />
        </div>

        {/* Opponent */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 mr-2" />
            Opponent
          </label>
          <input 
            type="text"
            placeholder="Opponent's name or username"
            value={formData.opponent}
            onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          />
        </div>

        {/* Result */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
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
                    ? 'border-gray-900 bg-gray-900 text-white' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {result.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opening */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <BookOpen className="h-4 w-4 mr-2" />
            Opening
          </label>
          <select
            value={formData.opening}
            onChange={(e) => setFormData(prev => ({ ...prev, opening: e.target.value }))}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
          >
            <option value="">Select opening...</option>
            {OPENINGS.map(opening => (
              <option key={opening} value={opening}>{opening}</option>
            ))}
          </select>
        </div>

        {/* Time Control */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4 mr-2" />
            Time Control
          </label>
          <select
            value={formData.timeControl}
            onChange={(e) => setFormData(prev => ({ ...prev, timeControl: e.target.value }))}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Select time control...</option>
            {TIME_CONTROLS.map(timeControl => (
              <option key={timeControl} value={timeControl}>{timeControl}</option>
            ))}
          </select>
        </div>

        {/* PGN Field */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 mr-2" />
            PGN (optional)
          </label>
          <textarea
            placeholder="Paste your game PGN here for analysis..."
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none font-mono text-sm"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="h-4 w-4 mr-2" />
            Notes (optional)
          </label>
          <textarea
            placeholder="Game analysis, key moments, lessons learned..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Game'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Game Analysis */}
      {pgn && (
        <div className="mt-8">
          <GameAnalysis pgn={pgn} />
        </div>
      )}
    </div>
  )
}