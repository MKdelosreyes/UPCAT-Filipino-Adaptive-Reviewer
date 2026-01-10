from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator, field_validator
from typing import Optional, List, Dict
import os
import sys
import httpx
import random
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Import data modules
try:
    from data.vocabulary_core import vocabulary_data
    from data.lexicon import lexicon_data
    from data.grammar_core import grammar_data
    from data.sentence_construction_core import sentence_construction_data
    print(f"✅ Loaded {len(vocabulary_data)} vocabulary items")
    print(f"✅ Loaded {len(lexicon_data)} lexicon items")
    print(f"✅ Loaded {len(grammar_data)} grammar items")
except ImportError as e:
    print(f"⚠️ Error loading data modules: {e}")
    vocabulary_data = []
    lexicon_data = []
    grammar_data = []
    sentence_construction_data = []

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key or groq_api_key == "your-api-key-here":
    print("❌ ERROR: GROQ_API_KEY not set in .env file")
    print("Please edit ai-service/.env and add your Groq API key")
    raise RuntimeError(
        "GROQ_API_KEY environment variable is required but not set")

print(f"🔑 Using Groq API Key: {groq_api_key[:10]}...{groq_api_key[-4:]}")

try:
    from groq import Groq

    groq_client = Groq(api_key=groq_api_key)

    print("✅ Groq client initialized successfully")
except Exception as e:
    print(f"❌ ERROR initializing Groq client: {e}")
    print("\nTry running: pip install groq")
    sys.exit(1)

# Import handlers
try:
    from handlers.explain import handle_explain, ExplainRequest, ExplainResponse, build_explanation_prompt_with_rag
    print("✅ Loaded explain handler")
except ImportError as e:
    print(f"⚠️ Error loading explain handler: {e}")
    handle_explain = None

try:
    from handlers.redefine import handle_redefine, RedefineRequest, RedefineResponse
    print("✅ Loaded redefine handler")
except ImportError as e:
    print(f"⚠️ Error loading redefine handler: {e}")
    handle_redefine = None

try:
    from handlers.tips import handle_tips, TipsRequest, TipsResponse
    print("✅ Loaded tips handler")
except ImportError as e:
    print(f"⚠️ Error loading tips handler: {e}")
    handle_tips = None

try:
    from utils.token_counter import get_token_counter
    token_counter = get_token_counter()
except ImportError:
    print("⚠️ Token counter not available")
    token_counter = None

# Initialize FastAPI
app = FastAPI(
    title="UPCAT Filipino Reviewer AI Service",
    description="AI-powered Filipino language learning service for UPCAT preparation",
    version="1.0.0"
)

# CORS Configuration
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

print(f"🔒 CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000/api")

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================


class VocabularyExercisesRequest(BaseModel):
    """Request model for vocabulary exercises endpoint."""
    user_id: Optional[int] = None
    target_difficulty: Optional[str] = None
    limit: int = 15

    @field_validator('user_id', mode='before')
    @classmethod
    def parse_user_id(cls, v):
        if v is None or v == '':
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None


class GrammarExercisesRequest(BaseModel):
    """Request model for grammar exercises endpoint."""
    user_id: Optional[int] = None
    target_difficulty: Optional[str] = None
    exercise_type: Optional[str] = None
    limit: int = 15

    @field_validator('user_id', mode='before')
    @classmethod
    def parse_user_id(cls, v):
        if v is None or v == '':
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None

    @field_validator('target_difficulty')
    @classmethod
    def validate_difficulty(cls, v):
        if v is not None and v not in ['easy', 'medium', 'hard']:
            raise ValueError('target_difficulty must be easy, medium, or hard')
        return v


class ConfusablesRequest(BaseModel):
    """Request model for confusables endpoint."""
    word: str
    topK: Optional[int] = 3


class ConfusableWord(BaseModel):
    """Model for a confusable word result."""
    word: str
    meaning: str
    example: str


class ConfusablesResponse(BaseModel):
    """Response model for confusables endpoint."""
    results: List[ConfusableWord]


class HealthResponse(BaseModel):
    """Basic health check response model."""
    status: str
    message: str
    groq_configured: bool


class DetailedHealthResponse(BaseModel):
    """Detailed health check response model."""
    service: str
    groq_configured: bool
    vocabulary_data_loaded: bool
    vocabulary_count: Optional[int] = None


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    conversation_history: List[Dict[str, str]]
    word: str
    correct_answer: str
    definition: Optional[str] = None
    example: Optional[str] = None
    context_type: str = "vocabulary"


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

