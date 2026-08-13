from extensions import db


class Innings(db.Model):
    __tablename__ = "innings"

    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("matches.id"), nullable=False)
    innings_number = db.Column(db.Integer, nullable=False)
    batting_team_id = db.Column(db.Integer, db.ForeignKey("teams.id"), nullable=False)
    total_runs = db.Column(db.Integer, default=0)
    total_wickets = db.Column(db.Integer, default=0)
    total_overs = db.Column(db.Float, default=0.0)

    batting_team = db.relationship("Team")

    def to_dict(self):
        return {
            "id": self.id, "innings_number": self.innings_number,
            "batting_team": self.batting_team.to_dict() if self.batting_team else None,
            "total_runs": self.total_runs, "total_wickets": self.total_wickets, "total_overs": self.total_overs,
        }
