def test_crud_jobs_flow(client):
    # Register Candidate & HR
    client.post(
        "/auth/register",
        json={"name": "HR User", "email": "hr@test.com", "password": "password", "role": "ROLE_HR"}
    )
    client.post(
        "/auth/register",
        json={"name": "Candidate User", "email": "cand@test.com", "password": "password", "role": "ROLE_CANDIDATE"}
    )
    
    # Get Tokens
    hr_token = client.post("/auth/login", json={"email": "hr@test.com", "password": "password"}).json()["access_token"]
    cand_token = client.post("/auth/login", json={"email": "cand@test.com", "password": "password"}).json()["access_token"]
    
    # 1. Candidate tries to create job (should be Forbidden 403)
    response = client.post(
        "/jobs",
        json={
            "title": "Backend Dev",
            "description": "FastAPI coder",
            "required_skills": ["Python"],
            "preferred_skills": ["Kafka"]
        },
        headers={"Authorization": f"Bearer {cand_token}"}
    )
    assert response.status_code == 403
    
    # 2. HR creates job (should succeed 201)
    response = client.post(
        "/jobs",
        json={
            "title": "FastAPI Developer",
            "description": "Python web services developer",
            "required_skills": ["Python", "FastAPI"],
            "preferred_skills": ["Docker", "PostgreSQL"]
        },
        headers={"Authorization": f"Bearer {hr_token}"}
    )
    assert response.status_code == 201
    job_data = response.json()
    job_id = job_data["id"]
    assert job_data["title"] == "FastAPI Developer"
    
    # 3. Read jobs list (open to both candidate and HR)
    response = client.get("/jobs", headers={"Authorization": f"Bearer {cand_token}"})
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 4. Edit job
    response = client.put(
        f"/jobs/{job_id}",
        json={
            "title": "Lead FastAPI Developer",
            "description": "Python web services developer",
            "required_skills": ["Python", "FastAPI", "Kubernetes"],
            "preferred_skills": ["Docker", "PostgreSQL"]
        },
        headers={"Authorization": f"Bearer {hr_token}"}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Lead FastAPI Developer"
    assert "Kubernetes" in response.json()["required_skills"]
    
    # 5. Delete job (should succeed)
    response = client.delete(f"/jobs/{job_id}", headers={"Authorization": f"Bearer {hr_token}"})
    assert response.status_code == 204
    
    # Verify deleted
    response = client.get("/jobs", headers={"Authorization": f"Bearer {cand_token}"})
    assert len(response.json()) == 0
