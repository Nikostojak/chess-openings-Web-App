import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Trophy, Clock } from 'lucide-react'
import ChessboardViewer from '@/components/chess/ChessboardViewer'

async function getGame(id: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id }
    })
    return game
  } catch (error) {
    console.error('Error fetching game:', error)
    return null
  }
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const game = await getGame(params.id)

  if (!game) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <div className="mb-8">
          <Link href="/games" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to games
          </Link>
        </div>

        {/* Game Header */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              vs {game.opponent}
            </h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              game.result === 'win' ? 'bg-green-100 text-green-700' :
              game.result === 'loss' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {game.result.charAt(0).toUpperCase() + game.result.slice(1)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>{new Date(game.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>{game.opening}</span>
            </div>
            
            {game.timeControl && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{game.timeControl}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-gray-500" />
              <span className="capitalize">{game.result}</span>
            </div>
          </div>

          {game.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{game.notes}</p>
            </div>
          )}
        </div>

        {/* Chessboard - if PGN exists */}
        {game.notes?.includes('PGN:') && (
          <ChessboardViewer 
            pgn={game.notes.split('PGN:')[1]?.trim() || ''} 
            title="Game Replay"
          />
        )}
      </div>
    </div>
  )
}