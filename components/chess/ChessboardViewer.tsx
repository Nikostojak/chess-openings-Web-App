'use client'

import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react'

type ChessboardViewerProps = {
  pgn: string
  title?: string
}

export default function ChessboardViewer({ pgn, title }: ChessboardViewerProps) {
  const [chess] = useState(new Chess())
  const [gameHistory, setGameHistory] = useState<string[]>([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)
  const [position, setPosition] = useState(chess.fen())
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white')

  useEffect(() => {
    try {
      const tempChess = new Chess()
      tempChess.loadPgn(pgn)
      const history = tempChess.history()
      setGameHistory(history)
      
      // Reset to start position
      chess.reset()
      setPosition(chess.fen())
      setCurrentMoveIndex(0)
    } catch (error) {
      console.error('Error loading PGN:', error)
    }
  }, [pgn, chess])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isAutoPlaying && currentMoveIndex < gameHistory.length) {
      interval = setInterval(() => {
        if (currentMoveIndex < gameHistory.length) {
          goToMove(currentMoveIndex + 1)
        } else {
          setIsAutoPlaying(false)
        }
      }, 1000)
    }
  
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAutoPlaying, currentMoveIndex, gameHistory.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const goToMove = (moveIndex: number) => {
    chess.reset()
    
    for (let i = 0; i < moveIndex; i++) {
      if (i < gameHistory.length) {
        chess.move(gameHistory[i])
      }
    }
    
    setPosition(chess.fen())
    setCurrentMoveIndex(moveIndex)
    
    if (moveIndex >= gameHistory.length) {
      setIsAutoPlaying(false)
    }
  }

  const nextMove = () => {
    if (currentMoveIndex < gameHistory.length) {
      goToMove(currentMoveIndex + 1)
    } else {
      setIsAutoPlaying(false)
    }
  }

  const previousMove = () => {
    if (currentMoveIndex > 0) {
      goToMove(currentMoveIndex - 1)
    }
  }

  const resetGame = () => {
    setIsAutoPlaying(false)
    goToMove(0)
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const flipBoard = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white')
  }

  if (!pgn) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-500">No game to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      {title && (
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
      )}
      
      {/* Chessboard */}
      <div className="mb-6">
        <div className="max-w-md mx-auto">
          <Chessboard
            position={position}
            boardOrientation={boardOrientation}
            arePiecesDraggable={false}
            boardWidth={400}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
            }}
            customDarkSquareStyle={{
              backgroundColor: '#4a5568'
            }}
            customLightSquareStyle={{
              backgroundColor: '#718096'
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-2 mb-4">
        <button
          onClick={resetGame}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Reset to start"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={previousMove}
          disabled={currentMoveIndex === 0}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous move"
        >
          <SkipBack className="h-4 w-4 rotate-180" />
        </button>

        <button
          onClick={toggleAutoPlay}
          disabled={currentMoveIndex >= gameHistory.length}
          className="p-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isAutoPlaying ? "Pause" : "Auto play"}
        >
          {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          onClick={nextMove}
          disabled={currentMoveIndex >= gameHistory.length}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next move"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        <button
          onClick={() => goToMove(gameHistory.length)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Go to end"
        >
          <SkipForward className="h-4 w-4" />
        </button>

        <button
          onClick={flipBoard}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Flip board"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Move Counter */}
      <div className="text-center text-sm text-gray-400 mb-4">
        Move {currentMoveIndex} of {gameHistory.length}
        {currentMoveIndex > 0 && (
          <span className="ml-2 font-mono text-gray-300">
            {Math.ceil(currentMoveIndex / 2)}. {gameHistory[currentMoveIndex - 1]}
          </span>
        )}
      </div>

      {/* Move History */}
      <div className="max-h-32 overflow-y-auto bg-gray-800 rounded-lg p-2">
        <div className="grid grid-cols-2 gap-1 text-sm font-mono">
          {gameHistory.map((move, index) => {
            const moveNumber = Math.floor(index / 2) + 1
            const isWhiteMove = index % 2 === 0
            const isCurrentMove = index === currentMoveIndex - 1

            return (
              <button
                key={index}
                onClick={() => goToMove(index + 1)}
                className={`text-left p-1 rounded hover:bg-gray-700 transition-colors ${
                  isCurrentMove ? 'bg-green-900/30 text-green-400' : 'text-gray-300'
                }`}
              >
                {isWhiteMove && `${moveNumber}. `}{move}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}