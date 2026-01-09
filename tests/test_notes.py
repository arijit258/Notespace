def _token(client):
    client.post("/auth/register", json={"email":"n@n.com", "password":"pass1234"})
    r = client.post("/auth/login", data={"username":"n@n.com", "password":"pass1234"})
    return r.json()["access_token"]

def test_notes_crud(client):
    token = _token(client)
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post("/notes", json={"title":"t1", "content":"c1"}, headers=headers)
    assert r.status_code == 201
    note_id = r.json()["id"]

    r = client.get("/notes", headers=headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1

    r = client.put(f"/notes/{note_id}", json={"content":"c2"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["content"] == "c2"

    r = client.delete(f"/notes/{note_id}", headers=headers)
    assert r.status_code == 204
