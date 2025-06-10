# Chess App Windows Setup Script
# Autor: Nikola Stojak

Write-Host "🏁 Chess Opening Forge - Windows Setup Script" -ForegroundColor Cyan
Write-Host "=============================================="

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Running without administrator privileges. Some operations may fail." -ForegroundColor Yellow
}

# Function to check if command exists
function Test-Command($command) {
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Check Python
Write-Host "🐍 Checking Python installation..." -ForegroundColor Blue
if (Test-Command python) {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} elseif (Test-Command python3) {
    $pythonVersion = python3 --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    Set-Alias python python3
} else {
    Write-Host "❌ Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "📗 Checking Node.js installation..." -ForegroundColor Blue
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check for Stockfish
Write-Host "🔍 Checking Stockfish installation..." -ForegroundColor Blue
$stockfishPath = ""

# Check if stockfish is in PATH
if (Test-Command stockfish) {
    $stockfishPath = (Get-Command stockfish).Source
    Write-Host "✅ Stockfish found in PATH: $stockfishPath" -ForegroundColor Green
} else {
    # Check common Windows paths
    $possiblePaths = @(
        "C:\stockfish\stockfish.exe",
        "C:\Program Files\Stockfish\stockfish.exe",
        "C:\Program Files (x86)\Stockfish\stockfish.exe",
        "$env:USERPROFILE\stockfish\stockfish.exe",
        ".\stockfish.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $stockfishPath = $path
            Write-Host "✅ Stockfish found at: $stockfishPath" -ForegroundColor Green
            break
        }
    }
    
    if (-not $stockfishPath) {
        Write-Host "❌ Stockfish not found. Please:" -ForegroundColor Red
        Write-Host "1. Download from https://stockfishchess.org/download/" -ForegroundColor Yellow
        Write-Host "2. Extract to C:\stockfish\" -ForegroundColor Yellow
        Write-Host "3. Add C:\stockfish\ to your PATH" -ForegroundColor Yellow
        Write-Host "4. Re-run this script" -ForegroundColor Yellow
        
        # Ask if user wants to continue without Stockfish
        $continue = Read-Host "Continue setup without Stockfish? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            exit 1
        }
    }
}

# Test Stockfish if found
if ($stockfishPath) {
    Write-Host "🧪 Testing Stockfish..." -ForegroundColor Blue
    try {
        $process = Start-Process -FilePath $stockfishPath -ArgumentList "quit" -NoNewWindow -Wait -PassThru
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ Stockfish is working correctly" -ForegroundColor Green
        } else {
            Write-Host "❌ Stockfish test failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error testing Stockfish: $_" -ForegroundColor Red
    }
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Setup Python backend
Write-Host "🔧 Setting up Python backend..." -ForegroundColor Blue
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Blue
    python -m venv venv
}

Write-Host "🔌 Activating virtual environment..." -ForegroundColor Blue
& ".\venv\Scripts\Activate.ps1"

Write-Host "📥 Installing Python dependencies..." -ForegroundColor Blue
pip install -r requirements.txt

Set-Location ..

# Setup Next.js frontend
Write-Host "🌐 Setting up Next.js frontend..." -ForegroundColor Blue
Write-Host "📥 Installing Node.js dependencies..." -ForegroundColor Blue
npm install

# Create or update .env.local
Write-Host "📝 Creating .env.local file..." -ForegroundColor Blue
$envContent = @"
# Database
DATABASE_URL="file:./dev.db"

# Analysis API
NEXT_PUBLIC_ANALYSIS_API_URL=http://localhost:8000

# Debug mode
NODE_ENV=development

# Stockfish path (if found)
STOCKFISH_PATH="$stockfishPath"
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ .env.local created successfully" -ForegroundColor Green

# Setup database
Write-Host "🗄️  Setting up database..." -ForegroundColor Blue
npx prisma generate
npx prisma db push

Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Cyan
Write-Host "1. Terminal 1 - Start Python backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   python main.py" -ForegroundColor White
Write-Host ""
Write-Host "2. Terminal 2 - Start Next.js frontend:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor Yellow
Write-Host ""

if (-not $stockfishPath) {
    Write-Host "⚠️  Stockfish not found. Analysis features will not work until you install it." -ForegroundColor Red
}