import json
from flask import request, jsonify
from flask_login import login_required, current_user

from extensions import db
from models import SimulatedMatch
from . import api_bp


@api_bp.route("/simulations", methods=["POST"])
@login_required
def save_simulation():
    """Persists a completed simulator run. The frontend sends the exact
    engine output; the backend just stores it against the logged-in user —
    it doesn't re-run or verify the simulation math."""
    data = request.get_json(silent=True) or {}
    result = data.get("result")
    if not result:
        return jsonify({"error": "result payload is required"}), 400

    sim = SimulatedMatch(
        user_id=current_user.id,
        team_a_name=data.get("team_a_name"),
        team_b_name=data.get("team_b_name"),
        format=data.get("format"),
        gender=data.get("gender"),
        ground=data.get("ground"),
        winner=data.get("winner"),
        margin=data.get("margin"),
        result_json=json.dumps(result),
    )
    db.session.add(sim)
    db.session.commit()
    return jsonify(sim.to_dict(include_result=False)), 201


@api_bp.route("/simulations", methods=["GET"])
@login_required
def list_simulations():
    sims = (
        SimulatedMatch.query.filter_by(user_id=current_user.id)
        .order_by(SimulatedMatch.created_at.desc())
        .all()
    )
    return jsonify([s.to_dict(include_result=False) for s in sims])


@api_bp.route("/simulations/<int:sim_id>", methods=["GET"])
@login_required
def get_simulation(sim_id):
    sim = SimulatedMatch.query.filter_by(id=sim_id, user_id=current_user.id).first_or_404()
    return jsonify(sim.to_dict(include_result=True))


@api_bp.route("/simulations/<int:sim_id>", methods=["DELETE"])
@login_required
def delete_simulation(sim_id):
    sim = SimulatedMatch.query.filter_by(id=sim_id, user_id=current_user.id).first_or_404()
    db.session.delete(sim)
    db.session.commit()
    return jsonify({"status": "deleted"})
