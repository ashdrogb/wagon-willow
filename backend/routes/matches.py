from flask import jsonify

from models import Match, Innings, PlayerMatchStats
from . import api_bp


@api_bp.route("/matches", methods=["GET"])
def list_matches():
    matches = Match.query.order_by(Match.match_date.desc()).all()
    return jsonify([m.to_dict() for m in matches])


@api_bp.route("/match/<int:match_id>/scorecard", methods=["GET"])
def match_scorecard(match_id):
    match = Match.query.get_or_404(match_id)
    innings_list = Innings.query.filter_by(match_id=match_id).order_by(Innings.innings_number).all()
    result = []
    for inn in innings_list:
        stats = PlayerMatchStats.query.filter_by(innings_id=inn.id).all()
        result.append({"innings": inn.to_dict(), "player_stats": [s.to_dict() for s in stats]})
    return jsonify({"match": match.to_dict(), "innings": result})
