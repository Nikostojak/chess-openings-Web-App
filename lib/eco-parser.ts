import fs from 'fs'
import path from 'path'
import { Chess } from 'chess.js'

export interface EcoOpening {
  ecoCode: string
  name: string
  moves: string
  fen: string
  family: string
  variation?: string
  subvariation?: string
  popularity: number
  whiteWins: number
  blackWins: number
  draws: number
}

export class EcoParser {
  private ecoData: Map<string, EcoOpening> = new Map()
  
  constructor() {
    this.loadEcoData()
  }

  private loadEcoData() {
    const ecoFiles = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv']
    
    for (const file of ecoFiles) {
      const filePath = path.join(process.cwd(), 'data', 'eco', file)
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        this.parseTsvFile(content)
      } else {
        console.warn(`ECO file not found: ${filePath}`)
      }
    }
    
    console.log(`📚 Loaded ${this.ecoData.size} ECO openings`)
  }

  private parseTsvFile(content: string) {
    const lines = content.split('\n')
    const headers = lines[0].split('\t')
    
    // Expected headers: eco, name, pgn, uci, epd
    const ecoIndex = headers.indexOf('eco')
    const nameIndex = headers.indexOf('name')
    const pgnIndex = headers.indexOf('pgn')
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const fields = line.split('\t')
      if (fields.length < 3) continue
      
      try {
        const ecoCode = fields[ecoIndex]
        const name = fields[nameIndex]
        const moves = fields[pgnIndex]
        
        if (!ecoCode || !name || !moves) continue
        
        // Generate FEN from moves
        const chess = new Chess()
        const moveList = this.parsePgnMoves(moves)
        
        for (const move of moveList) {
          try {
            chess.move(move)
          } catch (error) {
            console.warn(`Invalid move ${move} in ${ecoCode}: ${name}`)
            break
          }
        }
        
        const fen = chess.fen()
        const { family, variation, subvariation } = this.parseOpeningName(name)
        
        const opening: EcoOpening = {
          ecoCode,
          name,
          moves,
          fen,
          family,
          variation,
          subvariation,
          popularity: 0, // Will be updated from master games statistics
          whiteWins: 0,
          blackWins: 0,
          draws: 0
        }
        
        this.ecoData.set(ecoCode, opening)
        
      } catch (error) {
        console.warn(`Error parsing line ${i} in ECO file:`, error)
      }
    }
  }

  private parsePgnMoves(pgn: string): string[] {
    // Remove move numbers and extract just the moves
    // "1. e4 e5 2. Nf3 Nc6" -> ["e4", "e5", "Nf3", "Nc6"]
    return pgn
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim()
      .split(' ')
      .filter(move => move && !move.includes('.'))
  }

  private parseOpeningName(name: string): {
    family: string
    variation?: string
    subvariation?: string
  } {
    // Parse structured names like "Sicilian Defense: Najdorf Variation, English Attack"
    const parts = name.split(':')
    const family = parts[0].trim()
    
    if (parts.length === 1) {
      return { family }
    }
    
    const variations = parts[1].split(',')
    const variation = variations[0]?.trim()
    const subvariation = variations[1]?.trim()
    
    return {
      family,
      variation,
      subvariation
    }
  }

  // Find opening by ECO code
  getByEcoCode(ecoCode: string): EcoOpening | undefined {
    return this.ecoData.get(ecoCode)
  }

  // Find opening by moves
  findByMoves(moves: string[]): EcoOpening | undefined {
    const chess = new Chess()
    
    // Try each move and look for matching position
    for (let i = 0; i < moves.length; i++) {
      try {
        chess.move(moves[i])
        const currentFen = chess.fen()
        
        // Look for opening with this FEN
        for (const opening of this.ecoData.values()) {
          if (opening.fen === currentFen) {
            return opening
          }
        }
      } catch (error) {
        break
      }
    }
    
    return undefined
  }

  // Find opening by PGN string
  findByPgn(pgn: string): EcoOpening | undefined {
    try {
      const chess = new Chess()
      chess.loadPgn(pgn)
      const moves = chess.history()
      return this.findByMoves(moves)
    } catch (error) {
      console.warn('Error parsing PGN for ECO lookup:', error)
      return undefined
    }
  }

  // Get all openings in a family
  getOpeningFamily(family: string): EcoOpening[] {
    return Array.from(this.ecoData.values())
      .filter(opening => opening.family.toLowerCase().includes(family.toLowerCase()))
      .sort((a, b) => a.ecoCode.localeCompare(b.ecoCode))
  }

  // Get openings by ECO category (A, B, C, D, E)
  getByCategory(category: 'A' | 'B' | 'C' | 'D' | 'E'): EcoOpening[] {
    return Array.from(this.ecoData.values())
      .filter(opening => opening.ecoCode.startsWith(category))
      .sort((a, b) => a.ecoCode.localeCompare(b.ecoCode))
  }

  // Search openings by name
  searchByName(query: string): EcoOpening[] {
    const searchTerm = query.toLowerCase()
    return Array.from(this.ecoData.values())
      .filter(opening => 
        opening.name.toLowerCase().includes(searchTerm) ||
        opening.family.toLowerCase().includes(searchTerm) ||
        opening.variation?.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get all openings
  getAllOpenings(): EcoOpening[] {
    return Array.from(this.ecoData.values())
      .sort((a, b) => a.ecoCode.localeCompare(b.ecoCode))
  }

  // Get popular openings (placeholder - will use real stats later)
  getPopularOpenings(limit: number = 20): EcoOpening[] {
    // For now, return some well-known openings
    const popularEcos = [
      'B20', // Sicilian Defense
      'C50', // Italian Game
      'C65', // Ruy Lopez
      'D30', // Queen's Gambit Declined
      'E20', // King's Indian Defense
      'A00', // Uncommon Opening
      'B00', // King's Pawn
      'C20', // King's Pawn Game
      'D00', // Queen's Pawn Game
      'E00'  // Catalan Opening
    ]
    
    return popularEcos
      .map(eco => this.ecoData.get(eco))
      .filter((opening): opening is EcoOpening => opening !== undefined)
      .slice(0, limit)
  }
}

// Singleton instance
export const ecoParser = new EcoParser()