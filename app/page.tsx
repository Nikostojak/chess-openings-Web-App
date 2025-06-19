// app/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Brain, TrendingUp, Database, BookOpen, 
  BarChart3, FileText, Upload, Search,
  Trophy, Zap, Target, ChevronRight,
  Activity, Users, Clock, ArrowUpRight
} from 'lucide-react'

export default function Home() {
  const [hoveredOpening, setHoveredOpening] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #1a1a1a,
              #1a1a1a 10px,
              transparent 10px,
              transparent 20px
            )`
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-300">AI-Powered Opening Analysis</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Know Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                  {" "}Openings
                </span>
                <br />
                Win More Games
              </h1>

              <p className="text-xl text-gray-300 mb-8">
                Track your performance, analyze with Stockfish, and discover which 
                openings work best for your playing style. Learn from your games 
                and elite tournament data.
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <span>Stockfish Analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span>Elite Game Database</span>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  <span>Personal Statistics</span>
                </div>
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-purple-400" />
                  <span>Import from Anywhere</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard">
                  <motion.button
                    className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Analyzing
                    <ArrowUpRight className="h-5 w-5" />
                  </motion.button>
                </Link>
                
                <Link href="/games/add">
                  <motion.button
                    className="bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-gray-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Import Your Games
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Right - Live Stats Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
                {/* Mini Dashboard */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Your Opening Performance</h3>
                  
                  {/* Opening Stats */}
                  <div className="space-y-3">
                    {[
                      { opening: "Sicilian Defense", games: 45, winRate: 67, trend: "+5%" },
                      { opening: "Queen's Gambit", games: 38, winRate: 55, trend: "+2%" },
                      { opening: "King's Indian", games: 29, winRate: 48, trend: "-3%" },
                      { opening: "French Defense", games: 24, winRate: 71, trend: "+8%" }
                    ].map((stat) => (
                      <motion.div
                        key={stat.opening}
                        className="bg-gray-800/50 rounded-lg p-3 cursor-pointer border border-gray-700 hover:border-gray-600 transition-all"
                        onMouseEnter={() => setHoveredOpening(stat.opening)}
                        onMouseLeave={() => setHoveredOpening(null)}
                        whileHover={{ x: 5 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{stat.opening}</div>
                            <div className="text-sm text-gray-400">{stat.games} games played</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">{stat.winRate}%</div>
                            <div className={`text-sm ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                              {stat.trend}
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.winRate}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 p-3 rounded-lg text-sm font-medium transition-colors">
                    <Brain className="h-4 w-4 mb-1 mx-auto" />
                    Analyze Game
                  </button>
                  <button className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 p-3 rounded-lg text-sm font-medium transition-colors">
                    <Search className="h-4 w-4 mb-1 mx-auto" />
                    Find Weakness
                  </button>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute -top-4 -right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                2.4M+ Games
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Master Your Openings in 3 Steps
            </h2>
            <p className="text-xl text-gray-400">
              Simple, powerful tools to improve your chess
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Import Your Games",
                description: "Upload PGN files or import directly from Lichess and Chess.com",
                icon: Upload,
                color: "text-blue-400"
              },
              {
                step: "2", 
                title: "Analyze Performance",
                description: "See win rates, common mistakes, and get Stockfish evaluations",
                icon: Brain,
                color: "text-green-400"
              },
              {
                step: "3",
                title: "Learn & Improve",
                description: "Study elite games, track progress, and master your repertoire",
                icon: TrendingUp,
                color: "text-purple-400"
              }
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="relative"
                >
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all h-full">
                    <div className="text-6xl font-bold text-gray-800 mb-4">{item.step}</div>
                    <Icon className={`h-12 w-12 ${item.color} mb-4`} />
                    <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Everything You Need to
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                  {" "}Understand Your Game
                </span>
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Database,
                    title: "Complete Opening Database",
                    description: "Access detailed statistics for every ECO code with master game data"
                  },
                  {
                    icon: Target,
                    title: "Weakness Detection",
                    description: "AI identifies patterns in your losses and suggests improvements"
                  },
                  {
                    icon: Trophy,
                    title: "Elite Game Analysis",
                    description: "Learn from World Championship and top tournament games"
                  },
                  {
                    icon: BarChart3,
                    title: "Visual Progress Tracking",
                    description: "Beautiful charts showing your improvement over time"
                  }
                ].map((feature, i) => {
                  const Icon = feature.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                          <Icon className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                        <p className="text-gray-400">{feature.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Live Opening Stats */}
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-semibold mb-6">Popular Openings Right Now</h3>
              
              <div className="space-y-4">
                {[
                  { code: "B90", name: "Sicilian Najdorf", popularity: 89, elite: true },
                  { code: "C54", name: "Italian Game", popularity: 76, elite: false },
                  { code: "D85", name: "Grünfeld Defense", popularity: 71, elite: true },
                  { code: "E60", name: "King's Indian", popularity: 68, elite: false },
                  { code: "A45", name: "Queen's Pawn Game", popularity: 65, elite: false }
                ].map((opening) => (
                  <div key={opening.code} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded">
                        {opening.code}
                      </span>
                      <div>
                        <div className="font-medium">{opening.name}</div>
                        {opening.elite && (
                          <span className="text-xs text-yellow-400">★ Elite Choice</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400"
                          style={{ width: `${opening.popularity}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400">{opening.popularity}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/openings">
                <button className="w-full mt-6 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-medium transition-colors">
                  Explore All Openings →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-green-900/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2.4M+", label: "Games Analyzed" },
              { value: "15K+", label: "Active Users" },
              { value: "500+", label: "Opening Variations" },
              { value: "98%", label: "Analysis Accuracy" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-4xl font-bold text-green-400 mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start Your Opening Journey Today
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of players who are improving their game with data-driven insights
          </p>

          <Link href="/games/add">
            <motion.button
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Analyze Your First Game Free
            </motion.button>
          </Link>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Instant Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>No Credit Card</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}