# UPCAT Filipino Language Adaptive Reviewer

An intelligent, adaptive learning platform designed to help students prepare for the University of the Philippines College Admission Test (UPCAT) Filipino language section. The system uses rule-based adaptive algorithms and AI-powered assistance to personalize the learning experience.

## Project Overview

This full-stack application provides comprehensive Filipino language training across four core competencies:

- **Vocabulary Mastery** - Build and strengthen Filipino vocabulary through contextual learning
- **Grammar Proficiency** - Master Filipino grammar rules through targeted exercises
- **Reading Comprehension** - Develop reading skills through passage analysis and comprehension exercises
- **Sentence Construction** - Develop sentence building and ordering skills

The system adapts to each student's performance, automatically adjusting difficulty levels and providing personalized feedback and learning tips powered by Groq's Llama 3.1.

## Core Features

### Adaptive Learning System

- **Rule-Based Difficulty Adaptation**: Automatically adjusts exercise difficulty based on performance metrics
- **Performance Tracking**: Monitors missed low-frequency words, similar choice errors, and overall accuracy
- **Personalized Recommendations**: Suggests next steps based on student strengths and weaknesses

### Module-Based Learning

#### Vocabulary Activities

1. **Flashcards** - Interactive word learning with definitions and examples
2. **Closest Meaning Quiz** - Multiple-choice vocabulary comprehension
3. **Antonym Identification** - Test understanding of word opposites

#### Grammar Activities

1. **Error Identification** - Find and correct grammatical errors in sentences
2. **Fill in the Blanks** - Complete sentences with appropriate words

#### Reading Comprehension Activities

1. **Passage Reading** - Read and analyze Filipino passages
2. **Comprehension Questions** - Answer multiple-choice questions about passages
3. **Summary Writing** - AI-evaluated summary composition

#### Sentence Construction Activities

1. **Sentence Ordering** - Arrange words to form correct sentences
2. **Choose Sentence** - Select the most appropriate sentence for context

### AI-Powered Features

- **Intelligent Explanations**: Context-aware explanations for incorrect answers using RAG (Retrieval-Augmented Generation)
- **Interactive Chat Assistant**: Real-time conversational help during exercises
- **Personalized Study Tips**: AI-generated tips based on performance patterns
- **Word Redefinition**: Multiple perspective definitions for better comprehension
- **Confusable Words Detection**: Identifies similar words that may cause confusion

### Progress Analytics

- **Comprehensive Dashboard**: Visual overview of learning progress across all modules
- **Skill Analysis**: Detailed breakdown of strengths and areas for improvement
- **Performance Metrics**: Track scores, completion rates, and time spent
- **Mastery Levels**: Dynamic leveling system (Beginner → Intermediate → Advanced → Expert)

### Learning Tools

- **Review Deck**: Save words for later review
- **Spaced Repetition System (SRS)**: Optimized review scheduling for long-term retention
- **Progress Stepper**: Visual progress indicator for each module

## Technology Stack

### Frontend

- **Framework**: Next.js 15.1.3 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Confetti Effects**: canvas-confetti

### Backend (Django API)

- **Framework**: Django 5.1.1 with Django REST Framework
- **Language**: Python 3.11+
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Authentication**: Google OAuth 2.0, JWT tokens
- **ORM**: Django ORM
- **CORS**: django-cors-headers

### AI Service (FastAPI)

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **AI Model**: Groq Llama 3.1 (llama-3.1-8b-instant)
- **Vector Search**: Custom embedding-based RAG system
- **Data Processing**: NumPy (for embeddings)
- **CORS**: FastAPI CORS middleware

### Data Sources

- **Lexicon**: 200+ Filipino words with definitions, surface forms, synonyms, antonyms
- **Vocabulary Exercises**: 180+ contextual vocabulary items
- **Grammar Exercises**: 220+ grammar exercises covering error identification and fill-blanks
- **Reading Comprehension**: Passages with comprehension questions and main idea identification
- **Sentence Construction**: Curated sentence ordering and choose sentence exercises
- **Learning Strategies**: Common mistakes database and learning strategies for adaptive tips

## Prerequisites

Before running the application, ensure you have the following installed:

### Required Software

