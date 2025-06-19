'use client'

import { useState, useEffect } from 'react'
import { chessAnalysisAPI, AnalysisResult } from '../../lib/chess-analysis'
import { Brain, TrendingUp, Move, AlertCircle, Wifi, WifiOff, Clock, CheckCircle, Settings } from 'lucide-react'

type GameAnalysisProps = {
  pgn?: string
  fen?: string
}

type BackendStatus = {
  connected: boolean
  message?: string
  stockfish_available?: boolean
  stockfish_path?: string
  platform?: string
}

export default function GameAnalysis({ pgn, fen }: GameAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [analysisTime, setAnalysisTime] = useState<number | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'
        console.log('🔌 Testing backend connection to:', apiUrl)
        
        const response = await fetch(apiUrl)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Backend connected:', data)
          setBackendStatus({
            connected: true,
            message: data.message,
            stockfish_available: data.stockfish_status?.includes('Available'),
            stockfish_path: data.stockfish_path,
            platform: data.platform
          })
        } else {
          console.log('❌ Backend returned error:', response.status)
          setBackendStatus({
            connected: false,
            message: `Backend error: ${response.status}`
          })
        }
      } catch (err) {
        console.log('❌ Backend connection failed:', err)
        setBackendStatus({
          connected: false,
          message: err instanceof Error ? err.message : 'Connection failed'
        })
      }
    }

    testConnection()
  }, [])

  // Test Stockfish health
  const testStockfishHealth = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/health`)
      const data = await response.json()
      
      console.log('🏥 Health check result:', data)
      setBackendStatus(prev => ({
        ...prev,
        connected: true,
        stockfish_available: data.stockfish_available,
        message: data.message
      }))
    } catch (err) {
      console.error('❌ Health check failed:', err)
    }
  }

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
        fen,
        apiUrl: process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'
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
    if (Math.abs(evaluation) > 5) return 'text-blue-400' // Mate scenarios
    if (evaluation > 1) return 'text-green-400'
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
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-400" />
          Stockfish Analysis
          {backendStatus && (
            <span className="ml-2" title={backendStatus.connected ? 'Backend Connected' : 'Backend Disconnected'}>
              {backendStatus.connected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </span>
          )}
          {analysisTime && (
            <span className="ml-2 text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
              {analysisTime.toFixed(1)}s
            </span>
          )}
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle debug info"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          <button
            onClick={analyzePosition}
            disabled={isAnalyzing || (!pgn && !fen) || !backendStatus?.connected}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
      </div>

      {/* Backend Status */}
      {backendStatus && (
        <div className={`mb-4 p-4 rounded-lg border ${
          backendStatus.connected 
            ? (backendStatus.stockfish_available 
                ? 'bg-green-900/20 border-green-700' 
                : 'bg-yellow-900/20 border-yellow-700')
            : 'bg-red-900/20 border-red-700'
        }`}>
          <div className="flex items-start space-x-2">
            {backendStatus.connected ? (
              backendStatus.stockfish_available ? (
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              )
            ) : (
              <WifiOff className="h-5 w-5 text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                backendStatus.connected 
                  ? (backendStatus.stockfish_available ? 'text-green-400' : 'text-yellow-400')
                  : 'text-red-400'
              }`}>
                {backendStatus.connected 
                  ? (backendStatus.stockfish_available 
                      ? '✅ Stockfish Ready' 
                      : '⚠️ Backend Connected, Stockfish Missing')
                  : '❌ Backend Disconnected'
                }
              </p>
              <p className={`text-sm mt-1 ${
                backendStatus.connected 
                  ? (backendStatus.stockfish_available ? 'text-green-500' : 'text-yellow-500')
                  : 'text-red-500'
              }`}>
                {backendStatus.message}
              </p>
              
              {!backendStatus.connected && (
                <div className="mt-2 text-xs text-red-400">
                  <p>Make sure Python backend is running:</p>
                  <code className="block bg-red-900/30 px-2 py-1 rounded mt-1">
                    cd backend && source venv/bin/activate && python main.py
                  </code>
                </div>
              )}
              
              {backendStatus.connected && !backendStatus.stockfish_available && (
                <div className="mt-2">
                  <button
                    onClick={testStockfishHealth}
                    className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                  >
                    Test Stockfish
                  </button>
                  <div className="text-xs text-yellow-500 mt-1">
                    <p>Install Stockfish:</p>
                    <code className="block bg-yellow-900/30 px-2 py-1 rounded mt-1">
                      {backendStatus.platform === 'Darwin' ? 'brew install stockfish' :
                       backendStatus.platform === 'Linux' ? 'sudo apt-get install stockfish' :
                       'Download from stockfishchess.org'}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {showDebug && (
        <div className="mb-4 text-xs bg-gray-800 p-3 rounded-lg border border-gray-700 font-mono">
          <p><strong>Debug Info:</strong></p>
          <p>API URL: {process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'}</p>
          <p>Backend: {backendStatus?.connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
          <p>Stockfish: {backendStatus?.stockfish_available ? '🟢 Available' : '🔴 Missing'}</p>
          <p>Stockfish Path: {backendStatus?.stockfish_path || 'Unknown'}</p>
          <p>Platform: {backendStatus?.platform || 'Unknown'}</p>
          <p>PGN Length: {pgn?.length || 0} chars</p>
          <p>FEN: {fen ? '✅ Present' : '❌ Missing'}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!pgn && !fen && !error && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 mb-2">Enter a PGN to analyze the position</p>
          <p className="text-xs text-gray-500">
            Paste chess moves in the input fields above
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Position Evaluation */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
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
              <span className="text-sm text-gray-400">
                {getEvaluationText(analysis.evaluation, analysis.mateIn)}
              </span>
            </div>
          </div>

          {/* Best Move */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
              <Move className="h-4 w-4 mr-2" />
              Best Move
            </h4>
            <span className="text-lg font-mono font-bold text-green-400">
              {analysis.bestMove || 'None'}
            </span>
          </div>

          {/* Principal Variation */}
          {analysis.principalVariation && analysis.principalVariation.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4">
              <h4 className="font-semibold text-gray-300 mb-2">Principal Variation</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.principalVariation.slice(0, 10).map((move, index) => (
                  <span 
                    key={index}
                    className="bg-gray-700 px-2 py-1 rounded text-sm font-mono border border-gray-600 text-gray-300"
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
          <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700">
            <div className="flex items-center justify-between text-sm text-blue-400">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3" />
                <span>Analysis completed</span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Depth: 12</span>
                {analysisTime && <span>Time: {analysisTime.toFixed(1)}s</span>}
                <span>Engine: Stockfish</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}