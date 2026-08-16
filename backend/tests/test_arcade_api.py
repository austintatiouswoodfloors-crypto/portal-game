"""Backend API tests for CLOBA Arcade (scores + leaderboard)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/") or \
    "https://play-portal-85.preview.emergentagent.com"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def unique_players():
    tag = uuid.uuid4().hex[:8]
    return {
        "nailing": f"TEST_nail_{tag}",
        "plum": f"TEST_plum_{tag}",
        "ninja": f"TEST_ninja_{tag}",
    }


# ---------- Root health ----------
class TestRoot:
    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "message" in r.json()


# ---------- Score submission ----------
class TestScores:
    def test_submit_new_best_creates(self, api_client, unique_players):
        player = unique_players["nailing"]
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "nailing", "player": player, "score": 10})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["best"] == 10
        assert d["is_new_best"] is True
        assert isinstance(d["rank"], int) and d["rank"] >= 1

    def test_submit_lower_not_new_best(self, api_client, unique_players):
        player = unique_players["nailing"]
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "nailing", "player": player, "score": 5})
        assert r.status_code == 200
        d = r.json()
        assert d["best"] == 10
        assert d["is_new_best"] is False

    def test_submit_higher_updates_best(self, api_client, unique_players):
        player = unique_players["nailing"]
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "nailing", "player": player, "score": 25})
        assert r.status_code == 200
        d = r.json()
        assert d["best"] == 25
        assert d["is_new_best"] is True

    def test_submit_plum_ok(self, api_client, unique_players):
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "plum", "player": unique_players["plum"], "score": 42})
        assert r.status_code == 200
        assert r.json()["best"] == 42

    def test_submit_ninja_ok(self, api_client, unique_players):
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "ninja", "player": unique_players["ninja"], "score": 99})
        assert r.status_code == 200
        assert r.json()["best"] == 99

    def test_submit_unknown_game_400(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "chess", "player": "TEST_x", "score": 1})
        assert r.status_code == 400

    def test_submit_empty_player_becomes_anonymous(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "plum", "player": "   ", "score": 1})
        assert r.status_code == 200

    def test_submit_negative_score_clamped_to_zero(self, api_client):
        player = f"TEST_neg_{uuid.uuid4().hex[:6]}"
        r = api_client.post(f"{BASE_URL}/api/scores",
                            json={"game": "plum", "player": player, "score": -50})
        assert r.status_code == 200
        assert r.json()["best"] == 0


# ---------- Leaderboard ----------
class TestLeaderboard:
    def test_leaderboard_nailing_contains_player(self, api_client, unique_players):
        r = api_client.get(f"{BASE_URL}/api/leaderboard/nailing?limit=50")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list)
        # sorted desc
        scores = [row["score"] for row in rows]
        assert scores == sorted(scores, reverse=True)
        # our player exists with best 25
        me = [row for row in rows if row["player"] == unique_players["nailing"]]
        assert len(me) == 1
        assert me[0]["score"] == 25
        assert "rank" in me[0]

    def test_leaderboard_plum_ok(self, api_client, unique_players):
        r = api_client.get(f"{BASE_URL}/api/leaderboard/plum")
        assert r.status_code == 200
        players = {row["player"] for row in r.json()}
        assert unique_players["plum"] in players

    def test_leaderboard_ninja_ok(self, api_client, unique_players):
        r = api_client.get(f"{BASE_URL}/api/leaderboard/ninja")
        assert r.status_code == 200
        players = {row["player"] for row in r.json()}
        assert unique_players["ninja"] in players

    def test_leaderboard_unknown_game_400(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/leaderboard/chess")
        assert r.status_code == 400

    def test_leaderboard_no_mongo_id_leak(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/leaderboard/nailing")
        assert r.status_code == 200
        for row in r.json():
            assert "_id" not in row
            assert set(row.keys()) >= {"rank", "player", "score"}
