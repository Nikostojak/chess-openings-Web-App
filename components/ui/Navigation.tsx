import Link from 'next/link'
import { Crown } from 'lucide-react'

export default function Navigation() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-gray-800" />
            <span className="text-lg font-medium text-gray-900">OpeningForge</span>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/openings" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Openings
            </Link>
            <Link href="/games" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Games
            </Link>
            <Link href="/stats" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Statistics
            </Link>
            
            <div className="flex items-center space-x-4 ml-8">
              <span className="text-sm text-gray-500 px-3 py-1 bg-blue-50 rounded-full">
                Demo Mode
              </span>
              <Link href="/games/add" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Add Game
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}