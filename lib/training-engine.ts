// lib/training-engine.ts

import { Chess } from 'chess.js'
import { prisma } from './db'

export interface TrainingQuestion {
  id: string
  openingId: string
  openingName: string
  position: string // FEN
  correctMove: string
  alternatives: string[] // pogrešni potezi za multiple choice
  moveNumber: number
  difficulty: number
  hint?: string
  explanation?: string
}

export interface TrainingConfig {
  mode: 'blitz' | 'rapid' | 'puzzle'
  timePerMove: number // seconds
  questionsPerSession: number
  difficultyRange: [number, number]
  openingFilter?: string[] // specific ECO codes
}

export class TrainingEngine {
  private chess: Chess

  constructor() {
    this.chess = new Chess()
  }

  // Generiraj set pitanja za sesiju
  async generateSession(userId: string, config: TrainingConfig): Promise<TrainingQuestion[]> {
    const questions: TrainingQuestion[] = []
    
    // Dohvati otvaranja na temelju korisnikove historije i težine
    const openings = await this.selectOpeningsForTraining(userId, config)
    
    for (let i = 0; i < config.questionsPerSession; i++) {
      const opening = this.selectRandomWeighted(openings)
      const question = await this.generateQuestionFromOpening(opening, config)
      if (question) {
        questions.push(question)
      }
    }
    
    return this.shuffleQuestions(questions)
  }

  // Odaberi otvaranja za trening na temelju korisnikove performance
  private async selectOpeningsForTraining(userId: string, config: TrainingConfig) {
    // Dohvati korisnikovu statistiku
    const userStats = await prisma.trainingOpeningStats.findMany({
      where: {
        stats: { userId }
      },
      include: {
        opening: true
      }
    })

    // Dohvati popularna otvaranja ako korisnik nema dovoljno podataka
    let openings = await prisma.opening.findMany({
      where: {
        popularity: { gt: 100 },
        ...(config.openingFilter && {
          ecoCode: { in: config.openingFilter }
        })
      },
      take: 50
    })

    // Weighted selection - više treniramo otvaranja s nižim mastery
    return openings.map(opening => {
      const stats = userStats.find(s => s.openingId === opening.id)
      const mastery = stats?.mastery || 0
      
      // Inverzna težina - manje mastery = veća šansa za odabir
      const weight = Math.max(1, 100 - mastery)
      
      return { ...opening, weight, stats }
    })
  }

  // Generiraj pitanje iz otvaranja
  private async generateQuestionFromOpening(opening: any, config: TrainingConfig): Promise<TrainingQuestion | null> {
    try {
      this.chess.reset()
      
      // Parsiraj poteze otvaranja
      const moves = this.parseMoves(opening.moves)
      if (moves.length < 4) return null // premalo poteza
      
      // Odaberi random poziciju iz otvaranja (ne previše rano)
      const targetMoveIndex = this.selectMoveIndex(moves.length, config.difficultyRange)
      
      // Igraj do pozicije prije ciljnog poteza
      for (let i = 0; i < targetMoveIndex; i++) {
        this.chess.move(moves[i])
      }
      
      const position = this.chess.fen()
      const correctMove = moves[targetMoveIndex]
      
      // Generiraj alternative
      const alternatives = this.generateAlternatives(correctMove)
      
      // Izračunaj težinu na temelju dubine i popularnosti varijante
      const difficulty = this.calculateDifficulty(targetMoveIndex, opening.popularity)
      
      return {
        id: `${opening.id}-${targetMoveIndex}`,
        openingId: opening.id,
        openingName: opening.name,
        position,
        correctMove,
        alternatives,
        moveNumber: Math.floor(targetMoveIndex / 2) + 1,
        difficulty,
        hint: this.generateHint(opening, targetMoveIndex),
        explanation: this.generateExplanation(opening, correctMove)
      }
    } catch (error) {
      console.error('Error generating question:', error)
      return null
    }
  }

  // Parsiraj PGN moves u array
  private parseMoves(pgn: string): string[] {
    const moves: string[] = []
    const cleanPgn = pgn.replace(/\d+\./g, '').trim()
    const tokens = cleanPgn.split(/\s+/)
    
    for (const token of tokens) {
      if (token && !token.includes('.')) {
        moves.push(token)
      }
    }
    
    return moves
  }

