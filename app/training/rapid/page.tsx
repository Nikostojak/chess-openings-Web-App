// app/training/rapid/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import TrainingTimer from '@/components/training/TrainingTimer'
import TrainingQuestion from '@/components/training/TrainingQuestion'
import { 
  Target, Trophy, Clock, TrendingUp, 
  Award, ChevronRight, Play, HelpCircle,
  RotateCcw, Share2, BarChart3, Activity,
  Brain, Lightbulb
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

export default function RapidTrainingPage() {
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
  const [hintsUsed, setHintsUsed] = useState(0)
  
  const currentQuestion = questions[currentQuestionIndex]
  
  // Start new session
  const startSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/training/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: 'rapid',
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
        setHintsUsed(0)
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
      const basePoints = 150
      const timeBonus = Math.max(0, (30000 - timeSpent) / 300)
      const accuracyBonus = 50
      const difficultyBonus = currentQuestion.difficulty * 30
      const hintPenalty = hintsUsed * 25
      const points = Math.round(basePoints + timeBonus + accuracyBonus + difficultyBonus - hintPenalty)
      
      setScore(prev => prev + points)
      setStreak(prev => prev + 1)
      setMaxStreak(prev => Math.max(prev, streak + 1))
    } else {
      setStreak(0)
      setScore(prev => Math.max(0, prev - 25)) // Small penalty
    }
    
    // Save result
    const result = {
      questionIndex: currentQuestionIndex,
      isCorrect,
      userMove,
      correctMove,
      timeSpent,
      hintsUsed,
      points: isCorrect ? 150 : -25
    }
    setResults(prev => [...prev, result])
    
    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setHintsUsed(0) // Reset hints for next question
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
        correctMove,
        hints: hintsUsed
      })
    })
  }
  
  // Handle time up
  const handleTimeUp = () => {
    handleAnswer('timeout', 30000)
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
  
  // Calculate final stats
  const calculateStats = () => {
    const totalQuestions = results.length
    const correctAnswers = results.filter(r => r.isCorrect).length
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    const avgTime = results.reduce((sum, r) => sum + r.timeSpent, 0) / totalQuestions / 1000
    const totalHints = results.reduce((sum, r) => sum + r.hintsUsed, 0)
    
    return {
      totalQuestions,
      correctAnswers,
      accuracy,
      avgTime,
      maxStreak,
      finalScore: score,
      totalHints
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
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">Thoughtful Training Mode</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Rapid
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                {" "}Opening Trainer
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Balanced training with 30 seconds per move. 
              Take your time to think and use hints when needed!
            </p>
          </motion.div>
          
          {/* Mode Features */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-800"
          >
            <h2 className="text-2xl font-semibold mb-6">Rapid Mode Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-start space-x-3 bg-gray-800/30 p-4 rounded-xl border border-gray-700"
              >
                <Clock className="h-6 w-6 text-blue-400 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">30 Seconds Per Move</h3>
                  <p className="text-sm text-gray-400">
                    Enough time to calculate properly without rush
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-start space-x-3 bg-gray-800/30 p-4 rounded-xl border border-gray-700"
              >
                <Lightbulb className="h-6 w-6 text-green-400 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Hint System</h3>
                  <p className="text-sm text-gray-400">
                    Get help when stuck (costs some points)
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-start space-x-3 bg-gray-800/30 p-4 rounded-xl border border-gray-700"
              >
                <Brain className="h-6 w-6 text-purple-400 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Deeper Positions</h3>
                  <p className="text-sm text-gray-400">
                    More complex lines and variations
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-start space-x-3 bg-gray-800/30 p-4 rounded-xl border border-gray-700"
              >
                <Award className="h-6 w-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Accuracy Bonus</h3>
                  <p className="text-sm text-gray-400">
                    Extra points for thoughtful play
                  </p>
                </div>
              </motion.div>
            </div>
            
            {/* Difficulty Selection */}
            <h3 className="font-semibold mb-4">Choose Difficulty</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <motion.button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    difficulty === level
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1 capitalize">{level}</div>
                  <div className="text-sm text-gray-400">
                    {level === 'easy' && 'Common lines, 4-8 moves'}
                    {level === 'medium' && 'Varied lines, 6-12 moves'}
                    {level === 'hard' && 'Complex theory, 10+ moves'}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <motion.button
              onClick={startSession}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Target className="h-5 w-5 mr-2" />
                  Start Rapid Training
                </>
              )}
            </motion.button>
          </motion.div>
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
              timeLimit={30} // 30 seconds for rapid
              onTimeUp={handleTimeUp}
              key={currentQuestionIndex} // Reset timer for each question
            />
          </div>
          
          {/* Question with hint tracking */}
          <TrainingQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            score={score}
            streak={streak}
          />
          
          {/* Hint counter */}
          {hintsUsed > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-4"
            >
              <span className="text-sm text-gray-400">
                Hints used: {hintsUsed} (-{hintsUsed * 25} points)
              </span>
            </motion.div>
          )}
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
                className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-4"
              >
                <Trophy className="h-10 w-10 text-blue-400" />
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">
                Rapid Training Complete!
              </h1>
              <p className="text-xl text-gray-300">
                Final Score: <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{stats.finalScore}</span>
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
                className="text-center p-4 bg-purple-600/20 rounded-xl border border-purple-600/30"
              >
                <div className="text-2xl font-bold text-purple-400">
                  {stats.avgTime.toFixed(1)}s
                </div>
                <div className="text-sm text-gray-400">Avg Time</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center p-4 bg-yellow-600/20 rounded-xl border border-yellow-600/30"
              >
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.totalHints}
                </div>
                <div className="text-sm text-gray-400">Hints Used</div>
              </motion.div>
            </div>
            
            {/* Feedback Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-blue-600/10 rounded-xl p-4 mb-8 text-center border border-blue-600/20"
            >
              <p className="text-blue-300">
                {stats.accuracy >= 80 
                  ? "Excellent performance! You're mastering these openings! 🎯"
                  : stats.accuracy >= 60
                  ? "Good job! Keep practicing to improve your accuracy. 💪"
                  : "Nice effort! Review the openings you missed and try again. 📚"
                }
              </p>
            </motion.div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                onClick={() => setSessionState('setup')}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl transition-colors"
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
                onClick={() => router.push('/training')}
                className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronRight className="h-5 w-5" />
                <span>Try Other Modes</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }
  
  return null
}