from extensions import db


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)
    team1_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)
    team2_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)
    venue = db.Column(db.String(150))
    match_date = db.Column(db.Date)
    format = db.Column(db.String(10))
    gender = db.Column(db.String(10), default="male")
    winner_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    result_margin = db.Column(db.String(60))

    team1 = db.relationship("Team", foreign_keys=[team1_id])
    team2 = db.relationship("Team", foreign_keys=[team2_id])
    winner = db.relationship("Team", foreign_keys=[winner_id])
    innings = db.relationship("Innings", backref="match", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "team1": self.team1.to_dict() if self.team1 else None,
            "team2": self.team2.to_dict() if self.team2 else None,
            "venue": self.venue,
            "match_date": self.match_date.isoformat() if self.match_date else None,
            "format": self.format,
            "gender": self.gender,
            "winner_id": self.winner_id,
            "result_margin": self.result_margin,
        }
