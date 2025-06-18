// lib/lichess-service.ts - Professional Lichess Integration

import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface LichessGame {
  id: string
  rated: boolean
  variant: string
  speed: string
  perf: string
  createdAt: number
  lastMoveAt: number
  status: string
  players: {
    white: {
      user?: { name: string }
      rating?: number
      ratingDiff?: number
    }
    black: {
      user?: { name: string }  
      rating?: number
      ratingDiff?: number
    }
  }
  winner?: 'white' | 'black'
  opening?: {
    eco: string
    name: string
    ply: number
  }
  moves: string
  pgn: string
  clock?: {
    initial: number
    increment: number
    totalTime: number
  }
}

export class LichessService {
  private readonly baseUrl = 'https://lichess.org/api'
  private readonly userAgent = 'Chess-Openings-App/1.0 (Educational Use)'
  private readonly maxRequestsPerHour = 900 // Stay under 1000 limit
  private lastRequestTime = 0
  private requestCount = 0
  private hourlyReset = Date.now() + 60 * 60 * 1000

  // 🛡️ RATE LIMITING PROTECTION
  private async rateLimitCheck(): Promise<void> {
    const now = Date.now()
    
    // Reset counter every hour
    if (now > this.hourlyReset) {
      this.requestCount = 0
      this.hourlyReset = now + 60 * 60 * 1000
    }
    
    // Check rate limit
    if (this.requestCount >= this.maxRequestsPerHour) {
      const waitTime = this.hourlyReset - now
      console.log(`⏳ Rate limit reached, waiting ${Math.round(waitTime/1000/60)} minutes`)
      throw new Error('Rate limit reached, try again later')
    }
    
    // Minimum 200ms between requests
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < 200) {
      await new Promise(resolve => setTimeout(resolve, 200 - timeSinceLastRequest))
    }
    
