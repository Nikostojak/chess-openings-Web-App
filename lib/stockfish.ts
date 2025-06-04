class StockfishEngine {
    private worker: Worker | null = null
    private isReady = false
    private messageQueue: Array<(message: string) => void> = []
  
    constructor() {
      this.initEngine()
    }
  
    private initEngine() {
      // Stockfish kao Web Worker
      this.worker = new Worker('/stockfish.js')
      
      this.worker.onmessage = (event) => {
        const message = event.data
        
        if (message === 'uciok') {
          this.isReady = true
          this.send('isready')
        }
        
        if (message === 'readyok') {
          console.log('Stockfish ready!')
        }
  
        // Handle evaluation responses
        this.messageQueue.forEach(callback => callback(message))
      }
  
      this.send('uci')
    }
  
    private send(command: string) {
      if (this.worker) {
        this.worker.postMessage(command)
      }
    }
  
    async evaluatePosition(fen: string, depth: number = 15): Promise<{
      evaluation: number
      bestMove: string
      principalVariation: string[]
    }> {
      return new Promise((resolve) => {
        let evaluation = 0
        let bestMove = ''
        let principalVariation: string[] = []
  
        const messageHandler = (message: string) => {
          if (message.includes('info depth')) {
            // Parse evaluation
            const evalMatch = message.match(/score cp (-?\d+)/)
            if (evalMatch) {
              evaluation = parseInt(evalMatch[1]) / 100 // Convert centipawns to pawns
            }
  
            // Parse best move and PV
            const pvMatch = message.match(/pv (.+)/)
            if (pvMatch) {
              principalVariation = pvMatch[1].split(' ')
              bestMove = principalVariation[0] || ''
            }
          }
  
          if (message.includes(`depth ${depth}`)) {
            // Remove this message handler
            const index = this.messageQueue.indexOf(messageHandler)
            if (index > -1) {
              this.messageQueue.splice(index, 1)
            }
  
            resolve({
              evaluation,
              bestMove,
              principalVariation
            })
          }
        }
  
        this.messageQueue.push(messageHandler)
  
        // Send commands to Stockfish
        this.send(`position fen ${fen}`)
        this.send(`go depth ${depth}`)
      })
    }
  
    destroy() {
      if (this.worker) {
        this.worker.terminate()
      }
    }
  }
  
  export default StockfishEngine