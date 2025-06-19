// app/training/blitz/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import TrainingTimer from '@/components/training/TrainingTimer'
import TrainingQuestion from '@/components/training/TrainingQuestion'
import { 
  Zap, Trophy, Target, TrendingUp, 
  Award, Clock, ChevronRight, Play,
  RotateCcw, Share2, BarChart3, Activity,
  ArrowUpRight
} from 'lucide-react'

type SessionState = 'setup' | 'playing' | 'finished'

interface Session {
  id: string
  mode: string
  questionsCount: number
  timePerMove: number
}

interface Question {
  index: number
  position: string
  openingName: string
  moveNumber: number
  difficulty: number
  hint?: string
  choices: string[]
}

export default function BlitzTrainingPage() {
  const router = useRouter()
  const [sessionState, setSessionState] = useState<SessionState>('setup')
  const [session, setSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  
  const currentQuestion = questions[currentQuestionIndex]
  
  // Start new session
  const startSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/training/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'blitz',
          difficulty 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSession(data.session)
        setQuestions(data.questions)
        setCorrectAnswers(
          data._answers.reduce((acc: any, ans: any, idx: number) => {
            acc[idx] = ans.correct
            return acc
          }, {})
        )
        setSessionState('playing')
        setCurrentQuestionIndex(0)
        setScore(0)
        setStreak(0)
        setResults([])
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle answer submission
  const handleAnswer = async (userMove: string, timeSpent: number) => {
    if (!session || !currentQuestion) return
    
    const correctMove = correctAnswers[currentQuestionIndex]
    const isCorrect = userMove === correctMove
    
    // Update local state immediately
    if (isCorrect) {
      const basePoints = 100
      const timeBonus = Math.max(0, (session.timePerMove * 1000 - timeSpent) / 100)
      const streakBonus = streak * 10
      const points = Math.round(basePoints + timeBonus + streakBonus)
      
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      setMaxStreak(prev => Math.max(prev, streak + 1))
    } else {
      setStreak(0)
      if (userMove === 'skip') {
        setScore(prev => Math.max(0, prev - 50))
      }
    }
    
    // Save result
    const result = {
      questionIndex: currentQuestionIndex,
      isCorrect,
      userMove,
      correctMove,
      timeSpent,
      points: isCorrect ? 100 : 0
    }
    setResults(prev => [...prev, result])
    
    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      finishSession()
    }
    
    // Send answer to backend (async, don't wait)
    fetch('/api/training/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        questionIndex: currentQuestionIndex,
        userMove,
        timeSpent,
        openingId: 'temp', // TODO: Get from question
        position: currentQuestion.position,
        correctMove
      })
    })
  }
  
  // Handle time up
  const handleTimeUp = () => {
    handleAnswer('timeout', session?.timePerMove ? session.timePerMove * 1000 : 10000)
  }
  
  // Finish session
  const finishSession = async () => {
    setSessionState('finished')
    
    // Update session as completed
    if (session) {
      await fetch(`/api/training/session/${session.id}/complete`, {
        method: 'POST'
      })
    }
  }
  
  // Restart session
  const restartSession = () => {
    setSessionState('setup')
    setSession(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setScore(0)
    setStreak(0)
    setResults([])
  }
  
  // Calculate final stats
  const calculateStats = () => {
    const totalQuestions = results.length
    const correctAnswers = results.filter(r => r.isCorrect).length
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / totalQuestions / 1000
    
    return {
      totalQuestions,
      correctAnswers,
      accuracy,
      avgTime,
      maxStreak,
      finalScore: score
    }
  }
  
  // Render based on state
  if (sessionState === 'setup') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
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

        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-2 mb-6">
              <Activity className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">Lightning Fast Training</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Blitz 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {" "}Opening Trainer
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Test your opening knowledge under time pressure. 
              10 seconds per move, bonus points for speed!
            </p>
          </motion.div>
          
          {/* Mode Selection */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-800"
          >
            <h2 className="text-2xl font-semibold mb-6">Choose Difficulty</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <motion.button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    difficulty === level
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="text-lg font-semibold mb-2 capitalize">{level}</div>
                  <div className="text-sm text-gray-400">
                    {level === 'easy' && 'Popular openings, early moves'}
                    {level === 'medium' && 'Mixed openings, deeper lines'}
                    {level === 'hard' && 'Rare lines, complex positions'}
                  </div>
                  <div className="mt-3 text-yellow-400">
                    {level === 'easy' && '⭐'}
                    {level === 'medium' && '⭐⭐⭐'}
                    {level === 'hard' && '⭐⭐⭐⭐⭐'}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <motion.button
              onClick={startSession}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-4 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Start Blitz Training
                </>
              )}
            </motion.button>
          </motion.div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Time Pressure",
                description: "10 seconds per move, bonus points for speed",
                color: "text-yellow-400"
              },
              {
                icon: Target,
                title: "Adaptive Learning",
                description: "Questions adapt to your performance",
                color: "text-green-400"
              },
              {
                icon: Trophy,
                title: "Track Progress",
                description: "Earn XP and unlock achievements",
                color: "text-purple-400"
              }
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 text-center border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <Icon className={`h-8 w-8 ${feature.color} mx-auto mb-3`} />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  if (sessionState === 'playing' && currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Timer at top */}
          <div className="flex justify-center mb-8">
            <TrainingTimer
              timeLimit={session?.timePerMove || 10}
              onTimeUp={handleTimeUp}
              key={currentQuestionIndex} // Reset timer for each question
            />
          </div>
          
          {/* Question */}
          <TrainingQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            score={score}
            streak={streak}
          />
        </div>
      </div>
    )
  }
  
  if (sessionState === 'finished') {
    const stats = calculateStats()
    
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-800"
          >
            {/* Results Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-4"
              >
                <Trophy className="h-10 w-10 text-yellow-400" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">
                Training Complete!
              </h1>
              <p className="text-xl text-gray-300">
                Final Score: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{stats.finalScore}</span>
              </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 bg-blue-600/20 rounded-xl border border-blue-600/30"
              >
                <div className="text-2xl font-bold text-blue-400">
                  {stats.accuracy.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center p-4 bg-green-600/20 rounded-xl border border-green-600/30"
              >
                <div className="text-2xl font-bold text-green-400">
                  {stats.correctAnswers}/{stats.totalQuestions}
                </div>
                <div className="text-sm text-gray-400">Correct</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center p-4 bg-orange-600/20 rounded-xl border border-orange-600/30"
              >
                <div className="text-2xl font-bold text-orange-400">
                  {stats.maxStreak}
                </div>
                <div className="text-sm text-gray-400">Best Streak</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center p-4 bg-purple-600/20 rounded-xl border border-purple-600/30"
              >
                <div className="text-2xl font-bold text-purple-400">
                  {stats.avgTime.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-400">Avg Time</div>
              </motion.div>
            </div>
            
            {/* Question by Question Results */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-300 mb-4">Question Review</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.isCorrect ? 'bg-green-600/10 border border-green-600/20' : 'bg-red-600/10 border border-red-600/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        result.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {result.isCorrect ? '✓' : '✗'}
                      </div>
                      <span className="font-medium">
                        Question {index + 1}: {questions[index]?.openingName}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {(result.timeSpent / 1000).toFixed(1)}s
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                onClick={restartSession}
                className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw className="h-5 w-5" />
                <span>Play Again</span>
              </motion.button>
              
              <motion.button
                onClick={() => router.push('/training/stats')}
                className="flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors border border-gray-700"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BarChart3 className="h-5 w-5" />
                <span>View Stats</span>
              </motion.button>
              
              <motion.button
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 className="h-5 w-5" />
                <span>Share Results</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }
  
  return null
}