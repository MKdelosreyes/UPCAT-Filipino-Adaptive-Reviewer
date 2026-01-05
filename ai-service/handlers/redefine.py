from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import RAG orchestrator
try:
    from rag.orchestrator import get_rag_orchestrator
    rag = get_rag_orchestrator()
    print("✅ RAG orchestrator loaded in redefine.py")
except ImportError as e:
    print(f"⚠️ Error importing RAG orchestrator in redefine.py: {e}")
    rag = None

# Import OpenAI client
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("✅ OpenAI client initialized in redefine.py")
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in redefine handler: {e}")
    openai_client = None


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
    """
    ✅ NEW: Generate redefine prompt with RAG context
    """
    word = data["word"]
    base_meaning = data["baseMeaning"]
    example = data["example"]

    # Get vocabulary context from RAG
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

    prompt = f"""You are a Filipino language educator creating multiple learning perspectives for UPCAT students.

{rag_context}

**Word to Redefine:** {word}
**Base Meaning:** {base_meaning}
**Base Example:** {example}

Using the reference materials above (if provided), create:

1. **Easy Definition** (casual, conversational tone, in English, for beginners. Make it relatable)
2. **Formal Definition** (academic, precise, in Filipino, for advanced learners)
3. **2 New Example Sentences** (Filipino, showing different contexts. Cite similar usage from references if available)
4. **Usage Notes** (when/how to use, common collocations, mention related words from references)

Be concise and educational. If you find related words in the references, mention them to help students build vocabulary connections."""

    return prompt


# ============================================================
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_redefine(request: RedefineRequest) -> RedefineResponse:
    """
    ✅ ENHANCED: Main handler function with RAG integration
    """
    try:
        print(f"📝 Redefine request - Word: {request.word}")

        if not openai_client:
            raise HTTPException(
                status_code=503,
                detail="OpenAI service not available"
            )

        # ✅ Use RAG-enhanced prompt builder
        prompt = build_redefine_prompt_with_rag({
            "word": request.word,
            "baseMeaning": request.baseMeaning,
            "example": request.example
        })

        print(f"🤖 Calling OpenAI with RAG-enhanced prompt for redefinition...")

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            max_tokens=450,
            messages=[
                {
                    "role": "system",
                    "content": "You are a Filipino language educator. Use reference materials to provide accurate, multi-perspective definitions that help students learn effectively. Cite related words when available."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = completion.choices[0].message.content or ""
        print(f"✅ Generated RAG-enhanced redefinition ({len(content)} chars)")

        return RedefineResponse(content=content)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_redefine: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
