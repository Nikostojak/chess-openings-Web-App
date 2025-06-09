'use client'

import { useState } from 'react'
import GameForm from '../../../components/forms/GameForm'
import LichessImport from '../../../components/import/LichessImport'
import PGNImport from '../../../components/import/PGNImport'
import GameAnalysis from '../../../components/chess/GameAnalysis'
import ChessboardViewer from '../../../components/chess/ChessboardViewer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AddGame() {
  const [currentPgn, setCurrentPgn] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left side - Input methods */}
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Manual Game Form */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Manually</h2>
                <GameForm onPgnChange={setCurrentPgn} />
              </div>

              {/* Import from PGN */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Import from PGN</h2>
                <PGNImport onPgnChange={setCurrentPgn} />
              </div>

              {/* Import from Lichess */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Import from Lichess</h2>
                <LichessImport onPgnChange={setCurrentPgn} />
              </div>
            </div>

            {/* Stockfish Analysis */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Stockfish Analysis</h2>
              <GameAnalysis pgn={currentPgn} />
            </div>
          </div>

          {/* Right side - Chessboard viewer */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Game Preview</h2>
            {currentPgn ? (
              <ChessboardViewer pgn={currentPgn} title="Current Game" />
            ) : (
              <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">♔</span>
                  </div>
                  <p className="text-gray-500">Enter a PGN to preview the game</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}