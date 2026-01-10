from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from rag.RAGOrchestrator import get_rag_orchestrator
    rag = get_rag_orchestrator()
    print("RAG orchestrator loaded in tips.py")
except ImportError as e:
    print(f"⚠️ Error importing RAG orchestrator in tips.py: {e}")
    rag = None

try:
    from groq import Groq

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")

    groq_client = Groq(api_key=groq_api_key)

    print("✅ Groq client initialized in tips.py")
except Exception as e:
    print(f"⚠️ Error initializing Groq in tips handler: {e}")
    groq_client = None


class TipsRequest(BaseModel):
    score: int
    missedLowFreq: int
    similarChoiceErrors: int
    lastDifficulty: str
    module: str


class TipsResponse(BaseModel):
    tips: str


def tips_prompt_with_rag(data: dict) -> str:
    """Generate tips prompt with RAG context including common mistakes and strategies"""
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

    rag_context = ""

    if rag:
        try:
            # If student struggled with low-frequency words
            if missed_low_freq > 2:
                rag_query = f"Filipino {module} learning strategies for uncommon words and rare vocabulary. Memory techniques and study methods"

                strategies_context = rag.get_context(
                    rag_query,
                    context_type="strategies",
                    top_k=2,
                    min_similarity=0.3
                )

                mistakes_context = rag.get_context(
                    f"Filipino {module} common mistakes with vocabulary",
                    context_type="mistakes",
                    top_k=1,
                    min_similarity=0.3
                )

                rag_context = strategies_context + "\n" + mistakes_context

            # If student made many similar choice errors
            elif similar_errors > 2:
                rag_query = f"Filipino {module} common mistakes and confusion points"

                mistakes_context = rag.get_context(
                    rag_query,
                    context_type="mistakes",
                    top_k=2,
                    min_similarity=0.3
                )

                strategies_context = rag.get_context(
                    f"Filipino {module} learning strategies to distinguish similar words",
                    context_type="strategies",
                    top_k=1,
                    min_similarity=0.3
                )

                rag_context = mistakes_context + "\n" + strategies_context

            # General tips based on score
            else:
                rag_query = f"Filipino {module} study strategies and learning tips for UPCAT preparation"

                strategies_context = rag.get_context(
                    rag_query,
                    context_type="strategies",
                    top_k=2,
                    min_similarity=0.3
                )

                rag_context = strategies_context

            if rag_context:
                print(
                    f"Retrieved RAG context for tips ({len(rag_context)} chars)")
            else:
                print("⚠️ No RAG context found for tips")

        except Exception as e:
            print(f"⚠️ Error getting RAG context for tips: {e}")
            import traceback
            traceback.print_exc()
            rag_context = ""
    else:
        print("⚠️ RAG not available for tips")

    # System instruction for Groq
    system_instruction = """You are a Filipino language tutor specializing in UPCAT preparation. Use the provided learning strategies and common mistakes data to give personalized, actionable study tips. Be encouraging but honest. Respond in Filipino."""

    # Build the prompt
    prompt = f"""{system_instruction}

{rag_context if rag_context else "Note: Reference materials are temporarily unavailable, but provide helpful tips based on your knowledge."}

**Student Performance Data:**
- Module: {module}
- Current Score: {score}%
- Low-frequency words missed: {missed_low_freq}
- Similar choice errors: {similar_errors}
- Last difficulty level: {difficulty}

Based on the performance data and reference materials above, provide 3-4 personalized study tips:

1. **Main weakness identification** - What specific area needs improvement based on their errors?
2. **Targeted strategy** - Specific learning technique to address their main weakness (cite relevant strategies from references if available)
3. **Practice recommendation** - What type of exercises should they focus on?
4. **Motivation/encouragement** - Brief encouraging note

Keep each tip concise (1-2 sentences). Use bullet points. Be specific and actionable."""

    return (system_instruction, prompt)


async def handle_tips(request: TipsRequest) -> TipsResponse:
    """
    Generate personalized study tips using Groq API with RAG context
    """
    try:
        print(
            f"💡 Tips request - Module: {request.module}, Score: {request.score}%")

        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="Groq service not available"
            )

        prompt_data = {
            "module": request.module,
            "score": request.score,
            "missedLowFreq": request.missedLowFreq,
            "similarChoiceErrors": request.similarChoiceErrors,
            "lastDifficulty": request.lastDifficulty
        }

        # Build prompt with RAG context
        system_instruction, user_prompt = tips_prompt_with_rag(prompt_data)

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]

        print(f"🤖 Calling Groq for tips...")

        # ✅ Call Groq API
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.3,
            max_tokens=400,
            top_p=1,
            stream=False
        )

        tips = completion.choices[0].message.content or ""
        print(f"✅ Generated tips ({len(tips)} chars)")

        return TipsResponse(tips=tips)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_tips: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
