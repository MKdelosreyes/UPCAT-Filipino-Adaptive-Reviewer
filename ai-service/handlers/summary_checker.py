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
        quality_level: str  # "needs-work", "developing", "good", "excellent"
        feedback: str
        strengths: List[str]
        improvements: List[str]
        coverage_feedback: str
        clarity_feedback: str
        completeness_feedback: str


# ============================================================
# PROMPT BUILDER
# ============================================================

def build_summary_evaluation_prompt(data: dict) -> tuple:
    """Generate evaluation prompt for Groq"""
    main_idea = data["main_idea"]
    summary = data["user_summary"]
    title = data.get("passage_title", "Reading Passage")

    system_instruction = """You are an encouraging Filipino reading teacher evaluating student summaries. Focus on understanding and effort, not perfection. Be supportive but honest."""

    user_prompt = f"""Main Idea: {main_idea}

Student Summary: {summary}

EVALUATION CRITERIA (be lenient and encouraging):
- Completely off-topic or nonsensical: "needs-work"
- Shows some understanding of the topic, even if incomplete: "developing"
- Captures the main idea reasonably well: "good"
- Demonstrates strong understanding and clear expression: "excellent"

GRADING GUIDANCE:
- If the student shows ANY grasp of the main idea, they deserve at least "developing"
- Focus on what they GOT RIGHT, not what's missing
- "good" should be given liberally if they understand the core concept
- Only use "needs-work" for truly off-topic or incomprehensible responses

Provide DESCRIPTIVE feedback focusing on:
1. Coverage - Did they capture the main idea? What did they understand?
2. Clarity - Is their summary understandable?
3. Completeness - What did they include? What could enhance their summary?

Return JSON only (use Filipino for all text):
{{
  "quality_level": "needs-work" | "developing" | "good" | "excellent",
  "feedback": "brief overall assessment (encouraging tone)",
  "strengths": ["what they did well - always find at least one strength unless needs-work"],
  "improvements": ["specific areas to improve - be gentle and constructive"],
  "coverage_feedback": "What main ideas did they capture? Be positive.",
  "clarity_feedback": "How clear is their summary? Acknowledge effort.",
  "completeness_feedback": "What's included? What could enhance it? Be encouraging."
}}

Be descriptive, specific, and ENCOURAGING. No numbers or percentages.
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
            
            quality_level = result.get("quality_level", "needs-work")
            
            # Ensure strengths and improvements are always lists
            strengths = result.get("strengths", [])
            if not isinstance(strengths, list):
                strengths = [strengths] if strengths and strengths.lower() not in ["no", "none", "n/a", "wala"] else []
            
            improvements = result.get("improvements", [])
            if not isinstance(improvements, list):
                improvements = [improvements] if improvements else []
            
            return SummaryCheckResponse(
                quality_level=quality_level,
                feedback=result.get("feedback", ""),
                strengths=strengths[:3],
                improvements=improvements[:3],
                coverage_feedback=result.get("coverage_feedback", ""),
                clarity_feedback=result.get("clarity_feedback", ""),
                completeness_feedback=result.get("completeness_feedback", "")
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
