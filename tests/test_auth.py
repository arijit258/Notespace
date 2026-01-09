def test_register_and_login(client):
    r = client.post("/auth/register", json={"email":"a@a.com", "password":"pass1234"})
    assert r.status_code == 200
    r = client.post("/auth/login", data={"username":"a@a.com", "password":"pass1234"})
    assert r.status_code == 200
    assert "access_token" in r.json()
