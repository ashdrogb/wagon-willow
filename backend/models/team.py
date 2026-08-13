from extensions import db


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    short_name = db.Column(db.String(10))
    country = db.Column(db.String(80))
    gender = db.Column(db.String(10), default="male")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "short_name": self.short_name,
            "country": self.country, "gender": self.gender,
        }
