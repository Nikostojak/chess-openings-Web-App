from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chess
import chess.pgn
from stockfish import Stockfish
import io
import sys
import os
import shutil
import platform
from typing import List, Optional

app = FastAPI(title="Chess Analysis API", version="1.0.0")

# CORS za Next.js frontend - dodano više URL-ova
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def find_stockfish_path():
    """
    Automatski pronađi Stockfish path na različitim OS-ovima
    """
    # Prvo provjeri environment varijablu
    env_path = os.environ.get('STOCKFISH_PATH')
    if env_path and os.path.isfile(env_path):
        return env_path
    
    # Lista mogućih path-ova za različite OS-ove
    possible_paths = []
    
    system = platform.system().lower()
    
    if system == "darwin":  # macOS
        possible_paths = [
            "/opt/homebrew/bin/stockfish",  # Homebrew M1 Mac
            "/usr/local/bin/stockfish",     # Homebrew Intel Mac
            "/usr/bin/stockfish",
            "/opt/local/bin/stockfish",     # MacPorts
        ]
    elif system == "linux":  # Linux/Ubuntu
        possible_paths = [
            "/usr/bin/stockfish",
            "/usr/games/stockfish",
            "/usr/local/bin/stockfish",
            "/snap/bin/stockfish",
            "./stockfish",  # Local binary
        ]
    elif system == "windows":  # Windows
        possible_paths = [
            "C:\\stockfish\\stockfish.exe",
            "stockfish.exe",  # If in PATH
            ".\\stockfish.exe",
        ]
    
    # Provjeri svaki path
    for path in possible_paths:
        if os.path.isfile(path):
            print(f"✅ Found Stockfish at: {path}")
            return path
    
    # Pokušaj pronaći u PATH-u
    stockfish_in_path = shutil.which("stockfish")
    if stockfish_in_path:
        print(f"✅ Found Stockfish in PATH: {stockfish_in_path}")
        return stockfish_in_path
    
    # Ako ništa nije pronađeno
    print("❌ Stockfish not found!")
    print("📋 Tried these paths:")
    for path in possible_paths:
        print(f"   - {path}")
    
    return None

# Pokušaj pronaći Stockfish
STOCKFISH_PATH = find_stockfish_path()

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
    stockfish_status = "✅ Available" if STOCKFISH_PATH else "❌ Not found"
    
    return {
        "message": "Chess Analysis API", 
        "status": "running",
        "python_version": sys.version,
        "stockfish_path": STOCKFISH_PATH,
        "stockfish_status": stockfish_status,
        "platform": platform.system(),
        "installation_guide": {
            "macOS": "brew install stockfish",
            "Ubuntu/Linux": "sudo apt-get install stockfish",
            "Windows": "Download from https://stockfishchess.org/download/"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        if not STOCKFISH_PATH:
            return {
                "status": "error",
                "message": "Stockfish not found",
                "stockfish_available": False
            }
        
        # Test Stockfish connection
        stockfish = Stockfish(path=STOCKFISH_PATH, depth=5)
        stockfish.set_position(["e2e4"])  # Test move
        test_eval = stockfish.get_evaluation()
        
        return {
            "status": "healthy",
            "message": "Stockfish is working correctly",
            "stockfish_available": True,
            "test_evaluation": test_eval
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Stockfish test failed: {str(e)}",
            "stockfish_available": False
        }

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_position(request: AnalysisRequest):
    try:
        # Provjeri je li Stockfish dostupan
        if not STOCKFISH_PATH:
            raise HTTPException(
                status_code=500, 
                detail="Stockfish engine not found. Please install Stockfish first."
            )
        
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
        
        if evaluation and evaluation['type'] == 'cp':
            eval_score = evaluation['value'] / 100.0
        elif evaluation and evaluation['type'] == 'mate':
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
    print(f"📍 API will be available at: http://localhost:8000")
    print(f"📖 Docs available at: http://localhost:8000/docs")
    
    if STOCKFISH_PATH:
        print(f"✅ Stockfish found at: {STOCKFISH_PATH}")
    else:
        print("❌ WARNING: Stockfish not found!")
        print("🔧 Installation instructions:")
        print("   macOS: brew install stockfish")
        print("   Ubuntu: sudo apt-get install stockfish")
        print("   Windows: Download from https://stockfishchess.org/download/")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)