async def fetch_user_lexical_difficulties(
    user_id: int, token: Optional[str] = None
) -> Dict[str, float]:
    """Fetch user's lexical difficulty scores from backend API."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{BACKEND_API_URL}/progress/lexical-difficulties/"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    difficulties = {}
    for item in data.get("difficulties", []):
        lemma_id = item["lemma_id"]
        score = item["difficulty_score"]
        difficulties[lemma_id] = score
    return difficulties


def bucket_from_score(score: Optional[float]) -> Optional[str]:
    """Map continuous difficulty score [0,1] to discrete difficulty levels."""
    if score is None:
        return None
    if score < 0.3:
        return "easy"
    if score < 0.6:
        return "medium"
    return "hard"


def estimate_grammar_difficulty(item: dict) -> str:
    """Estimate difficulty of a grammar item based on its characteristics."""
    try:
        sentence = item.get("error_sentence", "") or item.get(
            "fill_sentence", "")
        explanation = item.get("error_explanation", "") or item.get(
            "fill_explanation", "")

        word_count = len(sentence.split())
        length_score = 0
        if word_count <= 10:
            length_score = 0
        elif word_count <= 20:
            length_score = 1
        else:
            length_score = 2

        exp_word_count = len(explanation.split())
        explanation_score = 0
        if exp_word_count <= 15:
            explanation_score = 0
        elif exp_word_count <= 30:
            explanation_score = 1
        else:
            explanation_score = 2

        total_score = length_score + explanation_score

        if total_score <= 1:
            return "easy"
        elif total_score <= 3:
            return "medium"
        else:
            return "hard"

    except Exception as e:
        print(f"⚠️ Error estimating difficulty: {e}")
        return "medium"


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - basic health check."""
    return HealthResponse(
        status="running",
        message="UPCAT Filipino AI Service",
        groq_configured=bool(groq_api_key)
    )


@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Chat endpoint using Groq API
    """
    try:
        from rag.RAGOrchestrator import get_rag_orchestrator
        rag = get_rag_orchestrator()

        last_user_message = next(
            (msg["content"] for msg in reversed(request.conversation_history)
             if msg["role"] == "user"),
            ""
        )

        query = f"{request.word}: {last_user_message}"
        rag_context = rag.get_context(
            query=query,
            context_type=request.context_type,
            top_k=2,
            min_similarity=0.4,
            include_mistakes=True
        )

        system_instruction = f"""You are a helpful Filipino language tutor for UPCAT preparation.

Current Context:
- Word/Topic: {request.word}
- Correct Answer: {request.correct_answer}
{f"- Definition: {request.definition}" if request.definition else ""}
{f"- Example: {request.example}" if request.example else ""}

{rag_context if rag_context else ""}

