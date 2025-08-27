#!/bin/bash

echo "🚀 Setting up Dev8.dev Authentication System..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created. Please edit it with your credentials."
else
    echo "⚠️  .env.local already exists."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

echo ""
echo "✨ Setup complete! Next steps:"
echo ""
echo "1. Edit .env.local with your database URL and OAuth credentials"
echo "2. Run 'pnpm db:migrate' to create the database tables"
echo "3. Run 'pnpm dev' to start the development server"
echo ""
echo "📚 Check README.md for detailed setup instructions"
