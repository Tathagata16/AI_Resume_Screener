from pydantic import BaseModel
from typing import Optional, List

class ResumeParsedData(BaseModel):
    candidateName: str
    email: Optional[str] = ""
    experience: List[str] = []
    skills: List[str] = []
    education: List[str] = []

class JobDescriptionInput(BaseModel):
    jobTitle: str
    company: Optional[str] = ""
    experienceRequired: Optional[str] = ""
    requiredSkills: List[str] = []
    preferredSkills: List[str] = []
    responsibilities: List[str] = []
    niceToHaveSkills: List[str] = []
    additionalNotes: Optional[str] = ""

class CandidateInfoInput(BaseModel):
    resumeId: str
    name: str

class RankRequest(BaseModel):
    jobDescription: JobDescriptionInput
    candidates: List[CandidateInfoInput]

class CandidateRanking(BaseModel):
    resumeId: str
    rank: int
    score: int
    strengths: List[str]
    missingSkills: List[str]
    justification: str
    recommendation: str

class RankResponse(BaseModel):
    ranking: List[CandidateRanking]
    summary: str
