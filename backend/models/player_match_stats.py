from extensions import db


class PlayerMatchStats(db.Model):
    __tablename__ = "player_match_stats"

    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("matches.id"), nullable=False)
    innings_id = db.Column(db.Integer, db.ForeignKey("innings.id"), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey("players.id"), nullable=False)
    runs_scored = db.Column(db.Integer, default=0)
    balls_faced = db.Column(db.Integer, default=0)
    fours = db.Column(db.Integer, default=0)
    sixes = db.Column(db.Integer, default=0)
    how_out = db.Column(db.String(30))
    wickets_taken = db.Column(db.Integer, default=0)
    overs_bowled = db.Column(db.Float, default=0.0)
    runs_conceded = db.Column(db.Integer, default=0)

    player = db.relationship("Player")

    def to_dict(self):
        sr = round((self.runs_scored / self.balls_faced) * 100, 2) if self.balls_faced else 0.0
        econ = round(self.runs_conceded / self.overs_bowled, 2) if self.overs_bowled else 0.0
        return {
            "id": self.id, "player": self.player.to_dict() if self.player else None,
            "runs_scored": self.runs_scored, "balls_faced": self.balls_faced,
            "fours": self.fours, "sixes": self.sixes, "strike_rate": sr, "how_out": self.how_out,
            "wickets_taken": self.wickets_taken, "overs_bowled": self.overs_bowled,
            "runs_conceded": self.runs_conceded, "economy": econ,
        }
