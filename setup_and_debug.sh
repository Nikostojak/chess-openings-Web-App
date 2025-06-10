#!/bin/bash

# Chess App Setup and Debug Script
# Autor: Nikola Stojak

echo "🏁 Chess Opening Forge - Setup & Debug Script"
echo "=============================================="

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    MINGW*)     MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "🖥️  Detected OS: $MACHINE"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Stockfish
install_stockfish() {
    echo "📦 Installing Stockfish..."
    
    case $MACHINE in
        Mac)
            if command_exists brew; then
                echo "Installing via Homebrew..."
                brew install stockfish
            else
                echo "❌ Homebrew not found. Please install from: https://brew.sh/"
                exit 1
            fi
            ;;
        Linux)
            if command_exists apt-get; then
                echo "Installing via apt-get..."
                sudo apt-get update
                sudo apt-get install -y stockfish
            elif command_exists yum; then
                echo "Installing via yum..."
                sudo yum install -y stockfish
            else
                echo "❌ Package manager not found. Please install stockfish manually."
                exit 1
            fi
            ;;
        Windows)
            echo "❌ Windows detected. Please download Stockfish from:"
            echo "https://stockfishchess.org/download/"
            echo "And add it to your PATH"
            exit 1
            ;;
        *)
            echo "❌ Unknown OS. Please install Stockfish manually."
            exit 1
            ;;
    esac
}

# Check if Stockfish is installed
echo "🔍 Checking Stockfish installation..."

STOCKFISH_PATH=""
if command_exists stockfish; then
    STOCKFISH_PATH=$(which stockfish)
    echo "✅ Stockfish found at: $STOCKFISH_PATH"
else
    echo "❌ Stockfish not found in PATH"
    
    # Check common paths
    POSSIBLE_PATHS=(
        "/opt/homebrew/bin/stockfish"
        "/usr/local/bin/stockfish"
        "/usr/bin/stockfish"
        "/usr/games/stockfish"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path" ]; then
            STOCKFISH_PATH="$path"
            echo "✅ Stockfish found at: $STOCKFISH_PATH"
            break
        fi
    done
    
    if [ -z "$STOCKFISH_PATH" ]; then
        echo "❌ Stockfish not found. Installing..."
        install_stockfish
        
        # Re-check after installation
        if command_exists stockfish; then
            STOCKFISH_PATH=$(which stockfish)
            echo "✅ Stockfish installed at: $STOCKFISH_PATH"
        else
            echo "❌ Installation failed. Please install manually."
            exit 1
        fi
    fi
fi

# Test Stockfish
echo "🧪 Testing Stockfish..."
echo "quit" | "$STOCKFISH_PATH" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Stockfish is working correctly"
else
    echo "❌ Stockfish test failed"
    exit 1
fi

# Check Python
echo "🐍 Checking Python installation..."
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python found: $PYTHON_VERSION"
else
    echo "❌ Python3 not found. Please install Python 3.8+."
    exit 1
fi

# Check Node.js
echo "📗 Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Setup Python backend
echo "🔧 Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "🔌 Activating virtual environment..."
source venv/bin/activate

echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Set environment variable for Stockfish path
export STOCKFISH_PATH="$STOCKFISH_PATH"
echo "🔧 Set STOCKFISH_PATH=$STOCKFISH_PATH"

cd ..

# Setup Next.js frontend
echo "🌐 Setting up Next.js frontend..."
echo "📥 Installing Node.js dependencies..."
npm install

# Create or update .env.local
echo "📝 Creating .env.local file..."
cat > .env.local << EOF
# Database
DATABASE_URL="file:./dev.db"

# Analysis API
NEXT_PUBLIC_ANALYSIS_API_URL=http://localhost:8000

# Debug mode
NODE_ENV=development
EOF

echo "✅ .env.local created successfully"

# Setup database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo "1. Terminal 1 - Start Python backend:"
echo "   cd backend && source venv/bin/activate && python main.py"
echo ""
echo "2. Terminal 2 - Start Next.js frontend:"
echo "   npm run dev"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""

# Debug function
debug_info() {
    echo "🐛 Debug Information:"
    echo "==================="
    echo "OS: $MACHINE"
    echo "Stockfish Path: $STOCKFISH_PATH"
    echo "Python: $(python3 --version 2>/dev/null || echo 'Not found')"
    echo "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
    echo "npm: $(npm --version 2>/dev/null || echo 'Not found')"
    echo ""
    echo "Backend status:"
    echo "curl http://localhost:8000/"
    echo ""
    echo "Frontend status:"
    echo "curl http://localhost:3000/"
}

# Check if debug flag is passed
if [ "$1" = "--debug" ]; then
    debug_info
fi

