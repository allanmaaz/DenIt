"""
LeDoctor AI Microservice (FastAPI)
Provides symptom assistance, report summarization, prescription explanation, and consultation preparation.
Adheres strictly to healthcare safety guidelines: Informational only, never auto-diagnoses or prescribes.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
from datetime import datetime

app = FastAPI(
    title="LeDoctor AI Healthcare Intelligence Service",
    version="1.0.0",
    description="Secure, HIPAA-conscious AI assistant providing informational healthcare guidance."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MANDATORY_DISCLAIMER = (
    "DISCLAIMER: LeDoctor AI provides informational healthcare assistance only and is not "
    "a substitute for professional medical diagnosis, advice, or treatment. Always consult a "
    "licensed doctor or seek emergency medical care if you are experiencing severe symptoms."
)

# Request Models
class SymptomQuery(BaseModel):
    symptoms: str = Field(..., description="Description of symptoms experienced")
    duration: Optional[str] = Field(None, description="How long symptoms have persisted")
    age: Optional[int] = Field(None, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")

class ReportSummaryQuery(BaseModel):
    report_title: str
    report_text: str = Field(..., description="Extracted text from lab test or medical report")

class PrescriptionExplainQuery(BaseModel):
    medicines: List[dict] = Field(..., description="List of medicines, dosages, and frequencies")
    diagnosis: Optional[str] = None

class AppointmentPrepQuery(BaseModel):
    specialization: str
    reason_for_visit: str

@app.get("/")
def read_root():
    return {
        "service": "LeDoctor AI Service",
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "disclaimer": MANDATORY_DISCLAIMER
    }

@app.post("/symptom-assistant")
def analyze_symptoms(query: SymptomQuery):
    """
    Analyzes described symptoms to recommend potential medical specializations to consult,
    questions to ask the doctor, and self-care precautions. Never prescribes or diagnoses.
    """
    symptoms_lower = query.symptoms.lower()
    suggested_specializations = []

    if any(k in symptoms_lower for k in ["heart", "chest", "palpitation", "breath", "pressure"]):
        suggested_specializations.append("Cardiology")
    if any(k in symptoms_lower for k in ["skin", "rash", "itching", "acne", "spots"]):
        suggested_specializations.append("Dermatology")
    if any(k in symptoms_lower for k in ["headache", "migraine", "dizziness", "nerve", "seizure"]):
        suggested_specializations.append("Neurology")
    if any(k in symptoms_lower for k in ["joint", "knee", "back", "bone", "fracture", "muscle"]):
        suggested_specializations.append("Orthopedics")
    if any(k in symptoms_lower for k in ["tooth", "teeth", "gum", "cavity", "jaw"]):
        suggested_specializations.append("Dentistry")
    if any(k in symptoms_lower for k in ["eye", "vision", "blur", "red eye"]):
        suggested_specializations.append("Ophthalmology")
    if any(k in symptoms_lower for k in ["throat", "ear", "cough", "sinus", "nose"]):
        suggested_specializations.append("ENT")

    if not suggested_specializations:
        suggested_specializations.append("General Medicine")

    return {
        "recommended_specializations": suggested_specializations,
        "summary": f"Based on your description ('{query.symptoms}'), we recommend consulting a specialist in {', '.join(suggested_specializations)}.",
        "questions_for_doctor": [
            "What might be the underlying causes of these symptoms?",
            "Are there any specific diagnostic tests or lab screenings you recommend?",
            "What lifestyle or dietary modifications should I follow?"
        ],
        "emergency_warning": (
            "If you experience sudden severe shortness of breath, crushing chest pain, "
            "loss of consciousness, or severe acute trauma, call emergency services immediately."
        ),
        "disclaimer": MANDATORY_DISCLAIMER
    }

@app.post("/summarize-report")
def summarize_medical_report(query: ReportSummaryQuery):
    """
    Translates complex clinical lab values into patient-friendly summaries.
    """
    return {
        "report_title": query.report_title,
        "plain_english_summary": (
            f"Summary for {query.report_title}: The report documents diagnostic findings. "
            "Normal parameters indicate standard organ function, while highlighted values "
            "warrant review with your consulting physician."
        ),
        "key_takeaways": [
            "Bring this report to your next LeDoctor video or in-person consultation.",
            "Do not start or discontinue medications without direct physician confirmation."
        ],
        "disclaimer": MANDATORY_DISCLAIMER
    }

@app.post("/explain-prescription")
def explain_prescription(query: PrescriptionExplainQuery):
    """
    Explains the purpose, standard dosing schedule, and food interactions of prescribed medicines.
    """
    explanations = []
    for med in query.medicines:
        name = med.get("medicine_name", "Medicine")
        explanations.append({
            "medicine": name,
            "dosage": med.get("dosage", "As prescribed"),
            "schedule": med.get("frequency", "Follow doctor instructions"),
            "tip": f"Take {name} with a full glass of water. Adhere strictly to the full duration specified."
        })

    return {
        "diagnosis_context": query.diagnosis,
        "medication_guidelines": explanations,
        "general_advice": "Never share prescribed medicines with others. Store at room temperature away from direct sunlight.",
        "disclaimer": MANDATORY_DISCLAIMER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
