// lib/tournament-tracker.ts - Legal Tournament Data System

import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 🏆 TOURNAMENT TIER CLASSIFICATION
export enum TournamentTier {
  WORLD_CHAMPIONSHIP = 'WORLD_CHAMPIONSHIP',
  SUPER_ELITE = 'SUPER_ELITE',        // Candidates, Tata Steel, Norway Chess
  ELITE = 'ELITE',                    // Grand Prix, Continental Championships  
  HIGH = 'HIGH',                      // Strong opens, titled events
  STANDARD = 'STANDARD'               // Regular tournaments
}

// 🎯 TOURNAMENT WEIGHT SYSTEM
const TOURNAMENT_WEIGHTS = {
  [TournamentTier.WORLD_CHAMPIONSHIP]: 15.0,  // 1 WC game = 15 normal games
  [TournamentTier.SUPER_ELITE]: 10.0,         // Candidates, Tata Steel
  [TournamentTier.ELITE]: 5.0,               // Grand Prix series
  [TournamentTier.HIGH]: 2.5,                // Strong tournaments
  [TournamentTier.STANDARD]: 1.0              // Normal weight
}

// 📡 LICHESS TOURNAMENT INTERFACE
export interface LichessBroadcast {
  id: string
  name: string
  description: string
  round: {
    id: string
    name: string
    ongoing: boolean
  }
  tour: {
    id: string
    name: string
    slug: string
  }
  study: {
    writeable: boolean
  }
}

export interface LichessGame {
  id: string
  white: {
    name: string
    title?: string
    rating?: number
    fideId?: number
  }
  black: {
    name: string
    title?: string  
    rating?: number
    fideId?: number
  }
  moves: string
  pgn: string
  status: string
  winner?: 'white' | 'black'
  opening?: {
    eco: string
    name: string
  }
  broadcast?: {
    round: string
    tournament: string
  }
}

// 🏆 ELITE GAME STATISTICS
export interface EliteGameStats {
  ecoCode: string
  result: 'white' | 'black' | 'draw'
  avgRating: number
  tournamentTier: TournamentTier
  tournamentName: string
  playerTitles: string[]
  round?: number
  isLiveGame: boolean
  broadcastId?: string
  weight: number
}

export class LegalTournamentTracker {
  private readonly lichessBaseUrl = 'https://lichess.org/api'
  private readonly userAgent = 'ChessOpeningsApp/1.0 (Educational-Legal-Use)'
  
