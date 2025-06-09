export interface AnalysisResult {
  evaluation: number
  bestMove: string
  principalVariation: string[]
  mateIn?: number
}

export class ChessAnalysisAPI {
  private baseURL = process.env.NEXT_PUBLIC_ANALYSIS_API_URL || 'http://localhost:8000'

  async analyzePosition(pgn?: string, fen?: string, depth: number = 15): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.baseURL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pgn,
          fen,
          depth
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        evaluation: result.evaluation,
        bestMove: result.best_move,
        principalVariation: result.principal_variation,
        mateIn: result.mate_in
      }
    } catch (error) {
      console.error('Chess analysis error:', error)
      throw error
    }
  }
}

export const chessAnalysisAPI = new ChessAnalysisAPI()