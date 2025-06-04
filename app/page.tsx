import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-24">
        
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          
          {/* Sparkle decorations */}
          <div className="absolute -top-8 left-1/4 transform -translate-x-4">
            <Sparkles className="h-8 w-8 text-amber-500 rotate-12" />
          </div>
          <div className="absolute -top-4 right-1/4 transform translate-x-4">
            <Sparkles className="h-6 w-6 text-emerald-500 -rotate-12" />
          </div>
          <div className="absolute top-12 left-1/6">
            <Sparkles className="h-5 w-5 text-blue-500 rotate-45" />
          </div>
          <div className="absolute top-8 right-1/6">
            <Sparkles className="h-7 w-7 text-violet-500 -rotate-45" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Chess opening
            <br />
            <span className="text-gray-700">tracker</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Track your chess games and analyze opening performance. 
            <br />
            Turn data into better chess decisions.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-sm mb-16">
          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Start tracking your chess journey..."
              className="w-full p-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium text-center">
              Get started
            </Link>
            <Link href="/dashboard" className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium text-center">
              View demo
            </Link>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Try example features:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Game Tracker</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Opening Stats</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Mini Games</span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">Performance Analysis</span>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Made with ♥ by chess enthusiasts for chess players
          </p>
        </div>

      </div>
    </div>
  )
}