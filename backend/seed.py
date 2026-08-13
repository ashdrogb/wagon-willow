"""
Seeds the "deterministic" side of the app — fixed, real-shaped match
records (not randomly simulated). Run with: python3 seed.py
"""
from datetime import date

from app import app
from extensions import db
from models import Team, Player, Match, Innings, PlayerMatchStats


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        india = Team(name="India", short_name="IND", country="India", gender="male")
        australia = Team(name="Australia", short_name="AUS", country="Australia", gender="male")
        db.session.add_all([india, australia])
        db.session.flush()

        india_players = [Player(full_name=n, team_id=india.id, role=r) for n, r in [
            ("Rohit Sharma", "Batsman"), ("Shubman Gill", "Batsman"), ("Virat Kohli", "Batsman"),
            ("KL Rahul", "WK-Batsman"), ("Ravindra Jadeja", "All-rounder"), ("Hardik Pandya", "All-rounder"),
            ("Ravichandran Ashwin", "Bowler"), ("Jasprit Bumrah", "Bowler"), ("Mohammed Shami", "Bowler"),
            ("Kuldeep Yadav", "Bowler"), ("Shreyas Iyer", "Batsman"),
        ]]
        australia_players = [Player(full_name=n, team_id=australia.id, role=r) for n, r in [
            ("David Warner", "Batsman"), ("Travis Head", "Batsman"), ("Steve Smith", "Batsman"),
            ("Marnus Labuschagne", "Batsman"), ("Glenn Maxwell", "All-rounder"), ("Cameron Green", "All-rounder"),
            ("Pat Cummins", "Bowler"), ("Mitchell Starc", "Bowler"), ("Josh Hazlewood", "Bowler"),
            ("Adam Zampa", "Bowler"), ("Alex Carey", "WK-Batsman"),
        ]]
        db.session.add_all(india_players + australia_players)
        db.session.flush()

        match = Match(
            team1_id=india.id, team2_id=australia.id, venue="Narendra Modi Stadium, Ahmedabad",
            match_date=date(2023, 11, 19), format="ODI", gender="male",
            winner_id=australia.id, result_margin="6 wickets",
        )
        db.session.add(match)
        db.session.flush()

        inn1 = Innings(match_id=match.id, innings_number=1, batting_team_id=india.id,
                        total_runs=240, total_wickets=10, total_overs=50.0)
        inn2 = Innings(match_id=match.id, innings_number=2, batting_team_id=australia.id,
                        total_runs=241, total_wickets=4, total_overs=43.0)
        db.session.add_all([inn1, inn2])
        db.session.flush()

        india_scores = [("Rohit Sharma", 47), ("Shubman Gill", 4), ("Virat Kohli", 54),
                         ("KL Rahul", 66), ("Ravindra Jadeja", 9), ("Hardik Pandya", 0)]
        for name, runs in india_scores:
            p = next(pl for pl in india_players if pl.full_name == name)
            db.session.add(PlayerMatchStats(match_id=match.id, innings_id=inn1.id, player_id=p.id,
                                             runs_scored=runs, balls_faced=max(runs, 10), how_out="caught"))

        aus_scores = [("Travis Head", 137), ("David Warner", 7), ("Marnus Labuschagne", 58), ("Steve Smith", 4)]
        for name, runs in aus_scores:
            p = next(pl for pl in australia_players if pl.full_name == name)
            db.session.add(PlayerMatchStats(match_id=match.id, innings_id=inn2.id, player_id=p.id,
                                             runs_scored=runs, balls_faced=max(runs, 10), how_out=None))

        db.session.commit()
        print("Seeded 1 match (2023 ODI World Cup Final) with rosters and scorecards.")


if __name__ == "__main__":
    seed()