Guidelines:
- Answer in Filipino (Tagalog) when appropriate, but use English for grammar explanations if clearer
- Keep responses concise (2-3 sentences max)
- Focus on helping the student understand the word/concept
- Reference the context provided above when relevant
- If asked about unrelated topics, politely redirect to the current word/topic
- Use examples from Filipino culture and daily life
"""

        messages = [{"role": "system", "content": system_instruction}]

        # Add conversation history (last 6 messages)
        for msg in request.conversation_history[-6:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=200,
            top_p=1,
            stream=False
        )

        ai_response = completion.choices[0].message.content or "I couldn't generate a response. Please try again."

        return ChatResponse(response=ai_response)

    except Exception as e:
        print(f"❌ Error in /chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate chat response: {str(e)}"
        )


@app.get("/health", response_model=DetailedHealthResponse)
async def health_check():
    """Detailed health check endpoint."""
    checks = {
        "service": "online",
        "groq_key_configured": bool(groq_api_key),
        "vocabulary_data_loaded": False,
    }

    try:
        checks["vocabulary_data_loaded"] = len(vocabulary_data) > 0
        checks["vocabulary_count"] = len(vocabulary_data)
    except:
        pass

    return checks


@app.post("/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """Generate AI explanation for incorrect answers."""
    if not handle_explain:
        raise HTTPException(
            status_code=503, detail="Explain handler not available")
    return await handle_explain(request)


@app.post("/redefine", response_model=RedefineResponse)
async def redefine_word(request: RedefineRequest):
    """Redefine word with multiple perspectives."""
    if not handle_redefine:
        raise HTTPException(
            status_code=503, detail="Redefine handler not available")
    return await handle_redefine(request)


@app.post("/tips", response_model=TipsResponse)
async def generate_tips(request: TipsRequest):
    """Generate personalized study tips based on exercise performance."""
    if not handle_tips:
        raise HTTPException(
            status_code=503, detail="Tips generation service not available")

    try:
        return await handle_tips(request)
    except Exception as e:
        print(f"❌ Error in /tips endpoint: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate tips: {str(e)}")


@app.post("/confusables", response_model=ConfusablesResponse)
async def find_confusables(request: ConfusablesRequest):
    """
    ✅ NOTE: This endpoint still uses embeddings for similarity.
    """
    raise HTTPException(
        status_code=501,
        detail="Confusables endpoint requires embeddings. Consider using sentence-transformers instead of OpenAI/Gemini embeddings."
    )


@app.get("/debug/token-usage")
async def get_token_usage():
    """Debug endpoint to check token usage and rate limits"""
    if not token_counter:
        return {"error": "Token counter not available"}

    status = token_counter.get_rate_limit_status()

    limits = {
        "free_tier": {
            "requests_per_minute": 30,
            "requests_per_day": 14400,
            "tokens_per_minute": 30_000,
        }
    }

    return {
        "current_status": status,
        "limits": limits,
        "warnings": {
            "approaching_rpm_limit": status['requests_last_1min'] >= 25,
            "high_token_usage": status['tokens_last_1min'] >= 25_000,
        },
        "recent_requests": token_counter.requests[-10:] if len(token_counter.requests) > 0 else []
    }


@app.get("/debug/prompt-size/{endpoint}")
async def check_prompt_size(endpoint: str):
    """Check how large prompts are for debugging"""
    if endpoint == "explain":
        # Simulate an explain request
        test_prompt = build_explanation_prompt_with_rag({
            "mode": "quiz",
            "word": "balakid",
            "correct": "hadlang",
            "definition": "sagabal o pumipigil sa isang bagay",
            "example": "Ang mataas na bakod ay naging balakid sa kanyang paglabas.",
            "selected": "tulong"
        })

        char_count = len(test_prompt)
        approx_tokens = char_count // 4

        return {
            "endpoint": endpoint,
            "prompt_length": char_count,
            "estimated_tokens": approx_tokens,
            "prompt_preview": test_prompt[:500] + "..." if len(test_prompt) > 500 else test_prompt
        }

    return {"error": "Unknown endpoint"}

# ============================================================
# VOCABULARY & GRAMMAR EXERCISE ENDPOINTS
# ============================================================


@app.post("/exercises/vocabulary")
async def get_vocabulary_exercises_adaptive(
    request: VocabularyExercisesRequest,
    authorization: Optional[str] = Header(None),
):
    """Get adaptive vocabulary exercises based on user performance."""
    user_id = request.user_id
    target_difficulty = request.target_difficulty
    limit = request.limit

    if user_id is None or authorization is None:
        items = list(vocabulary_data)
        random.shuffle(items)
        return {"exercises": items[:limit]}

    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    try:
        user_difficulties = await fetch_user_lexical_difficulties(user_id=user_id, token=token)
    except Exception as e:
        print("⚠️ Failed to fetch lexical difficulties:", e)
        items = list(vocabulary_data)
        random.shuffle(items)
        return {"exercises": items[:limit]}

    annotated = []
    for item in vocabulary_data:
        lemma_id = item.get("lemma_id")
        score = user_difficulties.get(lemma_id)
        bucket = bucket_from_score(score)
        annotated.append((item, bucket))

    if target_difficulty not in {"easy", "medium", "hard"}:
        target_difficulty = None

    preferred = []
    others = []

    for item, bucket in annotated:
        if target_difficulty is not None and bucket == target_difficulty:
            preferred.append(item)
        else:
            others.append(item)

    selected = []
    random.shuffle(preferred)
    selected.extend(preferred[:limit])

    if len(selected) < limit:
        remaining = limit - len(selected)
        random.shuffle(others)
        selected.extend(others[:remaining])

    return {"exercises": selected[:limit]}


@app.post("/exercises/grammar")
async def get_grammar_exercises_adaptive(
    request: GrammarExercisesRequest,
    authorization: Optional[str] = Header(None),
):
    """Get adaptive grammar exercises based on user performance."""
    user_id = request.user_id
    target_difficulty = request.target_difficulty
    limit = request.limit

    filtered_items = grammar_data

    if not filtered_items:
        print("⚠️ No grammar items available")
        return {"exercises": []}

    def select_exercises_with_heuristic():
        annotated = []
        for item in filtered_items:
            estimated_diff = estimate_grammar_difficulty(item)
            annotated.append((item, estimated_diff))

        if target_difficulty in {"easy", "medium", "hard"}:
            preferred = [item for item,
                         diff in annotated if diff == target_difficulty]
            others = [item for item,
                      diff in annotated if diff != target_difficulty]
        else:
            preferred = []
            others = [item for item, _ in annotated]

        random.shuffle(preferred)
        random.shuffle(others)

        selected = preferred[:limit]
        if len(selected) < limit:
            remaining = limit - len(selected)
            selected.extend(others[:remaining])

        if not selected and filtered_items:
            random.shuffle(filtered_items)
            selected = filtered_items[:limit]

        return selected

    if user_id is None or authorization is None:
        selected = select_exercises_with_heuristic()
        return {"exercises": selected}

    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()

    try:
        user_difficulties = await fetch_user_lexical_difficulties(user_id=user_id, token=token)
    except Exception as e:
        print(f"⚠️ Failed to fetch difficulties: {e}")
        selected = select_exercises_with_heuristic()
        return {"exercises": selected}

    annotated = []
    for item in filtered_items:
        lemma_id = item.get("lemma_id")
        score = user_difficulties.get(lemma_id)

        if score is not None:
            bucket = bucket_from_score(score)
        else:
            bucket = estimate_grammar_difficulty(item)

        annotated.append((item, bucket))

    if target_difficulty not in {"easy", "medium", "hard"}:
        target_difficulty = None

    preferred = []
    others = []

    for item, bucket in annotated:
        if target_difficulty is not None and bucket == target_difficulty:
            preferred.append(item)
        else:
            others.append(item)

    selected = []
    random.shuffle(preferred)
    selected.extend(preferred[:limit])

    if len(selected) < limit:
        remaining = limit - len(selected)
        random.shuffle(others)
        selected.extend(others[:remaining])

    if not selected and filtered_items:
        random.shuffle(filtered_items)
        selected = filtered_items[:limit]

    return {"exercises": selected[:limit]}


@app.get("/exercises/lexicon")
async def get_lexicon_exercises():
    """Get all lexicon data."""
    if not lexicon_data:
        raise HTTPException(status_code=404, detail="Lexicon data not loaded")
    return {"exercises": lexicon_data, "count": len(lexicon_data)}


@app.get("/debug/data-status")
async def debug_data_status():
    """Debug endpoint to check data loading status."""
    status = {}

    try:
        status["vocabulary"] = {"loaded": True, "count": len(vocabulary_data)}
    except Exception as e:
        status["vocabulary"] = {"loaded": False, "error": str(e)}

    try:
        status["lexicon"] = {"loaded": True, "count": len(lexicon_data)}
    except Exception as e:
        status["lexicon"] = {"loaded": False, "error": str(e)}

    try:
        status["grammar"] = {"loaded": True, "count": len(grammar_data)}
    except Exception as e:
        status["grammar"] = {"loaded": False, "error": str(e)}

    return status


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Run initialization tasks on application startup."""
    print("\n" + "="*60)
    print("🚀 UPCAT Filipino AI Service Starting...")
    print("="*60)

    env = os.getenv("ENVIRONMENT", "development")
    print(f"🌍 Environment: {env}")
    print(f"✅ Groq API Key: {'Configured' if groq_api_key else '❌ MISSING'}")

    if not groq_api_key:
        print("❌ CRITICAL: Groq API key not configured!")
        if env == "production":
            raise RuntimeError(
                "Cannot start: GROQ_API_KEY is required in production")

    print(f"✅ Vocabulary Data: {len(vocabulary_data)} words loaded")
    print(f"✅ Lexicon Data: {len(lexicon_data)} entries loaded")
    print(f"✅ Grammar Data: {len(grammar_data)} exercises loaded")
    print(
        f"✅ Explain Handler: {'Loaded' if handle_explain else 'Not Available'}")
    print(
        f"✅ Redefine Handler: {'Loaded' if handle_redefine else 'Not Available'}")
    print(f"✅ Tips Handler: {'Loaded' if handle_tips else 'Not Available'}")

    port = int(os.getenv("PORT", 8001))
    print("="*60)
    print(f"🌐 Server will run on port: {port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print("="*60 + "\n")


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8001))

    uvicorn.run(app, host=host, port=port, log_level="info")
