// app/training/stats/page.tsx

import { prisma } from '@/lib/db'
import Link from 'next/link'
import { 
  Trophy, Target, Zap, Clock, 
  TrendingUp, Award, Star, Calendar,
  ChevronRight, BarChart3, Activity,
  Flame, ArrowUp
} from 'lucide-react'

async function getTrainingStats(userId: string) {
  const stats = await prisma.trainingStats.findUnique({
    where: { userId },
    include: {
      openingStats: {
        include: {
          opening: true
        },
        orderBy: {
          mastery: 'desc'
        },
        take: 10
      }
    }
  })

  const recentSessions = await prisma.trainingSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  // Calculate level from XP
  const calculateLevel = (xp: number) => {
    const xpPerLevel = 1000
    return Math.floor(xp / xpPerLevel) + 1
  }

  const calculateNextLevelProgress = (xp: number) => {
    const xpPerLevel = 1000
    const currentLevelXp = xp % xpPerLevel
    return (currentLevelXp / xpPerLevel) * 100
  }

  return {
    stats,
    recentSessions,
    level: stats ? calculateLevel(stats.experience) : 1,
    levelProgress: stats ? calculateNextLevelProgress(stats.experience) : 0
  }
}

// Mock leaderboard data - in production, query top users
async function getLeaderboard() {
  return [
    { rank: 1, username: 'ChessMaster2024', xp: 15420, level: 15, streak: 42 },
    { rank: 2, username: 'OpeningWizard', xp: 14200, level: 14, streak: 28 },
    { rank: 3, username: 'BlitzKing', xp: 13500, level: 13, streak: 35 },
    { rank: 4, username: 'You', xp: 3200, level: 3, streak: 5, isCurrentUser: true },
    { rank: 5, username: 'TacticNinja', xp: 12800, level: 12, streak: 21 },
  ]
}

export default async function TrainingStatsPage() {
  const userId = 'temp-user-123' // TODO: Get from auth
  const { stats, recentSessions, level, levelProgress } = await getTrainingStats(userId)
  const leaderboard = await getLeaderboard()

  const achievements = [
    { id: 'first_session', name: 'First Steps', icon: '🎯', unlocked: true },
    { id: 'streak_5', name: '5 Day Streak', icon: '🔥', unlocked: stats?.currentStreak >= 5 },
    { id: 'xp_1000', name: '1000 XP', icon: '⭐', unlocked: stats?.experience >= 1000 },
    { id: 'accuracy_master', name: 'Accuracy Master', icon: '🎯', unlocked: false },
    { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', unlocked: false },
    { id: 'opening_expert', name: 'Opening Expert', icon: '👑', unlocked: false },
  ]

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

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-4">
            <Activity className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-300">Training Progress Overview</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            Training <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Statistics</span>
          </h1>
          <p className="text-gray-400">Track your progress and compete with others</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Stats Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Level & XP Card */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Level {level}</h2>
                  <p className="text-gray-400">{stats?.experience || 0} XP Total</p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
              
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-400">Progress to Level {level + 1}</span>
                <span className="font-medium text-green-400">{levelProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-800">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                <div className="text-sm text-gray-400">Sessions</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-800">
                <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">
                  {stats && stats.totalAttempts > 0 
                    ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-800">
                <Flame className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-400">{stats?.currentStreak || 0}</div>
                <div className="text-sm text-gray-400">Day Streak</div>
              </div>
              
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-800">
                <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-400">
                  {stats ? Math.round(stats.totalTime / 60) : 0}m
                </div>
                <div className="text-sm text-gray-400">Training Time</div>
              </div>
            </div>

            {/* Opening Mastery */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-400" />
                Opening Mastery
              </h3>
              
              {stats?.openingStats && stats.openingStats.length > 0 ? (
                <div className="space-y-3">
                  {stats.openingStats.map((os) => (
                    <div key={os.id} className="bg-gray-800/50 p-4 rounded-xl hover:bg-gray-800/70 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{os.opening.name}</span>
                        <span className="text-sm text-gray-400">
                          {os.correct}/{os.attempts} correct
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                              style={{ width: `${os.mastery}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-400">
                          {os.mastery}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Complete training sessions to see your opening mastery
                </p>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                Achievements
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl text-center transition-all ${
                      achievement.unlocked
                        ? 'bg-yellow-500/10 border-2 border-yellow-500/30'
                        : 'bg-gray-800/50 border-2 border-gray-700 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="text-sm font-medium">{achievement.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/training/blitz"
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-3 rounded-xl transition-all flex items-center justify-center font-semibold"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Start Blitz Training
                </Link>
                <Link
                  href="/training/custom"
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl transition-all flex items-center justify-center border border-gray-700"
                >
                  Custom Training
                </Link>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
                Weekly Leaderboard
              </h3>
              
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      user.isCurrentUser 
                        ? 'bg-blue-600/20 border-2 border-blue-500/30' 
                        : 'bg-gray-800/50 hover:bg-gray-800/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        user.rank <= 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' : 'bg-gray-700'
                      }`}>
                        {user.rank}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-gray-400">
                          Level {user.level} • {user.streak}🔥
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{user.xp.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link
                href="/training/leaderboard"
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center transition-colors"
              >
                View Full Leaderboard
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Recent Sessions */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                Recent Sessions
              </h3>
              
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <div className="text-sm font-medium">
                          {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} Training
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-400">{session.score}</div>
                        <div className="text-xs text-gray-500">{session.accuracy.toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No sessions yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}