- **Node.js**: v18.0.0 or higher
- **Python**: 3.11 or higher
- **npm** or **yarn**: Latest stable version
- **PostgreSQL**: 14+ (for production) or SQLite (for development)
- **Git**: For version control

### Required Accounts & API Keys

- **Groq API Key**: Required for AI-powered features (Llama 3.1 access)
- **Google OAuth Credentials**: For user authentication
  - Client ID
  - Client Secret
- **PostgreSQL Database**: For production deployment (SQLite for development)

## Project Structure

```
SP/
├── README.md                         # Project overview and docs
├── frontend/                         # Next.js frontend application
│   ├── app/                          # Next.js app router pages
│   │   ├── (auth)/                   # Auth-protected routes
│   │   ├── dashboard/                # Main dashboard
│   │   ├── grammar/                  # Grammar module pages
│   │   ├── profile/                  # User profile pages
│   │   ├── reading-comprehension/    # Reading comprehension pages
│   │   ├── sentence-construction/    # Sentence construction pages
│   │   └── vocabulary/               # Vocabulary module pages
│   ├── components/                   # Reusable React components
│   │   ├── common/
│   │   ├── grammar/
│   │   ├── reading-comprehension/
│   │   ├── sentence-construction/
│   │   └── vocabulary/
│   ├── contexts/                     # React context providers
│   ├── data/                         # Static datasets (lexical, reading, etc.)
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # API clients and utilities
│   ├── public/                       # Static assets
│   ├── rules/                        # Rule-based evaluation logic
│   └── utils/                        # Helper functions
│
├── backend/                          # Django REST API
│   ├── manage.py                     # Django management script
│   ├── requirements.txt              # Python dependencies
│   └── backend/                      # Django project
│       ├── asgi.py
│       ├── settings.py
│       ├── urls.py
│       └── wsgi.py
│   ├── users/                        # Authentication and user APIs
│   └── progress/                     # Learning progress and analytics

├── ai-service/                       # FastAPI AI service
│   ├── Dockerfile
│   ├── main.py                       # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── handlers/                     # Request handlers / endpoints
│   │   ├── explain.py
│   │   ├── tips.py
│   │   ├── redefine.py
│   │   ├── summary_checker.py
│   │   ├── confusables.py
│   │   └── temp.py
│   ├── rag/                          # Retrieval-Augmented Generation
│   │   ├── RAGOrchestrator.py
│   │   ├── common_mistakes_rag.py
│   │   ├── embeddings.py
│   │   ├── grammar_rag.py
│   │   ├── vocabulary_rag.py
│   │   ├── prompts.py
│   │   ├── RAGOrchestrator.py
│   │   └── references/
│   ├── data/                         # Core data files used by AI service
│   │   ├── __init__.py
│   │   ├── grammar_core.py
│   │   ├── lexicon.py
│   │   ├── reading_comprehension_core.py
│   │   ├── sentence_construction_core.py
│   │   └── vocabulary_core.py
│   └── utils/

└── other_docs/                        # (optional) design notes, deployments, etc.
```

## How to Run Each Component

### 1. Frontend (Next.js)

#### Development Mode

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (see ENV Variables section)
# Add required environment variables

# Run development server
npm run dev

# Application will be available at http://localhost:3000
```

#### Build Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### 2. Backend (Django)

#### Development Mode

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see ENV Variables section)
# Add required environment variables

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver

# API will be available at http://localhost:8000
```

#### Database Setup

```bash
# Apply migrations
python manage.py migrate

# Create initial data (if needed)
python manage.py loaddata initial_data.json
```

### 3. AI Service (FastAPI)

#### Development Mode

```bash
cd ai-service

# Create virtual environment
python -m venv virtenv

# Activate virtual environment
# On Windows:
virtenv\Scripts\activate
# On macOS/Linux:
source virtenv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see ENV Variables section)
# Add required environment variables

# Run development server
uvicorn main:app --reload --port 8001

# API will be available at http://localhost:8001
# Interactive docs at http://localhost:8001/docs
```

#### Production Mode with Docker

```bash
# Build Docker image
docker build -t upcat-ai-service .

# Run container
docker run -p 8001:8001 \
  -e GROQ_API_KEY=your_key_here \
  -e ALLOWED_ORIGINS=https://your-frontend.com \
  upcat-ai-service
```

## Environment Variables

