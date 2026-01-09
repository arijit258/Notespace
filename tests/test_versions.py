def _token(client):
    client.post("/auth/register", json={"email":"v@v.com", "password":"pass1234"})
    r = client.post("/auth/login", data={"username":"v@v.com", "password":"pass1234"})
    return r.json()["access_token"]

def test_versions_and_restore(client):
    token = _token(client)
    h = {"Authorization": f"Bearer {token}"}

    r = client.post("/notes", json={"title":"t1", "content":"c1"}, headers=h)
    note_id = r.json()["id"]

    # update twice -> 2 versions stored
    client.put(f"/notes/{note_id}", json={"content":"c2"}, headers=h)
    client.put(f"/notes/{note_id}", json={"content":"c3"}, headers=h)

    r = client.get(f"/notes/{note_id}/versions", headers=h)
    assert r.status_code == 200
    versions = r.json()
    assert len(versions) == 2

    # restore version 1 (which holds snapshot of content "c1")
    r = client.post(f"/notes/{note_id}/restore/1", headers=h)
    assert r.status_code == 200
    assert r.json()["content"] == "c1"