  // Odaberi indeks poteza na temelju težine
  private selectMoveIndex(totalMoves: number, difficultyRange: [number, number]): number {
    const [minDiff, maxDiff] = difficultyRange
    
    // Mapiranje težine na dubinu poteza
    const minIndex = Math.floor(totalMoves * 0.2 * minDiff) // ne prvi potezi
    const maxIndex = Math.floor(totalMoves * 0.2 * maxDiff)
    
    return Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex
  }

  // Generiraj pogrešne alternative
  private generateAlternatives(correctMove: string): string[] {
    const alternatives: string[] = []
    const allMoves = this.chess.moves()
    
    // Filtriraj točan potez
    const wrongMoves = allMoves.filter(move => {
      const moveObj = this.chess.move(move)
      const isCorrect = moveObj?.san === correctMove
      if (moveObj) this.chess.undo()
      return !isCorrect
    })
    
    // Odaberi 3 random pogrešna poteza
    const shuffled = wrongMoves.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3).map(move => {
      const moveObj = this.chess.move(move)
      const san = moveObj?.san || move
      if (moveObj) this.chess.undo()
      return san
    })
  }

  // Weighted random selection
  private selectRandomWeighted(items: any[]): any {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const item of items) {
      random -= item.weight
      if (random <= 0) return item
    }
    
    return items[0]
  }

  // Izračunaj težinu pitanja
  private calculateDifficulty(moveIndex: number, popularity: number): number {
    // Dublja pozicija = teže
    const depthFactor = Math.min(moveIndex / 10, 1) * 2
    
    // Manje popularna otvaranja = teže
    const popularityFactor = popularity > 1000 ? 0 : popularity > 500 ? 1 : 2
    
    return Math.min(5, Math.ceil(depthFactor + popularityFactor))
  }

  // Generiraj hint
  private generateHint(opening: any, moveIndex: number): string {
    const hints = [
      `This is a key move in the ${opening.family}`,
      `Think about the typical plan in ${opening.name}`,
      `Consider the pawn structure`,
      `What's the most principled continuation?`,
      `This move is played in over ${Math.floor(opening.popularity / 100) * 100} master games`
    ]
    
    return hints[Math.floor(Math.random() * hints.length)]
  }

  // Generiraj objašnjenje
  private generateExplanation(opening: any, move: string): string {
    return `${move} is the main line in the ${opening.name}. This move is chosen for maintaining the typical plans and pawn structures of this opening.`
  }

  // Promiješaj pitanja ali održi balansiranu težinu
  private shuffleQuestions(questions: TrainingQuestion[]): TrainingQuestion[] {
    // Grupiraj po težini
    const byDifficulty: Record<number, TrainingQuestion[]> = {}
    
    questions.forEach(q => {
      if (!byDifficulty[q.difficulty]) {
        byDifficulty[q.difficulty] = []
      }
      byDifficulty[q.difficulty].push(q)
    })
    
    // Shuffle unutar svake grupe
    Object.values(byDifficulty).forEach(group => {
      group.sort(() => Math.random() - 0.5)
    })
    
    // Interleave difficulties za balanced session
    const result: TrainingQuestion[] = []
    let hasMore = true
    let index = 0
    
    while (hasMore) {
      hasMore = false
      for (let diff = 1; diff <= 5; diff++) {
        if (byDifficulty[diff] && byDifficulty[diff].length > index) {
          result.push(byDifficulty[diff][index])
          hasMore = true
        }
      }
      index++
    }
    
    return result
  }

  // Evaluiraj korisnikov odgovor
  async evaluateAnswer(
    sessionId: string,
    questionId: string,
    userMove: string,
    timeSpent: number
  ): Promise<{
    isCorrect: boolean
    points: number
    feedback: string
    mastery: number
  }> {
    // Ovdje bi trebalo dohvatiti pitanje iz sessiona
    // Za sada simuliramo
    const isCorrect = true // TODO: implement actual checking
    
    // Bodovanje na temelju točnosti i brzine
    let points = 0
    if (isCorrect) {
      const basePoints = 100
      const timeBonus = Math.max(0, 30 - timeSpent) * 2 // bonus za brzinu
      points = basePoints + timeBonus
    }
    
    // Update mastery
    const mastery = await this.updateMastery(sessionId, questionId, isCorrect, timeSpent)
    
    return {
      isCorrect,
      points,
      feedback: isCorrect ? 'Excellent!' : 'Not quite right. The correct move was...',
      mastery
    }
  }

  private async updateMastery(
    sessionId: string,
    questionId: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<number> {
    // TODO: Implement spaced repetition algorithm
    // For now, simple increment/decrement
    const change = isCorrect ? 5 : -3
    return Math.max(0, Math.min(100, 50 + change))
  }
}