  // 🔍 FETCH ACTIVE LICHESS BROADCASTS
  async getActiveBroadcasts(): Promise<LichessBroadcast[]> {
    try {
      console.log('📡 Fetching active Lichess broadcasts...')
      
      const response = await axios.get(`${this.lichessBaseUrl}/broadcast`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 15000
      })

      const broadcasts: LichessBroadcast[] = response.data.currentRounds || []
      
      console.log(`✅ Found ${broadcasts.length} active broadcasts`)
      
      // 🔧 EXPLICIT TYPE for filter parameter
      return broadcasts.filter((broadcast: LichessBroadcast) => 
        this.isEliteTournament(broadcast.tour.name)
      )
      
    } catch (error) {
      console.error('❌ Error fetching broadcasts:', error)
      return []
    }
  }

  // 🎯 IDENTIFY ELITE TOURNAMENTS
  private isEliteTournament(tournamentName: string): boolean {
    const name = tournamentName.toLowerCase()
    
    const eliteKeywords = [
      'world championship', 'candidates', 'tata steel', 'norway chess',
      'sinquefield cup', 'london chess classic', 'grand prix',
      'olympiad', 'european championship', 'american championship'
    ]
    
    return eliteKeywords.some(keyword => name.includes(keyword))
  }

  // 🏆 CLASSIFY TOURNAMENT TIER
  classifyTournamentTier(tournamentName: string): TournamentTier {
    const name = tournamentName.toLowerCase()
    
    if (name.includes('world championship')) {
      return TournamentTier.WORLD_CHAMPIONSHIP
    }
    
    if (name.includes('candidates') || name.includes('tata steel masters') || 
        name.includes('norway chess')) {
      return TournamentTier.SUPER_ELITE
    }
    
    if (name.includes('grand prix') || name.includes('continental') ||
        name.includes('olympiad')) {
      return TournamentTier.ELITE
    }
    
    if (name.includes('open') || name.includes('championship')) {
      return TournamentTier.HIGH
    }
    
    return TournamentTier.STANDARD
  }

  // 📊 FETCH BROADCAST GAMES
  async getBroadcastGames(broadcastId: string): Promise<LichessGame[]> {
    try {
      console.log(`🎮 Fetching games from broadcast: ${broadcastId}`)
      
      const response = await axios.get(`${this.lichessBaseUrl}/broadcast/${broadcastId}/games`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/x-chess-pgn'
        },
        timeout: 15000
      })

      // Parse PGN response into game objects
      const pgnData = response.data
      const games = this.parsePGNData(pgnData, broadcastId)
      
      console.log(`✅ Extracted ${games.length} games from broadcast`)
      return games
      
    } catch (error) {
      console.error(`❌ Error fetching broadcast games: ${error}`)
      return []
    }
  }

  // 🔄 PARSE PGN DATA
  private parsePGNData(pgnData: string, broadcastId: string): LichessGame[] {
    const games: LichessGame[] = []
    
    // Split PGN into individual games
    const gameBlocks = pgnData.split('\n\n[Event')
    
    for (let i = 0; i < gameBlocks.length; i++) {
      const block = i === 0 ? gameBlocks[i] : '[Event' + gameBlocks[i]
      
      try {
        const game = this.parseIndividualGame(block, broadcastId)
        if (game) games.push(game)
      } catch (error) {
        console.warn(`⚠️ Could not parse game ${i + 1}:`, error)
      }
    }
    
    return games
  }

  // 🎯 PARSE INDIVIDUAL GAME
  private parseIndividualGame(pgn: string, broadcastId: string): LichessGame | null {
    try {
      // Extract headers
      const whiteMatch = pgn.match(/\[White "([^"]+)"\]/)
      const blackMatch = pgn.match(/\[Black "([^"]+)"\]/)
      const resultMatch = pgn.match(/\[Result "([^"]+)"\]/)
      const ecoMatch = pgn.match(/\[ECO "([^"]+)"\]/)
      const openingMatch = pgn.match(/\[Opening "([^"]+)"\]/)
      const whiteEloMatch = pgn.match(/\[WhiteElo "([^"]+)"\]/)
      const blackEloMatch = pgn.match(/\[BlackElo "([^"]+)"\]/)
      
      if (!whiteMatch || !blackMatch) return null
      
      // Extract moves (everything after headers)
      const movesSectionMatch = pgn.match(/\n\n(.+?)(?:\s*(?:1-0|0-1|1\/2-1\/2|\*))?$/)
      const moves = movesSectionMatch ? movesSectionMatch[1].trim() : ''
      
      // Determine winner
      let winner: 'white' | 'black' | undefined
      const result = resultMatch?.[1]
      if (result === '1-0') winner = 'white'
      else if (result === '0-1') winner = 'black'
      
      return {
        id: `broadcast_${broadcastId}_${Date.now()}_${Math.random()}`,
        white: {
          name: whiteMatch[1],
          rating: whiteEloMatch ? parseInt(whiteEloMatch[1]) : undefined
        },
        black: {
          name: blackMatch[1],
          rating: blackEloMatch ? parseInt(blackEloMatch[1]) : undefined
        },
        moves,
        pgn,
        status: result === '*' ? 'ongoing' : 'finished',
        winner,
        opening: ecoMatch ? {
          eco: ecoMatch[1],
          name: openingMatch?.[1] || 'Unknown Opening'
        } : undefined,
        broadcast: {
          round: broadcastId,
          tournament: broadcastId
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Error parsing individual game:', error)
      return null
    }
  }

  // ⚡ PROCESS ELITE GAME
  async processEliteGame(game: LichessGame, tournamentName: string): Promise<EliteGameStats | null> {
    if (!game.opening?.eco) {
      console.log(`⚠️ Game without ECO classification: ${game.white.name} vs ${game.black.name}`)
      return null
    }

    const tier = this.classifyTournamentTier(tournamentName)
    const weight = TOURNAMENT_WEIGHTS[tier]
    
    const whiteRating = game.white.rating || 1500
    const blackRating = game.black.rating || 1500
    const avgRating = Math.round((whiteRating + blackRating) / 2)
    
    let result: 'white' | 'black' | 'draw'
    if (game.winner === 'white') result = 'white'
    else if (game.winner === 'black') result = 'black'  
    else result = 'draw'
    
    const eliteStats: EliteGameStats = {
      ecoCode: game.opening.eco,
      result,
      avgRating,
      tournamentTier: tier,
      tournamentName,
      playerTitles: [
        game.white.title || 'Unknown',
        game.black.title || 'Unknown'
      ],
      isLiveGame: game.status === 'ongoing',
      broadcastId: game.broadcast?.round,
      weight
    }

    console.log(`🏆 Elite game: ${game.white.name} vs ${game.black.name} | ${game.opening.eco} | Weight: ${weight}x`)
    
    return eliteStats
  }

  // 📈 UPDATE DATABASE WITH ELITE STATS
  async updateOpeningWithEliteData(eliteStats: EliteGameStats): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.opening.findUnique({
          where: { ecoCode: eliteStats.ecoCode }
        })

        if (!existing) {
          console.log(`⚠️ Opening ${eliteStats.ecoCode} not found in database`)
          return
        }

        // Calculate weighted updates
        const weightedGames = Math.round(eliteStats.weight)
        let weightedWhiteWins = 0
        let weightedBlackWins = 0
        let weightedDraws = 0

        if (eliteStats.result === 'white') weightedWhiteWins = weightedGames
        else if (eliteStats.result === 'black') weightedBlackWins = weightedGames
        else weightedDraws = weightedGames

        // Update statistics
        const newPopularity = existing.popularity + weightedGames
        const newWhiteWins = existing.whiteWins + weightedWhiteWins
        const newBlackWins = existing.blackWins + weightedBlackWins
        const newDraws = existing.draws + weightedDraws

        await tx.opening.update({
          where: { ecoCode: eliteStats.ecoCode },
          data: {
            popularity: newPopularity,
            whiteWins: newWhiteWins,
            blackWins: newBlackWins,
            draws: newDraws,
            updatedAt: new Date()
          }
        })

        // Log the update with tournament context
        console.log(`✅ Updated ${eliteStats.ecoCode} from ${eliteStats.tournamentName}:`)
        console.log(`   Weight: ${eliteStats.weight}x | New total: ${newPopularity} games`)
        console.log(`   Tournament tier: ${eliteStats.tournamentTier}`)
      })

    } catch (error) {
      console.error(`❌ Error updating elite game data:`, error)
    }
  }

  // 🔄 MONITOR ACTIVE TOURNAMENTS
  async monitorActiveTournaments(): Promise<void> {
    try {
      console.log('🔍 Starting tournament monitoring cycle...')
      
      const broadcasts = await this.getActiveBroadcasts()
      
      if (broadcasts.length === 0) {
        console.log('📭 No elite tournaments currently active')
        return
      }

      console.log(`🏆 Found ${broadcasts.length} elite tournaments:`)
      broadcasts.forEach(b => console.log(`   📺 ${b.tour.name}`))

      for (const broadcast of broadcasts) {
        try {
          const games = await this.getBroadcastGames(broadcast.round.id)
          
          for (const game of games) {
            if (game.status === 'finished' && game.opening?.eco) {
              const eliteStats = await this.processEliteGame(game, broadcast.tour.name)
              
              if (eliteStats) {
                await this.updateOpeningWithEliteData(eliteStats)
              }
            }
          }
          
          // Respect rate limits between broadcasts
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.error(`❌ Error processing broadcast ${broadcast.tour.name}:`, error)
        }
      }

      console.log('✅ Tournament monitoring cycle completed')
      
    } catch (error) {
      console.error('❌ Error in tournament monitoring:', error)
    }
  }

  // 🎯 WORLD CHAMPIONSHIP SPECIFIC TRACKING
  async trackWorldChampionship(): Promise<void> {
    try {
      console.log('👑 Checking for World Championship activity...')
      
      const broadcasts = await this.getActiveBroadcasts()
      const wcBroadcast = broadcasts.find(b => 
        b.tour.name.toLowerCase().includes('world championship')
      )

      if (!wcBroadcast) {
        console.log('📭 No active World Championship broadcast')
        return
      }

      console.log(`👑 WORLD CHAMPIONSHIP DETECTED: ${wcBroadcast.tour.name}`)
      
      const games = await this.getBroadcastGames(wcBroadcast.round.id)
      
      for (const game of games) {
        const eliteStats = await this.processEliteGame(game, wcBroadcast.tour.name)
        
        if (eliteStats) {
          await this.updateOpeningWithEliteData(eliteStats)
          
          // Special logging for World Championship
          console.log(`👑 WORLD CHAMPIONSHIP GAME PROCESSED:`)
          console.log(`   Players: ${game.white.name} vs ${game.black.name}`)
          console.log(`   Opening: ${game.opening?.eco} - ${game.opening?.name}`)
          console.log(`   Result: ${eliteStats.result}`)
          console.log(`   Weight applied: ${eliteStats.weight}x`)
        }
      }
      
    } catch (error) {
      console.error('❌ Error tracking World Championship:', error)
    }
  }
}

// Export singleton instance
export const tournamentTracker = new LegalTournamentTracker()