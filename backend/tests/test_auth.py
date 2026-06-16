def test_register_candidate(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Candidate User",
            "email": "cand@test.com",
            "password": "password123",
            "role": "ROLE_CANDIDATE"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "cand@test.com"
    assert data["role"] == "ROLE_CANDIDATE"
    assert "id" in data
    assert "password_hash" not in data

def test_register_duplicate_email(client):
    # First signup
    client.post(
        "/auth/register",
        json={
            "name": "First User",
            "email": "dup@test.com",
            "password": "password123",
            "role": "ROLE_CANDIDATE"
        }
    )
    
    # Second signup with same email
    response = client.post(
        "/auth/register",
        json={
            "name": "Duplicate User",
            "email": "dup@test.com",
            "password": "password123",
            "role": "ROLE_HR"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_success(client):
    # Register first
    client.post(
        "/auth/register",
        json={
            "name": "Login User",
            "email": "login@test.com",
            "password": "password123",
            "role": "ROLE_CANDIDATE"
        }
    )
    
    # Login
    response = client.post(
        "/auth/login",
        json={
            "email": "login@test.com",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

def test_get_me(client):
    # Register and login to get token
    client.post(
        "/auth/register",
        json={
            "name": "Me User",
            "email": "me@test.com",
            "password": "password123",
            "role": "ROLE_HR"
        }
    )
    
    login_resp = client.post(
        "/auth/login",
        json={
            "email": "me@test.com",
            "password": "password123"
        }
    )
    token = login_resp.json()["access_token"]
    
    # Query Profile
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@test.com"
    assert data["role"] == "ROLE_HR"
