Chess Opening Forge 🏔️♟️
A comprehensive chess opening analysis platform that helps players improve their opening repertoire through detailed game analysis, statistics, and personalized insights.

Features

Game Import: Import games from Lichess or upload PGN files
Opening Analysis: Analyze your opening repertoire with ECO classification
Stockfish Integration: Get engine evaluation for your games
Statistics Dashboard: Visualize your performance across different openings
Opening Database: Browse and study openings from ECO A00-E99
Performance Tracking: Track win rates, accuracy, and trends over time

🛠Tech Stack
Frontend

Next.js 14 - React framework with App Router
TypeScript - Type safety and better DX
Tailwind CSS - Utility-first styling
Recharts - Data visualization
react-chessboard - Interactive chess board
chess.js - Chess logic and PGN parsing

Backend

FastAPI (Python) - High-performance API
Prisma - Type-safe database ORM
SQLite - Lightweight database (easily switchable to PostgreSQL)
Stockfish - Chess engine for analysis

Infrastructure

Docker - Containerization
Fly.io - Deployment platform
GitHub Actions - CI/CD (optional)

📁 Project Structure
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── games/             # Games management
│   ├── openings/          # Opening browser
│   └── stats/             # Statistics page
├── backend/               # Python FastAPI backend
│   └── main.py           # Stockfish analysis API
├── components/            # React components
│   ├── chess/            # Chess-specific components
│   ├── forms/            # Form components
│   ├── games/            # Game list components
│   ├── import/           # Import functionality
│   ├── stats/            # Statistics charts
│   └── ui/               # UI components
├── data/                  # Static data
│   └── eco/              # ECO opening files
├── lib/                   # Utility functions
│   ├── chess-analysis.ts # Chess analysis logic
│   ├── db.ts             # Database utilities
│   ├── eco-parser.ts     # ECO parsing
│   ├── lichess.ts        # Lichess API integration
│   └── stockfish.ts      # Stockfish integration
├── prisma/                # Database schema
└── public/                # Static assets

Development
Database Schema
The application uses Prisma with the following main models:

Game - Chess games with PGN data
Opening - ECO classified openings
GameStats - Calculated statistics per game
OpeningStats - Aggregated opening statistics

API Endpoints
Frontend API Routes:

GET /api/games - List all games
POST /api/games - Create new game
GET /api/games/:id - Get specific game
GET /api/openings - List all openings
GET /api/openings/:eco - Get opening details
GET /api/user/opening-stats - Get user's opening statistics

Backend API (Python):

POST /analyze - Analyze position with Stockfish
GET /health - Health check endpoint

Scripts

npm run dev - Start development server
npm run build - Build for production
npm run seed:eco - Seed ECO database
npm run test:eco - Test ECO parser
npm run lint - Run ESLint
npm run type-check - Run TypeScript checks

Deployment
Deploy to Fly.io

Install Fly CLI:
bashcurl -L https://fly.io/install.sh | sh

Deploy frontend:
bashfly launch
fly deploy

Deploy backend:
bashcd backend
fly launch
fly deploy


Deploy with Docker
Build and run the Docker containers:
bashdocker build -t opening-forge .
docker build -t opening-forge-backend ./backend
docker-compose up -d


Contributing

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

Code Style

Follow TypeScript best practices
Use ESLint and Prettier for code formatting
Write meaningful commit messages
Add tests for new features


Acknowledgments

Lichess for the chess API
Stockfish for the chess engine
ECO for opening classifications
Chess.com for inspiration

📧 Contact
stojak.nikolas@icloud.com