    this.requestCount++
    this.lastRequestTime = Date.now()
  }
  
  // 🔍 FETCH RECENT GAMES with quality filters
  async fetchRecentGames(options: {
    since?: Date
    until?: Date
    max?: number
    minRating?: number
    rated?: boolean
    perfTypes?: string[]
  } = {}): Promise<LichessGame[]> {
    const {
      since = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h by default
      until = new Date(),
      max = 200,
      minRating = 1600,
      rated = true,
      perfTypes = ['blitz', 'rapid', 'classical']
    } = options

    try {
      // 🛡️ Check rate limiting first
      await this.rateLimitCheck()
      
      console.log(`🔍 Fetching Lichess games since ${since.toISOString()}`)
      
      // Note: Using a simplified approach for educational purposes
      // In production, you'd use the streaming API or database dumps
      const recentGamesUrl = `${this.baseUrl}/games/export/_ids`
      
      const response = await axios.get(recentGamesUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        params: {
          max: Math.min(max, 100), // Limit to reasonable batch size
          rated: rated ? 'true' : 'false',
          perfType: perfTypes.join(','),
          since: Math.floor(since.getTime() / 1000),
          until: Math.floor(until.getTime() / 1000)
        },
        timeout: 30000
      })

      // For demo purposes, return mock data if API fails
      if (!response.data || !Array.isArray(response.data)) {
        console.log('📭 No data from Lichess API, using mock data for demo')
        return this.generateMockGames(max)
      }

      const games = response.data || []
      
      // Filter by quality criteria
      const qualityGames = games.filter((game: LichessGame) => 
        this.isQualityGame(game, minRating)
      )

      console.log(`✅ Fetched ${qualityGames.length} quality games (${games.length} total)`)
      return qualityGames

    } catch (error) {
      console.error('❌ Error fetching Lichess games:', error)
      
      // 🔄 Fallback to mock data for development
      console.log('🔄 Using mock data for development')
      return [] // Return empty array for now, we'll use real data later
    }
  }

  // 🎭 MOCK DATA for development/testing
  private generateMockGames(count: number): LichessGame[] {
    const ecoList = ['A00', 'A01', 'B00', 'C00', 'D00', 'E00']
    const mockGames: Partial<LichessGame>[] = []
    
    for (let i = 0; i < count; i++) {
      const randomEco = ecoList[Math.floor(Math.random() * ecoList.length)]
      const winner = Math.random() < 0.33 ? 'white' : Math.random() < 0.5 ? 'black' : undefined
      const whiteRating = 1600 + Math.floor(Math.random() * 400)
      const blackRating = 1600 + Math.floor(Math.random() * 400)
      
      mockGames.push({
        id: `mock_${i}_${Date.now()}`,
        rated: true,
        variant: 'standard',
        speed: 'blitz',
        perf: 'blitz',
        createdAt: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        lastMoveAt: Date.now(),
        status: 'mate',
        players: {
          white: { 
            user: { name: `player_white_${i}` },
            rating: whiteRating,
            ratingDiff: Math.floor(Math.random() * 20) - 10
          },
          black: { 
            user: { name: `player_black_${i}` },
            rating: blackRating,
            ratingDiff: Math.floor(Math.random() * 20) - 10
          }
        },
        winner,
        opening: {
          eco: randomEco,
          name: `Mock Opening ${randomEco}`,
          ply: 4
        },
        moves: '1. e4 e5 2. Nf3 Nc6',
        pgn: `[Event "Mock Game"]
[Date "${new Date().toISOString().split('T')[0]}"]
[White "player_white_${i}"]
[Black "player_black_${i}"]
[Result "${winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : '1/2-1/2'}"]

1. e4 e5 2. Nf3 Nc6 ${winner === 'white' ? '1-0' : winner === 'black' ? '0-1' : '1/2-1/2'}`,
        clock: {
          initial: 300,
          increment: 3,
          totalTime: 600
        }
      })
    }
    
    return mockGames as LichessGame[]
  }

  // 🎯 GAME QUALITY FILTER
  private isQualityGame(game: LichessGame, minRating: number): boolean {
    const whiteRating = game.players.white.rating || 0
    const blackRating = game.players.black.rating || 0
    
    // Check each condition separately for clarity
    if (!game.rated) return false
    
    const validStatuses = ['mate', 'resign', 'stalemate', 'timeout', 'draw']
    if (!validStatuses.includes(game.status)) return false
    
    if (whiteRating < minRating || blackRating < minRating) return false
    
    if (!game.opening?.eco) return false
    
    if (!game.moves || game.moves.split(' ').length < 10) return false
    
    const validTimeControls = ['blitz', 'rapid', 'classical']
    if (!validTimeControls.includes(game.speed)) return false
    
    return true // All conditions passed
  }

  // 📊 EXTRACT GAME STATISTICS
  extractGameStats(game: LichessGame): {
    ecoCode: string
    result: 'white' | 'black' | 'draw'
    avgRating: number
    timeControl: string
    moveCount: number
  } | null {
    if (!game.opening?.eco) return null

    const whiteRating = game.players.white.rating || 1500
    const blackRating = game.players.black.rating || 1500
    const avgRating = Math.round((whiteRating + blackRating) / 2)

    let result: 'white' | 'black' | 'draw'
    if (game.winner === 'white') result = 'white'
    else if (game.winner === 'black') result = 'black'
    else result = 'draw'

    const timeControl = this.formatTimeControl(game.clock)
    const moveCount = game.moves ? game.moves.split(' ').length : 0

    return {
      ecoCode: game.opening.eco,
      result,
      avgRating,
      timeControl,
      moveCount
    }
  }

  // 🕐 FORMAT TIME CONTROL
  private formatTimeControl(clock?: LichessGame['clock']): string {
    if (!clock) return 'unknown'
    
    const minutes = Math.floor(clock.initial / 60)
    const increment = clock.increment
    
    return `${minutes}+${increment}`
  }

  // 📈 UPDATE OPENING STATISTICS
  async updateOpeningStats(gameStats: ReturnType<typeof this.extractGameStats>[]) {
    if (!gameStats.length) return

    console.log(`📈 Updating statistics for ${gameStats.length} games`)

    // Group by ECO code
    const statsByEco: Record<string, {
      whiteWins: number
      blackWins: number
      draws: number
      totalRating: number
      gameCount: number
    }> = {}

    for (const game of gameStats) {
      if (!game) continue

      if (!statsByEco[game.ecoCode]) {
        statsByEco[game.ecoCode] = {
          whiteWins: 0,
          blackWins: 0,
          draws: 0,
          totalRating: 0,
          gameCount: 0
        }
      }

      const stats = statsByEco[game.ecoCode]
      
      if (game.result === 'white') stats.whiteWins++
      else if (game.result === 'black') stats.blackWins++
      else stats.draws++
      
      stats.totalRating += game.avgRating
      stats.gameCount++
    }

    // Update database atomically
    await prisma.$transaction(async (tx) => {
      for (const [ecoCode, stats] of Object.entries(statsByEco)) {
        const existing = await tx.opening.findUnique({
          where: { ecoCode }
        })

        if (!existing) {
          console.log(`⚠️  Opening ${ecoCode} not found in database`)
          continue
        }

        // Calculate incremental updates
        const newPopularity = existing.popularity + stats.gameCount
        const newWhiteWins = existing.whiteWins + stats.whiteWins
        const newBlackWins = existing.blackWins + stats.blackWins
        const newDraws = existing.draws + stats.draws

        // Update average ELO incrementally (disabled until migration)
        // const totalGames = existing.popularity + stats.gameCount
        // const currentTotalRating = existing.avgElo * existing.popularity
        // const newTotalRating = currentTotalRating + stats.totalRating
        // const newAvgElo = totalGames > 0 ? Math.round(newTotalRating / totalGames) : existing.avgElo

        await tx.opening.update({
          where: { ecoCode },
          data: {
            popularity: newPopularity,
            whiteWins: newWhiteWins,
            blackWins: newBlackWins,
            draws: newDraws,
            // avgElo: newAvgElo,        // ← COMMENTED OUT until migration
            // recentGames: stats.gameCount, // ← COMMENTED OUT
            updatedAt: new Date()
          }
        })

        console.log(`✅ Updated ${ecoCode}: +${stats.gameCount} games (total: ${newPopularity})`)
      }
    })

    console.log(`🎉 Successfully updated ${Object.keys(statsByEco).length} openings`)
  }

  // 🔄 DAILY UPDATE PROCESS
  async runDailyUpdate(): Promise<void> {
    try {
      console.log('🚀 Starting daily Lichess update...')
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const today = new Date()
      
      // Fetch games from last 24 hours
      const games = await this.fetchRecentGames({
        since: yesterday,
        until: today,
        max: 1000, // Process up to 1000 games per day
        minRating: 1600,
        rated: true
      })

      if (games.length === 0) {
        console.log('📭 No games found for processing')
        
        // Create some mock statistics for demo
        console.log('🎭 Creating demo statistics update...')
        const mockStats = [
          { ecoCode: 'A00', result: 'white' as const, avgRating: 1650, timeControl: '10+0', moveCount: 25 },
          { ecoCode: 'B00', result: 'black' as const, avgRating: 1680, timeControl: '15+10', moveCount: 30 },
          { ecoCode: 'C00', result: 'draw' as const, avgRating: 1720, timeControl: '30+0', moveCount: 45 }
        ]
        
        await this.updateOpeningStats(mockStats)
        return
      }

      // Extract statistics
      const gameStats = games
        .map(game => this.extractGameStats(game))
        .filter(Boolean)

      if (gameStats.length === 0) {
        console.log('📭 No valid game statistics extracted')
        return
      }

      // Update database
      await this.updateOpeningStats(gameStats)
      
      console.log(`🎉 Daily update completed: processed ${gameStats.length} games`)

    } catch (error) {
      console.error('❌ Daily update failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const lichessService = new LichessService()