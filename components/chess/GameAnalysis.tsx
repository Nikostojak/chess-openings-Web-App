'use client'

import { useState, useEffect } from 'react'
import { chessAnalysisAPI, AnalysisResult } from '../../lib/chess-analysis'
import { Brain, TrendingUp, Move, AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react'

type GameAnalysisProps = {
  pgn?: string
  fen?: string
}

export default function GameAnalysis({ pgn, fen }: GameAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [analysisTime, setAnalysisTime] = useState<number | null>(null)

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'
        console.log('🔌 Testing backend connection to:', apiUrl)
        const response = await fetch(apiUrl)
        const connected = response.ok
        setBackendConnected(connected)
        
        if (connected) {
          const data = await response.json()
          console.log('✅ Backend connected:', data.message)
        } else {
          console.log('❌ Backend not responding')
        }
      } catch (err) {
        console.log('❌ Backend connection failed:', err)
        setBackendConnected(false)
      }
    }
    testConnection()
  }, [])

  const analyzePosition = async () => {
    if (!pgn && !fen) {
      setError('No position to analyze')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    const startTime = Date.now()
    
    try {
      console.log('🚀 Starting analysis...', { 
        pgn: pgn?.substring(0, 50) + (pgn && pgn.length > 50 ? '...' : ''), 
        fen 
      })
      
      const result = await chessAnalysisAPI.analyzePosition(pgn, fen, 12)
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      setAnalysis(result)
      setAnalysisTime(duration)
      console.log(`✅ Analysis complete in ${duration.toFixed(1)}s:`, result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed'
      setError(errorMessage)
      console.error('❌ Analysis error:', errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getEvaluationColor = (evaluation: number) => {
    if (Math.abs(evaluation) > 5) return 'text-blue-600' // Mate scenarios
    if (evaluation > 1) return 'text-green-600'
    if (evaluation > 0.5) return 'text-green-500'
    if (evaluation > -0.5) return 'text-yellow-500'
    if (evaluation > -1) return 'text-orange-500'
    return 'text-red-500'
  }

  const getEvaluationText = (evaluation: number, mateIn?: number) => {
    if (mateIn) {
      return mateIn > 0 ? `Mate in ${mateIn}` : `Mated in ${Math.abs(mateIn)}`
    }
    
    if (Math.abs(evaluation) > 2) return evaluation > 0 ? 'White winning' : 'Black winning'
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
          {backendConnected !== null && (
            <span className="ml-2" title={backendConnected ? 'Backend Connected' : 'Backend Disconnected'}>
              {backendConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </span>
          )}
          {analysisTime && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {analysisTime.toFixed(1)}s
            </span>
          )}
        </h3>
        <button
          onClick={analyzePosition}
          disabled={isAnalyzing || (!pgn && !fen) || !backendConnected}
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

      {/* Backend Status Warning */}
      {backendConnected === false && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <WifiOff className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Backend Disconnected</p>
              <p className="text-red-600 text-sm mt-1">
                Make sure Python backend is running:
              </p>
              <code className="text-xs bg-red-100 px-2 py-1 rounded mt-2 block">
                cd backend && source venv/bin/activate && python main.py
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Backend Connected Info */}
      {backendConnected === true && !analysis && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-green-600" />
            <p className="text-green-700 text-sm">
              Stockfish engine ready • Click &quot;Analyze Position&quot; to start
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-500 mb-2 font-medium">{error}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>API URL: {process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8001'}</p>
            {error.includes('fetch') && (
              <p className="text-xs">Make sure backend is running and accessible</p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!pgn && !fen && !error && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 mb-2">Enter a PGN to analyze the position</p>
          <p className="text-xs text-gray-400">
            Paste chess moves in any of the input fields above
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Position Evaluation */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Position Evaluation
            </h4>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getEvaluationColor(analysis.evaluation)}`}>
                {analysis.mateIn 
                  ? `M${analysis.mateIn}` 
                  : `${analysis.evaluation > 0 ? '+' : ''}${analysis.evaluation.toFixed(2)}`
                }
              </span>
              <span className="text-sm text-gray-600">
                {getEvaluationText(analysis.evaluation, analysis.mateIn)}
              </span>
            </div>
          </div>

          {/* Best Move */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
              <Move className="h-4 w-4 mr-2" />
              Best Move
            </h4>
            <span className="text-lg font-mono font-bold text-blue-600">
              {analysis.bestMove || 'None'}
            </span>
          </div>

          {/* Principal Variation */}
          {analysis.principalVariation && analysis.principalVariation.length > 0 && (
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
          )}

          {/* Analysis Stats */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm text-blue-700">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>Analysis completed</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Depth: 12</span>
                {analysisTime && <span>Time: {analysisTime.toFixed(1)}s</span>}
                <span>Engine: Stockfish 16</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-2 rounded border-t">
          <div className="font-mono">
            API: {process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'} | 
            Backend: {backendConnected ? '🟢' : '🔴'} | 
            PGN: {pgn ? '✅' : '❌'} ({pgn?.length || 0} chars) | 
            FEN: {fen ? '✅' : '❌'}
          </div>
        </div>
      )}
    </div>
  )
}