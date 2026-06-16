import io
import pytest

def test_applications_and_resumes_flow(client, db_session):
    # Override SessionLocal so background tasks share the same transaction in testing
    import app.routers.applications
    import workers.parser_worker
    
    app.routers.applications.SessionLocal = lambda: db_session
    workers.parser_worker.SessionLocal = lambda: db_session

    # Register Candidate & HR
    client.post(
        "/auth/register",
        json={"name": "HR Recruiter", "email": "hr_rec@test.com", "password": "password", "role": "ROLE_HR"}
    )
    client.post(
        "/auth/register",
        json={"name": "Candidate Jobseeker", "email": "cand_seeker@test.com", "password": "password", "role": "ROLE_CANDIDATE"}
    )
    
    # Get Tokens
    hr_token = client.post("/auth/login", json={"email": "hr_rec@test.com", "password": "password"}).json()["access_token"]
    cand_token = client.post("/auth/login", json={"email": "cand_seeker@test.com", "password": "password"}).json()["access_token"]
    
    # 1. Candidate uploads standalone profile resume
    pdf_content = b"%PDF-1.4 Mock PDF content with FastAPI, Python, and React experience"
    response = client.post(
        "/applications/profile/resume",
        headers={"Authorization": f"Bearer {cand_token}"},
        files={"file": ("resume.pdf", io.BytesIO(pdf_content), "application/pdf")}
    )
    assert response.status_code == 200
    candidate_data = response.json()
    assert candidate_data["resume_url"] is not None

    # 2. Get candidate profile to verify resume is there and parsed
    response = client.get("/applications/profile", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 200
    profile_data = response.json()
    assert profile_data["resume_url"] is not None
    assert "FastAPI" in profile_data["skills"] or "Python" in profile_data["skills"]

    # 3. Delete profile resume
    response = client.delete("/applications/profile/resume", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 204

    # 4. Profile should have resume_url as None now
    response = client.get("/applications/profile", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 200
    assert response.json()["resume_url"] is None
    assert len(response.json()["skills"]) == 0

    # 5. HR creates a job
    response = client.post(
        "/jobs",
        json={
            "title": "React Engineer",
            "description": "Building next gen user experiences with React",
            "required_skills": ["React"],
            "preferred_skills": ["CSS"]
        },
        headers={"Authorization": f"Bearer {hr_token}"}
    )
    assert response.status_code == 201
    job_id = response.json()["id"]

    # 6. Candidate applies for the job with a resume file
    response = client.post(
        "/applications",
        headers={"Authorization": f"Bearer {cand_token}"},
        data={"job_id": job_id},
        files={"file": ("resume.pdf", io.BytesIO(pdf_content), "application/pdf")}
    )
    assert response.status_code == 201
    app_data = response.json()
    app_id = app_data["id"]
    assert app_data["status"] == "APPLIED"

    # 7. Candidate gets their applications list to verify application exists
    response = client.get("/applications/my", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == app_id

    # 8. Candidate withdraws/deletes their application
    response = client.delete(f"/applications/{app_id}", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 204

    # 9. Verify the application list is empty now
    response = client.get("/applications/my", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 0
