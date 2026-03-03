#!/bin/bash

# VocabMaster Docker Setup Script

set -e

echo "🚀 Setting up VocabMaster with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. You can modify it to change database settings."
else
    echo "ℹ️  Using existing .env file"
fi

# Create data directory for SQLite
mkdir -p data
mkdir -p logs

echo ""
echo "Choose your database setup:"
echo "1) SQLite (default - standalone, no external database)"
echo "2) PostgreSQL (requires external database service)"
echo "3) MySQL (requires external database service)"
echo ""

read -p "Enter your choice (1-3) [1]: " choice
choice=${choice:-1}

case $choice in
    1)
        echo "📦 Starting with SQLite database..."
        docker-compose up --build
        ;;
    2)
        echo "📦 Starting with PostgreSQL database..."
        echo "⚠️  Make sure to update your .env file with PostgreSQL settings"
        docker-compose --profile postgres up --build
        ;;
    3)
        echo "📦 Starting with MySQL database..."
        echo "⚠️  Make sure to update your .env file with MySQL settings"
        docker-compose --profile mysql up --build
        ;;
    *)
        echo "❌ Invalid choice. Starting with default SQLite setup..."
        docker-compose up --build
        ;;
esac

echo ""
echo "✅ Setup complete!"
echo "🌐 Application is running at: http://localhost:3000"
echo "📖 For more information, check the DOCKER.md file"