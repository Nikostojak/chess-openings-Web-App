from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
import chess.pgn
from stockfish import Stockfish
import io
import sys
from typing import List, Optional

app = FastAPI(title="Chess Analysis API", version="1.0.0")

# CORS za Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stockfish path
STOCKFISH_PATH = "/opt/homebrew/bin/stockfish"

class AnalysisRequest(BaseModel):
    pgn: Optional[str] = None
    fen: Optional[str] = None
    depth: int = 15

class AnalysisResponse(BaseModel):
    evaluation: float
    best_move: str
    principal_variation: List[str]
    mate_in: Optional[int] = None

@app.get("/")
async def root():
    return {
        "message": "Chess Analysis API", 
        "status": "running",
        "python_version": sys.version,
        "stockfish_path": STOCKFISH_PATH
    }

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_position(request: AnalysisRequest):
    try:
        # Initialize Stockfish
        stockfish = Stockfish(path=STOCKFISH_PATH, depth=request.depth)
        
        # Get position from PGN or FEN
        if request.pgn:
            # Parse PGN to get final position
            pgn_io = io.StringIO(request.pgn)
            game = chess.pgn.read_game(pgn_io)
            if not game:
                raise HTTPException(status_code=400, detail="Invalid PGN")
            
            board = game.board()
            for move in game.mainline_moves():
                board.push(move)
            fen = board.fen()
        elif request.fen:
            fen = request.fen
        else:
            raise HTTPException(status_code=400, detail="Either PGN or FEN required")
        
        # Analyze with Stockfish
        stockfish.set_fen_position(fen)
        
        evaluation = stockfish.get_evaluation()
        best_move = stockfish.get_best_move()
        top_moves = stockfish.get_top_moves(3)
        
        # Convert evaluation
        eval_score = 0.0
        mate_in = None
        
        if evaluation['type'] == 'cp':
            eval_score = evaluation['value'] / 100.0
        elif evaluation['type'] == 'mate':
            mate_in = evaluation['value']
            eval_score = 10.0 if mate_in > 0 else -10.0
        
        # Get principal variation
        pv = []
        if top_moves:
            pv = [move['Move'] for move in top_moves]
        
        return AnalysisResponse(
            evaluation=eval_score,
            best_move=best_move or "",
            principal_variation=pv,
            mate_in=mate_in
        )
        
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Chess Analysis API...")
    print("📍 API will be available at: http://localhost:8000")
    print("📖 Docs available at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
