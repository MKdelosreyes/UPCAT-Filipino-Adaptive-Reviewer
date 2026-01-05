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
    print("✅ RAG orchestrator loaded in tips.py")
except ImportError as e:
    print(f"⚠️ Error importing RAG orchestrator in tips.py: {e}")
    rag = None

# Import OpenAI client
try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("✅ OpenAI client initialized in tips.py")
except Exception as e:
    print(f"⚠️ Error initializing OpenAI in tips handler: {e}")
    openai_client = None


# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class TipsRequest(BaseModel):
    score: int
    missedLowFreq: int
    similarChoiceErrors: int
    lastDifficulty: str
    module: str


class TipsResponse(BaseModel):
    tips: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def tips_prompt_with_rag(data: dict) -> str:
    """
    ✅ NEW: Generate tips prompt with RAG context
    """
    module_map = {
        "vocabulary": "vocab",
        "grammar": "grammar",
        "sentence-construction": "sentences",
        "reading-comprehension": "reading"
    }

    module = module_map.get(data["module"], data["module"])
    score = data["score"]
    missed_low_freq = data["missedLowFreq"]
    similar_errors = data["similarChoiceErrors"]
    difficulty = data["lastDifficulty"]

    # ============================================================
    # GET RAG CONTEXT BASED ON STUDENT'S WEAK AREAS
    # ============================================================

    rag_context = ""

    if rag:
        try:
            # Determine what kind of help the student needs
            if missed_low_freq > 2:
                # Student struggles with uncommon words
                rag_query = f"Filipino {module} learning strategies for uncommon words and rare vocabulary. Memory techniques and study methods."
                context_type = "vocabulary" if module == "vocab" else "mixed"
            elif similar_errors > 2:
                # Student confuses similar options
                rag_query = f"Filipino {module} common mistakes and confusion points. How to distinguish similar words or grammar patterns."
                context_type = "grammar" if module == "grammar" else "mixed"
            else:
                # General improvement
                rag_query = f"Filipino {module} study tips and learning strategies for UPCAT preparation"
                context_type = "mixed"

            rag_context = rag.get_context(
                rag_query,
                context_type=context_type,
                top_k=2,
                min_similarity=0.3
            )

            print(
                f"✅ Retrieved RAG context for tips ({len(rag_context)} chars)")
        except Exception as e:
            print(f"⚠️ Error getting RAG context for tips: {e}")
            rag_context = ""
    else:
        print("⚠️ RAG not available for tips")

    # ============================================================
    # BUILD PROMPT WITH RAG CONTEXT
    # ============================================================

    prompt = f"""Filipino {module} tutor for UPCAT prep.

{rag_context}

**Student Stats:**
- Score: {score}%
- Missed rare words: {missed_low_freq}
- Confused similar options: {similar_errors}
- Current level: {difficulty}

Based on the reference materials above (if provided), provide:

**📊 Analysis** (1-2 sentences on strengths/weaknesses based on stats)

**💡 Focus Areas** (3 specific, actionable tips with emojis. If references mention common mistakes or learning strategies, cite them)

**🎯 Next Steps** (recommended difficulty level + 1 concrete action. If references suggest strategies, incorporate them)

Keep concise, practical, and encouraging. Cite specific learning strategies from references when relevant."""

    return prompt


# ============================================================
# MAIN HANDLER FUNCTION
# ============================================================

async def handle_tips(request: TipsRequest) -> TipsResponse:
    """
    ✅ ENHANCED: Generate tips with RAG integration
    """
    try:
        print(
            f"📝 Tips request - Module: {request.module}, Score: {request.score}")

        if not openai_client:
            print("⚠️ OpenAI not available, using fallback tips")
            fallback_tips = generate_fallback_tips(request.dict())
            return TipsResponse(tips=fallback_tips)

        # ✅ Use RAG-enhanced prompt builder
        prompt = tips_prompt_with_rag(request.dict())

        print(f"🤖 Calling OpenAI with RAG-enhanced prompt for tips...")

        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=450,
            messages=[
                {
                    "role": "system",
                    "content": "You are a Filipino tutor. Use reference materials to give evidence-based, practical study tips. Always cite specific strategies or common mistakes when available from references."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        tips = completion.choices[0].message.content or "Unable to generate tips."
        print(f"✅ Generated RAG-enhanced tips ({len(tips)} chars)")

        return TipsResponse(tips=tips)

    except Exception as e:
        print(f"❌ Error generating tips: {e}")
        import traceback
        traceback.print_exc()

        # Fallback to basic tips
        fallback_tips = generate_fallback_tips(request.dict())
        return TipsResponse(tips=fallback_tips)


def generate_fallback_tips(data: dict) -> str:
    """
    Generate basic tips when AI service fails.
    """
    score = data["score"]
    missed_low_freq = data["missedLowFreq"]
    similar_errors = data["similarChoiceErrors"]

    tips = "📊 **Analysis**\n"
    tips += "Good effort! " if score >= 60 else "Keep practicing! "
    tips += f"You scored {score}%.\n"

    tips += "\n💡 **Focus Areas**\n"

    if missed_low_freq > 2:
        tips += "• 📚 Study uncommon words - create flashcards for rare vocabulary\n"
    if similar_errors > 2:
        tips += "• 🔍 Practice distinguishing similar options - compare definitions side-by-side\n"
    if score < 70:
        tips += "• 📖 Review fundamentals - strengthen your foundation\n"

    if not (missed_low_freq > 2 or similar_errors > 2 or score < 70):
        tips += "• ✅ Keep up the good work - focus on consistency\n"
        tips += "• 📈 Challenge yourself with harder difficulty levels\n"
        tips += "• 🎯 Review mistakes to prevent patterns\n"

    tips += f"\n📅 **15-Min Daily Plan**\n"
    tips += "• 0-5 min: Review mistakes from previous exercises\n"
    tips += "• 5-10 min: Practice new exercises\n"
    tips += "• 10-15 min: Read example sentences and usage notes\n"

    tips += f"\n🎯 **Next Steps:** Continue at {data['lastDifficulty']} level"

    if score >= 80:
        tips += " or try the next difficulty"

    return tips
