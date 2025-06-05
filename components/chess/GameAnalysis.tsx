'use client'

import { useState, useEffect } from 'react'
import { Chess } from 'chess.js'
import StockfishEngine from '../../lib/stockfish'
import { Brain, TrendingUp, Move, AlertCircle } from 'lucide-react'

type AnalysisResult = {
  evaluation: number
  bestMove: string
  principalVariation: string[]
}

type GameAnalysisProps = {
  pgn?: string
  fen?: string
}

export default function GameAnalysis({ pgn, fen }: GameAnalysisProps) {
  const [engine, setEngine] = useState<StockfishEngine | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<string>(fen || '')

  useEffect(() => {
    // Initialize Stockfish engine
    const stockfish = new StockfishEngine()
    setEngine(stockfish)

    // Cleanup on unmount
    return () => {
      stockfish.destroy()
    }
  }, [])

  useEffect(() => {
    if (pgn && !fen) {
      // Extract FEN from PGN
      const chess = new Chess()
      try {
        chess.loadPgn(pgn)
        setCurrentPosition(chess.fen())
      } catch (error) {
        console.error('Invalid PGN:', error)
      }
    }
  }, [pgn, fen])

  const analyzePosition = async () => {
    if (!engine || !currentPosition) return

    setIsAnalyzing(true)
    try {
      const result = await engine.evaluatePosition(currentPosition, 15)
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getEvaluationColor = (evaluation: number) => {
    if (evaluation > 1) return 'text-green-600'
    if (evaluation > 0.5) return 'text-green-500'
    if (evaluation > -0.5) return 'text-yellow-500'
    if (evaluation > -1) return 'text-orange-500'
    return 'text-red-500'
  }

  const getEvaluationText = (evaluation: number) => {
    if (Math.abs(evaluation) > 5) return evaluation > 0 ? 'White winning' : 'Black winning'
    if (Math.abs(evaluation) > 2) return evaluation > 0 ? 'White much better' : 'Black much better'
    if (Math.abs(evaluation) > 1) return evaluation > 0 ? 'White better' : 'Black better'
    if (Math.abs(evaluation) > 0.5) return evaluation > 0 ? 'White slightly better' : 'Black slightly better'
    return 'Equal position'
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-600" />
          Stockfish Analysis
        </h3>
        <button
          onClick={analyzePosition}
          disabled={isAnalyzing || !currentPosition}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              <span>Analyze Position</span>
            </>
          )}
        </button>
      </div>

      {!currentPosition && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No position to analyze</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Evaluation */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Position Evaluation</h4>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getEvaluationColor(analysis.evaluation)}`}>
                {analysis.evaluation > 0 ? '+' : ''}{analysis.evaluation.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">{getEvaluationText(analysis.evaluation)}</span>
            </div>
          </div>

          {/* Best Move */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
              <Move className="h-4 w-4 mr-2" />
              Best Move
            </h4>
            <span className="text-lg font-mono font-bold text-blue-600">
              {analysis.bestMove}
            </span>
          </div>

          {/* Principal Variation */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Principal Variation</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.principalVariation.slice(0, 10).map((move, index) => (
                <span 
                  key={index}
                  className="bg-white px-2 py-1 rounded text-sm font-mono border"
                >
                  {move}
                </span>
              ))}
              {analysis.principalVariation.length > 10 && (
                <span className="text-gray-500 text-sm">...</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}