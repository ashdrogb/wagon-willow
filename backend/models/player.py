from extensions import db


class Player(db.Model):
    __tablename__ = "players"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    role = db.Column(db.String(30))

    team = db.relationship("Team", backref="players")

    def to_dict(self):
        return {"id": self.id, "full_name": self.full_name, "team_id": self.team_id, "role": self.role}
