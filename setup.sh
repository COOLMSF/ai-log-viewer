#!/bin/bash

# Advanced Log Viewer Setup Script
echo "🚀 Setting up Advanced Log Viewer with AI Analysis..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if uv is installed, install if not
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv package manager..."
    pip3 install uv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install uv. Please install it manually with: pip install uv"
        exit 1
    fi
fi

PYTHON_VERSION=$(python3 -c 'import sys; print("." .join(map(str, sys.version_info[:2])))')
echo "✅ Python $PYTHON_VERSION found"
echo "✅ uv package manager found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION found"

# Check npm/pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
else
    echo "❌ npm or pnpm is required but not installed."
    exit 1
fi
echo "✅ $PACKAGE_MANAGER found"

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd log-viewer-backend

# Use uv to sync dependencies in a virtual environment
echo "Installing Python dependencies with uv..."
uv sync --locked --all-extras

# If uv sync failed, try creating a virtual environment and installing packages
if [ $? -ne 0 ]; then
    echo "⚠️  uv sync failed, falling back to virtual environment with uv pip..."
    python3 -m venv .venv
    source .venv/bin/activate
    uv pip install --upgrade pip
    uv pip install -r requirements.txt
fi

# Create database directory
mkdir -p src/database
mkdir -p src/uploads

echo "✅ Backend setup complete"

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
cd ../log-viewer-frontend

echo "Installing Node.js dependencies..."
$PACKAGE_MANAGER install

echo "✅ Frontend setup complete"

# Create startup scripts
echo ""
echo "📝 Creating startup scripts..."

cd ..

# Backend startup script
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Log Viewer Backend..."
cd log-viewer-backend

# Use uv run to execute the application with automatic environment management
if command -v uv &> /dev/null; then
    echo "Using uv to run the application..."
    uv run src/main.py
else
    # Fallback to virtual environment if uv is not available
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        source venv/bin/activate
    fi
    python src/main.py
fi

# Check for DeepSeek API key
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "⚠️  DEEPSEEK_API_KEY not set - AI analysis will run in demo mode"
    echo "   To enable AI features, set: export DEEPSEEK_API_KEY='your-api-key'"
else
    echo "✅ DeepSeek API key configured - AI analysis enabled"
fi

echo "Backend starting on http://localhost:5001"
EOF

# Frontend startup script
cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🎨 Starting Log Viewer Frontend..."
cd log-viewer-frontend

# Detect package manager
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
else
    PACKAGE_MANAGER="npm"
fi

echo "Frontend starting on http://localhost:5174"
$PACKAGE_MANAGER run dev
EOF

# Combined startup script
cat > start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Advanced Log Viewer..."

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend..."
./start-backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
./start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "🎉 Log Viewer is starting up!"
echo "📊 Backend:  http://localhost:5001"
echo "🌐 Frontend: http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF

# Make scripts executable
chmod +x start-backend.sh start-frontend.sh start-all.sh

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Quick Start:"
echo "   1. To start both services: ./start-all.sh"
echo "   2. To start backend only:  ./start-backend.sh"
echo "   3. To start frontend only: ./start-frontend.sh"
echo ""
echo "🌐 Access the application at: http://localhost:5174"
echo ""
echo "🤖 AI Analysis Setup (Optional):"
echo "   1. Get API key from: https://platform.deepseek.com/"
echo "   2. Set environment variable: export DEEPSEEK_API_KEY='your-key'"
echo "   3. Restart the backend"
echo ""
echo "📖 For detailed documentation, see README.md"

