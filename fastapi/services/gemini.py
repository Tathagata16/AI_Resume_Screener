import os
import json
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types
from prompts.templates import PARSER_SYSTEM_PROMPT, RANKING_SYSTEM_PROMPT, build_parser_prompt, build_ranking_prompt
from schemas.models import ResumeParsedData, RankResponse

def _get_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=api_key)

def _clean_and_load_json(raw_text: str) -> dict:
    """
    Cleans up LLM text response from any markdown backticks (```json) 
    and parses it into a Python dictionary.
    """
    text = raw_text.strip()
    if text.startswith("```"):
        if text.startswith("```json"):
            text = text[7:]
        else:
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
    text = text.strip()
    return json.loads(text)

def parse_resume_text(text: str) -> ResumeParsedData:
    """
    Calls Gemini API to parse candidate details from unstructured resume text.
    Enforces strict Pydantic schemas using response_schema.
    """
    if not text.strip():
        return ResumeParsedData(candidateName="Unknown Candidate")
        
    client = _get_client()
    prompt = build_parser_prompt(text)
    
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=PARSER_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ResumeParsedData,
            )
        )
        data = _clean_and_load_json(response.text)
        
        # Ensure name is not empty
        if not data.get("candidateName") or data.get("candidateName").strip() == "":
            data["candidateName"] = "Unknown Candidate"
            
        return ResumeParsedData(**data)
    except Exception as e:
        print(f"Error parsing resume via Gemini: {e}")
        # Return fallback parsed data
        return ResumeParsedData(
            candidateName="Parsing Failed",
            email="",
            experience=[],
            skills=[],
            education=[]
        )

def rank_candidates_llm(job_description: dict, candidates: list[dict]) -> RankResponse:
    """
    Calls Gemini API with RAG context to rank multiple candidates.
    Enforces strict Pydantic schemas using response_schema.
    """
    if not candidates:
        return RankResponse(ranking=[], summary="No candidates to evaluate.")
        
    client = _get_client()
    prompt = build_ranking_prompt(job_description, candidates)
    
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=RANKING_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=RankResponse,
            )
        )
        data = _clean_and_load_json(response.text)
        return RankResponse(**data)
    except Exception as e:
        print(f"Error ranking candidates via Gemini: {e}")
        # Return empty fallback response
        fallback_rankings = []
        for idx, c in enumerate(candidates):
            fallback_rankings.append({
                "resumeId": c["resumeId"],
                "rank": idx + 1,
                "score": 0,
                "strengths": ["Evaluation failed due to API issue"],
                "missingSkills": [],
                "justification": f"Ranking failed for {c['name']} because the AI service encountered an error.",
                "recommendation": "Needs Manual Review"
            })
        return RankResponse(
            ranking=fallback_rankings,
            summary="An error occurred during AI processing, returning fallback ranking information."
        )
