// components/training/TrainingQuestion.tsx
'use client'

import { useState, useEffect } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { 
  HelpCircle, Target, Trophy, Zap, 
  ChevronRight, Star, Award 
} from 'lucide-react'

interface TrainingQuestionProps {
  question: {
    index: number
    position: string // FEN
    openingName: string
    moveNumber: number
    difficulty: number
    hint?: string
    choices: string[]
  }
  onAnswer: (move: string, timeSpent: number) => void
  questionNumber: number
  totalQuestions: number
  score: number
  streak: number
}

export default function TrainingQuestion({
  question,
  onAnswer,
  questionNumber,
  totalQuestions,
  score,
  streak
}: TrainingQuestionProps) {
  const [selectedMove, setSelectedMove] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [startTime] = useState(Date.now())
  const [chess] = useState(() => new Chess(question.position))
  const [boardOrientation] = useState<'white' | 'black'>(
    chess.turn() === 'w' ? 'white' : 'black'
  )
  
  const handleMoveSelect = (move: string) => {
    setSelectedMove(move)
    const timeSpent = Date.now() - startTime
    
    // Add small delay for visual feedback
    setTimeout(() => {
      onAnswer(move, timeSpent)
    }, 300)
  }
  
  const getDifficultyStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < question.difficulty ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
        }`}
      />
    ))
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="bg-white rounded-t-2xl border border-b-0 border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">
                Question {questionNumber} / {totalQuestions}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">{score} pts</span>
            </div>
            
            {streak > 0 && (
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">{streak} streak</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {getDifficultyStars()}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          
          {/* Chessboard */}
          <div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {question.openingName}
              </h3>
              <p className="text-sm text-gray-600">
                Move {question.moveNumber} • {chess.turn() === 'w' ? 'White' : 'Black'} to play
              </p>
            </div>
            
            <div className="relative">
              <Chessboard
                position={question.position}
                boardOrientation={boardOrientation}
                arePiecesDraggable={false}
                boardWidth={400}
                customBoardStyle={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              
              {/* Streak indicator */}
              {streak >= 3 && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold animate-bounce">
                  🔥{streak}
                </div>
              )}
            </div>
          </div>
          
          {/* Move Choices */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose the best move:
              </h3>
              <p className="text-sm text-gray-600">
                Find the main line continuation
              </p>
            </div>
            
            <div className="space-y-3">
              {question.choices.map((move, index) => (
                <button
                  key={move}
                  onClick={() => handleMoveSelect(move)}
                  disabled={selectedMove !== null}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                    ${selectedMove === move
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${selectedMove !== null && selectedMove !== move
                      ? 'opacity-50'
                      : ''
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold
                      ${selectedMove === move
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg font-medium">{move}</span>
                  </div>
                  
                  {selectedMove === move && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Hint Section */}
            {question.hint && (
              <div className="mt-6">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Need a hint?</span>
                  </button>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Hint:</strong> {question.hint}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Skip Button (costs points) */}
            <div className="mt-6 text-center">
              <button
                onClick={() => onAnswer('skip', Date.now() - startTime)}
                disabled={selectedMove !== null}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip question (-50 pts)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}