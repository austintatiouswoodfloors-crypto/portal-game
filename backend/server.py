from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

VALID_GAMES = {"nailing", "plum", "ninja"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class ScoreCreate(BaseModel):
    game: str
    player: str
    score: int


class SubmitResult(BaseModel):
    best: int
    rank: int
    is_new_best: bool


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "CLOBA Arcade API"}


@api_router.post("/scores", response_model=SubmitResult)
async def submit_score(payload: ScoreCreate):
    if payload.game not in VALID_GAMES:
        raise HTTPException(status_code=400, detail="Unknown game")

    player = payload.player.strip()[:24] or "Anonymous"
    score = max(0, int(payload.score))

    existing = await db.scores.find_one({"game": payload.game, "player": player})
    prev_best = int(existing["score"]) if existing else 0
    is_new_best = score > prev_best

    if is_new_best:
        await db.scores.update_one(
            {"game": payload.game, "player": player},
            {
                "$set": {"score": score, "updated_at": now_iso()},
                "$setOnInsert": {
                    "id": str(uuid.uuid4()),
                    "game": payload.game,
                    "player": player,
                    "created_at": now_iso(),
                },
            },
            upsert=True,
        )

    best = max(prev_best, score)
    higher = await db.scores.count_documents(
        {"game": payload.game, "score": {"$gt": best}}
    )
    return SubmitResult(best=best, rank=higher + 1, is_new_best=is_new_best)


@api_router.get("/leaderboard/{game}")
async def leaderboard(game: str, limit: int = 50):
    if game not in VALID_GAMES:
        raise HTTPException(status_code=400, detail="Unknown game")
    limit = max(1, min(limit, 100))
    cursor = db.scores.find({"game": game}, {"_id": 0}).sort("score", -1).limit(limit)
    rows = await cursor.to_list(length=limit)
    return [
        {
            "rank": i + 1,
            "player": r.get("player", "Anonymous"),
            "score": int(r.get("score", 0)),
        }
        for i, r in enumerate(rows)
    ]


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
