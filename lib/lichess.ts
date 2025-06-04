// lib/lichess.ts
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
        user?: { name: string; id: string }
        rating?: number
      }
      black: {
        user?: { name: string; id: string }
        rating?: number
      }
    }
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
    }
  }
  
  export class LichessAPI {
    private baseURL = 'https://lichess.org/api'
  
    async getUserGames(
      username: string, 
      options: {
        max?: number
        since?: number
        until?: number
        rated?: boolean
      } = {}
    ): Promise<LichessGame[]> {
      const params = new URLSearchParams()
      
      if (options.max) params.append('max', options.max.toString())
      if (options.since) params.append('since', options.since.toString())
      if (options.until) params.append('until', options.until.toString())
      if (options.rated !== undefined) params.append('rated', options.rated.toString())
      
      // Get games in PGN format
      params.append('format', 'json')
      params.append('clocks', 'true')
      params.append('evals', 'false')
      params.append('opening', 'true')
  
      try {
        const response = await fetch(
          `${this.baseURL}/games/user/${username}?${params.toString()}`,
          {
            headers: {
              'Accept': 'application/x-ndjson'
            }
          }
        )
  
        if (!response.ok) {
          throw new Error(`Lichess API error: ${response.status}`)
        }
  
        const text = await response.text()
        const lines = text.trim().split('\n').filter(line => line.trim())
        const games = lines.map(line => JSON.parse(line)) as LichessGame[]
  
        return games
      } catch (error) {
        console.error('Error fetching Lichess games:', error)
        throw error
      }
    }
  
    async getUserProfile(username: string) {
      try {
        const response = await fetch(`${this.baseURL}/user/${username}`)
        
        if (!response.ok) {
          throw new Error(`User not found: ${username}`)
        }
  
        return await response.json()
      } catch (error) {
        console.error('Error fetching Lichess profile:', error)
        throw error
      }
    }
  
    convertLichessGameToOurFormat(game: LichessGame, username: string) {
      const isUserWhite = game.players.white.user?.name.toLowerCase() === username.toLowerCase()
      const opponent = isUserWhite 
        ? game.players.black.user?.name || 'Anonymous'
        : game.players.white.user?.name || 'Anonymous'
  
      let result: string
      if (game.status === 'draw') {
        result = 'draw'
      } else if (
        (game.status === 'mate' && isUserWhite && game.moves.split(' ').length % 2 === 0) ||
        (game.status === 'mate' && !isUserWhite && game.moves.split(' ').length % 2 === 1) ||
        (game.status === 'resign' && isUserWhite && game.moves.split(' ').length % 2 === 1) ||
        (game.status === 'resign' && !isUserWhite && game.moves.split(' ').length % 2 === 0)
      ) {
        result = 'win'
      } else {
        result = 'loss'
      }
  
      const timeControl = game.clock 
        ? `${game.clock.initial / 60}+${game.clock.increment}` 
        : game.speed.charAt(0).toUpperCase() + game.speed.slice(1)
  
      return {
        date: new Date(game.createdAt),
        opponent,
        result,
        opening: game.opening?.name || 'Unknown Opening',
        timeControl,
        notes: `Imported from Lichess | Game ID: ${game.id} | Rating: ${isUserWhite ? game.players.white.rating : game.players.black.rating}`,
        pgn: game.pgn,
        source: 'lichess',
        externalId: game.id
      }
    }
  }
  
  export const lichessAPI = new LichessAPI()