### Frontend (.env.local)

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001

# Google OAuth (from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Optional: Production overrides
# NEXT_PUBLIC_API_URL=https://your-backend.com/api
# NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai-service.com
```

### Backend (.env)

```bash
# Django Settings
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ENVIRONMENT=development

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:password@localhost:5432/upcat_db
# Or use SQLite for development (default):
# DATABASE_URL=sqlite:///db.sqlite3

# Supabase (if using Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.com

# Optional: Security settings for production
# SECURE_SSL_REDIRECT=True
# SESSION_COOKIE_SECURE=True
# CSRF_COOKIE_SECURE=True
```

### AI Service (.env)

```bash
# Groq Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here

# Server Configuration
PORT=8001
ENVIRONMENT=development

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.com

# Optional: Model configuration
# GROQ_MODEL=llama-3.1-8b-instant
# MAX_TOKENS=500
# TEMPERATURE=0.3
```

## Building for Production

### Frontend Deployment (Vercel Recommended)

#### Using Vercel CLI

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_AI_SERVICE_URL
# - NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

#### Manual Build

```bash
cd frontend

# Build production bundle
npm run build

# Output will be in .next/ directory
# Deploy .next/ directory to your hosting platform
```

### Backend Deployment (Railway/Render Recommended)

#### Using Docker

```bash
cd backend

# Create production Dockerfile
# Copy requirements.txt and source files
# Run migrations in entrypoint

# Build image
docker build -t upcat-backend .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=your_postgres_url \
  -e SECRET_KEY=your_secret_key \
  -e GOOGLE_CLIENT_ID=your_client_id \
  -e GOOGLE_CLIENT_SECRET=your_client_secret \
  upcat-backend
```

#### Using Gunicorn

```bash
# Install gunicorn
pip install gunicorn

# Run production server
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

#### Environment Setup

```bash
# Set production environment variables
export DEBUG=False
export ENVIRONMENT=production
export DATABASE_URL=postgresql://...
export SECRET_KEY=...
export ALLOWED_HOSTS=your-domain.com

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput
```

### AI Service Deployment (Render/Railway Recommended)

#### Using Docker (Recommended)

```bash
cd ai-service

# Build production image
docker build -t upcat-ai-service .

# Run container
docker run -p 8001:8001 \
  -e GROQ_API_KEY=your_key \
  -e ALLOWED_ORIGINS=https://your-frontend.com \
  -e ENVIRONMENT=production \
  upcat-ai-service
```

#### Direct Python Deployment

```bash
cd ai-service

# Install dependencies
pip install -r requirements.txt

# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 2

# Or use gunicorn with uvicorn workers
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

#### Render Deployment (render.yaml)

```yaml
services:
  - type: web
    name: upcat-ai-service
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GROQ_API_KEY
        sync: false
      - key: ALLOWED_ORIGINS
        value: https://your-frontend.com
      - key: ENVIRONMENT
        value: production
```

## Key Features Implementation

### Adaptive Difficulty System

The system uses rule-based evaluation in [`evaluateUserPerformance`](frontend/rules/evaluateUserPerformance.ts) to:

- Track missed low-frequency words
- Identify similar choice errors
- Adjust difficulty based on score thresholds
- Tag performance patterns for personalized feedback

### RAG-Enhanced AI Responses

The [`RAGOrchestrator`](ai-service/rag/RAGOrchestrator.py) provides:

- Context-aware explanations using vocabulary and grammar databases
- Common mistake patterns integration
- Learning strategy recommendations
- Similarity-based content retrieval

### Progress Tracking

The [`LearningProgressContext`](frontend/contexts/LearningProgressContext.tsx) manages:

- Exercise completion status
- Score history
- Difficulty progression
- Mastery level calculation
- Performance metrics

## Testing

### Frontend Tests

```bash
cd frontend

# Run tests (if configured)
npm test

# Run e2e tests (if configured)
npm run test:e2e
```

### Backend Tests

```bash
cd backend

# Run Django tests
python manage.py test

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is developed as part of a Special Problem course requirement.

## Authors

- **Development Team** - BSCS-4 Students

---

**Note**: This is an educational project designed to help students prepare for the UPCAT Filipino examination. For production deployment, ensure all security best practices are followed and API keys are properly secured.
