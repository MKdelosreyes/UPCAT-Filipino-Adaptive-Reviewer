from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import RAG orchestrator
try:
    from rag.RAGOrchestrator import get_rag_orchestrator
    rag = get_rag_orchestrator()
    print("✅ RAG orchestrator loaded in redefine.py")
except ImportError as e:
    print(f"⚠️ Error importing RAG orchestrator in redefine.py: {e}")
    rag = None

try:
    from groq import Groq

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")

    groq_client = Groq(api_key=groq_api_key)

    print("✅ Groq client initialized in redefine.py")
except Exception as e:
    print(f"⚠️ Error initializing Groq in redefine handler: {e}")
    groq_client = None


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class RedefineRequest(BaseModel):
    word: str
    baseMeaning: str
    example: str


class RedefineResponse(BaseModel):
    content: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def build_redefine_prompt_with_rag(data: dict) -> str:
    """Generate redefine prompt with RAG context"""
    word = data["word"]
    base_meaning = data["baseMeaning"]
    example = data["example"]

    rag_context = ""

    if rag:
        try:
            rag_query = f"Filipino word: {word}. Usage examples, related words, synonyms, and learning context"
            rag_context = rag.get_context(
                rag_query,
                context_type="vocabulary",
                top_k=3,
                min_similarity=0.3
            )
            print(
                f"✅ Retrieved vocabulary RAG context for redefinition ({len(rag_context)} chars)")
        except Exception as e:
            print(f"⚠️ Error getting RAG context for redefine: {e}")
            rag_context = ""
    else:
        print("⚠️ RAG not available for redefine")

    system_instruction = """You are a Filipino language educator creating multiple learning perspectives for UPCAT students. Be concise and educational."""
    user_prompt = f"""
{rag_context if rag_context else ""}

Word: {word}
Base meaning: {base_meaning}
Base example: {example}

Output format (follow EXACTLY these labels; one per line):
Easy definition: <casual English for beginners>
Brief formal definition: <academic Filipino>
Bilingual gloss: <short Tagalog/English gloss>
Example sentences:
1. <Filipino sentence>
2. <Filipino sentence>

Notes:
- Keep each line concise.
- Do not add extra sections or change labels.
""".strip()

    return (system_instruction, user_prompt)


# ============================================================
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_redefine(request: RedefineRequest) -> RedefineResponse:
    """Main handler function with RAG integration using Groq API"""
    try:
        print(f"📝 Redefine request - Word: {request.word}")

        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="Groq service not available"
            )

        system_instruction, user_prompt = build_redefine_prompt_with_rag({
            "word": request.word,
            "baseMeaning": request.baseMeaning,
            "example": request.example
        })

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]

        print(f"🤖 Calling Groq with RAG-enhanced prompt for redefinition...")

        completion = groq_client.chat.completions.create(
            model="meta-llama/llama-4-maverick-17b-128e-instruct",
            messages=messages,
            temperature=0.3,
            max_tokens=300,
            top_p=1,
            stream=False
        )

        content = completion.choices[0].message.content or ""
        print(f"✅ Generated redefinition ({len(content)} chars)")

        return RedefineResponse(content=content)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_redefine: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
