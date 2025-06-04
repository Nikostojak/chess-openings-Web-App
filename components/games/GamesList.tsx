'use client'

import { useState } from 'react'
import { Calendar, User, Trophy, Clock, Edit2, Trash2, FileText } from 'lucide-react'

type Game = {
  id: string
  date: Date
  opponent: string
  result: string
  opening: string
  timeControl: string | null
  notes: string | null
}

export default function GamesList({ games }: { games: Game[] }) {
  const [deleteGame, setDeleteGame] = useState<string | null>(null)

  const handleDelete = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh page
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting game:', error)
    }
  }

  if (games.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
        <p className="text-gray-600 mb-4">Start tracking your chess games to see them here</p>
        <a 
          href="/games/add"
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Add your first game
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden">
      <div className="divide-y divide-gray-100">
        {games.map((game) => (
          <div key={game.id} className="p-6 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              
              {/* Game Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    game.result === 'win' ? 'bg-emerald-500' : 
                    game.result === 'loss' ? 'bg-red-500' : 'bg-amber-500'
                  }`}></div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">{game.opponent}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Trophy className={`h-4 w-4 ${
                      game.result === 'win' ? 'text-emerald-500' : 
                      game.result === 'loss' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <span className="text-sm font-medium capitalize text-gray-700">{game.result}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(game.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Opening:</span>
                    <span>{game.opening}</span>
                  </div>
                  
                  {game.timeControl && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{game.timeControl}</span>
                    </div>
                  )}
                </div>
                
                {game.notes && (
                  <div className="flex items-start space-x-2 mt-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 mt-0.5" />
                    <p className="line-clamp-2">{game.notes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setDeleteGame(game.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Game</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this game? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteGame)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteGame(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}