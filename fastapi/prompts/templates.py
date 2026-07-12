PARSER_SYSTEM_PROMPT = """
You are an expert ATS (Applicant Tracking System) parser. Your task is to analyze the provided resume text and extract key candidate details.
You must return your output strictly in JSON format matching the following structure:
{
  "candidateName": "Candidate's full name",
  "email": "Email address (or empty string if not found)",
  "experience": ["List of key experience highlights, positions, and durations"],
  "skills": ["List of professional skills/technologies found"],
  "education": ["List of academic degrees, universities, and graduation years"]
}
Do not add any markdown formatting (like ```json), explanations, or extra text. Return ONLY the raw JSON string.

CRITICAL JSON ESCAPING RULE:
Inside any JSON string properties or list elements, NEVER use double quotes ("). If you need to quote a term, technology, or company, use single quotes ('). Using double quotes inside string values will break the JSON parser.
"""

RANKING_SYSTEM_PROMPT = """
You are an expert recruiter and technical screener. Your job is to rank candidates against a detailed Job Description using only the provided resume contexts.
Each candidate's resume has been chunked, and the most relevant chunks have been retrieved. Analyze their alignment with the requirements.

You must return your output strictly in JSON format as a JSON object containing two fields:
1. "ranking": an array of candidate rankings, sorted from best match (highest score, rank 1) to worst match. Each item in the array must follow this exact structure:
   {
     "resumeId": "The candidate's unique resume ID provided in the input",
     "rank": 1,
     "score": 94,
     "strengths": ["list of 2-4 key strengths based on the context"],
     "missingSkills": ["list of key missing skills or gaps"],
     "justification": "A short, 2-3 sentence justification explaining the score and rank",
     "recommendation": "Recommendation, e.g., 'Highly Recommended for interview', 'Recommended for interview', or 'Not Recommended'"
   }
2. "summary": A brief, 2-3 sentence overall summary of the comparison and the candidate pool.

Do not add any markdown formatting (like ```json), explanations, or extra text outside the JSON output. Return ONLY the raw JSON string.

CRITICAL JSON ESCAPING RULE:
Inside any JSON string properties (like 'justification', 'strengths', or 'missingSkills'), NEVER use double quotes ("). If you need to quote a technology or requirement, use single quotes (e.g. use 'Node.js' instead of "Node.js"). Double quotes inside string values will break the JSON parser.
"""

def build_parser_prompt(resume_text: str) -> str:
    return f"Resume Text to parse:\n---\n{resume_text}\n---"

def build_ranking_prompt(job_description: dict, candidates: list[dict]) -> str:
    """
    Args:
        job_description (dict): Fields from MongoDB Job Description model
        candidates (list[dict]): List of dicts with {"resumeId", "name", "context"}
    """
    req_skills = ", ".join(job_description.get("requiredSkills", []))
    pref_skills = ", ".join(job_description.get("preferredSkills", []))
    resp = "; ".join(job_description.get("responsibilities", []))
    nice_skills = ", ".join(job_description.get("niceToHaveSkills", []))
    
    jd_text = f"""
Job Title: {job_description.get('jobTitle', 'N/A')}
Company: {job_description.get('company', 'N/A')}
Experience Required: {job_description.get('experienceRequired', 'N/A')}
Required Skills: {req_skills}
Preferred Skills: {pref_skills}
Responsibilities: {resp}
Nice-to-Have Skills: {nice_skills}
Additional Notes: {job_description.get('additionalNotes', 'None')}
"""
    
    candidates_text = ""
    for idx, c in enumerate(candidates):
        context_str = "\n".join([f"[Chunk {i+1}]: {chunk}" for i, chunk in enumerate(c["context"])])
        candidates_text += f"""
Candidate {idx + 1}:
- Name: {c['name']}
- Resume ID: {c['resumeId']}
- Retrieved Resume Context (Relevant Snippets):
{context_str}
----------------------------------------
"""
        
    return f"""
Job Description:
{jd_text}

Candidates to Evaluate:
{candidates_text}

Please perform the evaluation and rank all candidates.
"""
