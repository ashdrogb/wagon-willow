import json
from datetime import datetime, timezone
from extensions import db


class SimulatedMatch(db.Model):
    """Stores one completed run of the probabilistic simulator, scoped to
    the user who ran it. result_json holds the full engine output (innings,
    scorecards, wagon wheel, pitch map) exactly as the frontend produced it —
    the backend doesn't re-derive or validate the simulation math, it's just
    the persistence layer for something computed client-side."""
    __tablename__ = "simulated_matches"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    team_a_name = db.Column(db.String(120))
    team_b_name = db.Column(db.String(120))
    format = db.Column(db.String(10))
    gender = db.Column(db.String(10))
    ground = db.Column(db.String(120))
    winner = db.Column(db.String(120))
    margin = db.Column(db.String(80))
    result_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self, include_result=True):
        data = {
            "id": self.id,
            "team_a_name": self.team_a_name,
            "team_b_name": self.team_b_name,
            "format": self.format,
            "gender": self.gender,
            "ground": self.ground,
            "winner": self.winner,
            "margin": self.margin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_result:
            data["result"] = json.loads(self.result_json)
        return data
