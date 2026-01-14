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

    system_instruction = """You are a strict Filipino reading teacher evaluating student summaries. Be rigorous and fair in your grading."""

    user_prompt = f"""Main Idea: {main_idea}

Student Summary: {summary}

GRADING CRITERIA (be strict):
- Nonsensical/gibberish answers: 0-10 points
- Off-topic or irrelevant: 10-30 points  
- Partially captures main idea but lacks detail: 40-60 points
- Good coverage with minor gaps: 70-85 points
- Excellent, comprehensive summary: 90-100 points

The summary MUST directly address the main idea with relevant content. Generic responses, single words, or unrelated text should receive very low scores (0-20).

Return JSON only (strengths and improvements MUST be arrays, even if empty):
{{
  "overall_score": <score 0-100>,
  "strengths": ["what they did well"] or [] if no strengths,
  "improvements": ["specific issues to fix"],
  "feedback": "brief comment explaining the score"
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
        # Use main_idea if provided, otherwise use passage_text
        main_idea = request.main_idea if request.main_idea else request.passage_text
        
        system_instruction, user_prompt = build_summary_evaluation_prompt({
            "main_idea": main_idea,
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
            
            # Ensure strengths and improvements are always lists
            strengths = result.get("strengths", [])
            if not isinstance(strengths, list):
                strengths = [strengths] if strengths and strengths.lower() not in ["no", "none", "n/a"] else []
            
            improvements = result.get("improvements", [])
            if not isinstance(improvements, list):
                improvements = [improvements] if improvements else []
            
            return SummaryCheckResponse(
                overall_score=score,
                feedback=result.get("feedback", ""),
                strengths=strengths[:2],
                improvements=improvements[:2],
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
            
            # Fallback: Indicate AI error
            raise HTTPException(
                status_code=503,
                detail="AI is having trouble processing your summary. Please try submitting again."
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in handle_summary_check: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
