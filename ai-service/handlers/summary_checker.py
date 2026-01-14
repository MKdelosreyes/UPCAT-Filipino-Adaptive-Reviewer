from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from groq import Groq

    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY not found in environment")

    groq_client = Groq(api_key=groq_api_key)
    print("✅ Groq client initialized in summary_checker.py")
except Exception as e:
    print(f"⚠️ Error initializing Groq in summary_checker: {e}")
    groq_client = None


# ============================================================
# REQUEST/RESPONSE MODELS (defined in main.py, imported here for type hints)
# ============================================================

# These models are now defined in main.py to avoid import issues with FastAPI
# We'll use TYPE_CHECKING to import them for type hints only
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pydantic import BaseModel as _BaseModel
    
    class SummaryCheckRequest(_BaseModel):
        passage_text: str
        user_summary: str
        passage_title: Optional[str] = "Reading Passage"
        difficulty: Optional[str] = "medium"
    
    class SummaryCheckResponse(_BaseModel):
        overall_score: int
        feedback: str
        strengths: List[str]
        improvements: List[str]
        key_points_covered: int
        key_points_total: int
        detailed_scores: dict
else:
    # At runtime, we'll receive the actual models from main.py
    class SummaryCheckRequest(BaseModel):
        passage_text: str
        user_summary: str
        main_idea: str
        passage_title: Optional[str] = "Reading Passage"
        difficulty: Optional[str] = "medium"
    
    class SummaryCheckResponse(BaseModel):
        overall_score: int
        feedback: str
        strengths: List[str]
        improvements: List[str]
        key_points_covered: int
        key_points_total: int
        detailed_scores: dict


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_summary_evaluation_prompt(data: dict) -> tuple:
    """Generate evaluation prompt for Groq"""
    main_idea = data["main_idea"]
    summary = data["user_summary"]
    title = data.get("passage_title", "Reading Passage")

    system_instruction = """You are a Filipino language teacher grading student summaries. Be brief, encouraging, and specific."""

    user_prompt = f"""**Pamagat:** {title}

**Pangunahing Ideya (Main Idea):**
{main_idea}

**Buod ng Estudyante (Student Summary):**
{summary}

---

**TASK:** Compare the student's summary with the main idea above. Grade how well they captured the key points.

**Return JSON only:**
{{
  "overall_score": <0-100 score based on how well summary matches main idea>,
  "strengths": ["1-2 things they did well"],
  "improvements": ["1-2 suggestions"],
  "feedback": "1-2 encouraging sentences in Filipino"
}}
"""

    return (system_instruction, user_prompt)


# ============================================================
# MAIN HANDLER
# ============================================================

async def handle_summary_check(request: SummaryCheckRequest) -> SummaryCheckResponse:
    """Evaluate user summary using Groq AI"""
    try:
        print(f"📝 Summary check request - Passage: {request.passage_title[:50]}...")

        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="Groq service not available"
            )

        # Build evaluation prompt
        system_instruction, user_prompt = build_summary_evaluation_prompt({
            "main_idea": request.main_idea,
            "user_summary": request.user_summary,
            "passage_title": request.passage_title,
        })

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]

        print(f"🤖 Calling Groq for summary evaluation...")

        # Call Groq API
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.3,  # Lower temp for consistent evaluation
            max_tokens=600,
            top_p=1,
            stream=False
        )

        response_text = completion.choices[0].message.content or ""
        print(f"✅ Generated evaluation ({len(response_text)} chars)")

        # Parse JSON response
        try:
            # Clean potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(response_text)
            
            score = int(result.get("overall_score", 0))
            
            return SummaryCheckResponse(
                overall_score=score,
                feedback=result.get("feedback", ""),
                strengths=result.get("strengths", [])[:2],
                improvements=result.get("improvements", [])[:2],
                key_points_covered=1 if score >= 70 else 0,
                key_points_total=1,
                detailed_scores={
                    "coverage": score,
                    "accuracy": score,
                    "clarity": score,
                    "completeness": score
                }
            )

        except json.JSONDecodeError as e:
            print(f"⚠️ Failed to parse JSON response: {e}")
            print(f"Raw response: {response_text}")
            
            # Fallback: Return basic response
            return SummaryCheckResponse(
                overall_score=70,
                feedback="Summary received and reviewed. Good effort!",
                strengths=["Clear writing"],
                improvements=["Try to include more key points"],
                key_points_covered=0,
                key_points_total=0,
                detailed_scores={"coverage": 70, "accuracy": 70, "clarity": 70, "completeness": 70}
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_summary_check: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
