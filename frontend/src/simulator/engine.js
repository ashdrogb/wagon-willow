// Probabilistic match simulation engine. Pure functions/data — no DOM
// dependencies — so it's usable from any React component and independently
// unit-testable.

export const CONFIG = {
  battingBase: 50, roleBonusBatsman: 15, roleBonusWK: 12, roleBonusAllrounderBat: 5,
  roleBonusBowlerBat: -18, experienceWeightBat: 22, agePeakBat: 28, agePenaltyBat: 0.55,
  pitchFlatBatBonus: 6, pitchGreenBatPenalty: -5, formVarianceBat: 6,

  bowlingBase: 50, roleBonusBowler: 16, roleBonusAllrounderBowl: 6, roleBonusBatsmanBowl: -20,
  roleBonusWKBowl: -30, experienceWeightBowl: 20, agePeakPace: 26, agePeakSpin: 29,
  agePenaltyBowl: 0.5, pitchGreenPaceBonus: 10, pitchFlatPacePenalty: -5,
  pitchTurnerSpinBonus: 10, pitchGreenSpinPenalty: -6, mediumFlatBonus: 2,
  noneBowlerPenalty: -25, formVarianceBowl: 5,

  aggressionT20: 1.35, aggressionODI: 1.0, aggressionTest: 0.55,
  phasePowerplayMult: 1.2, phaseDeathMult: 1.5,
  wicketBaseT20: 2.9, wicketBaseODI: 2.6, wicketBaseTest: 3.2, wicketMatchupSensitivity: 0.045,

  testMatchOvers: 450, testInningsOversCap: 130, followOnMargin: 200,
};

export const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));

export const GROUNDS = [
  { name: "Lord's, London", pitch: "balanced" },
  { name: "MCG, Melbourne", pitch: "flat" },
  { name: "Eden Gardens, Kolkata", pitch: "dry_turner" },
  { name: "The Wanderers, Johannesburg", pitch: "green" },
  { name: "Sydney Cricket Ground", pitch: "dry_turner" },
  { name: "Kensington Oval, Barbados", pitch: "balanced" },
  { name: "Chepauk, Chennai", pitch: "dry_turner" },
  { name: "Basin Reserve, Wellington", pitch: "green" },
  { name: "Gaddafi Stadium, Lahore", pitch: "flat" },
  { name: "Kennington Oval, London", pitch: "balanced" },
];

export const WEATHER_OPTIONS = [
  { name: "Clear / Sunny", paceBonus: 0, spinBonus: 0, battingBonus: 3 },
  { name: "Overcast", paceBonus: 8, spinBonus: -3, battingBonus: -3 },
  { name: "Humid", paceBonus: 5, spinBonus: -2, battingBonus: -2 },
  { name: "Windy", paceBonus: 2, spinBonus: -2, battingBonus: -1 },
  { name: "Evening Dew", paceBonus: -3, spinBonus: -5, battingBonus: 5 },
];

export const FORMATS = {
  T20: { overs: 20, label: "T20" },
  ODI: { overs: 50, label: "ODI" },
  TEST: { overs: 90, label: "Test" },
};

export const ROLES = ["Batsman", "All-rounder", "Bowler", "WK-Batsman"];
export const HANDS = ["Right-hand", "Left-hand"];
export const BOWL_TYPES = ["None", "Pace", "Medium", "Spin"];

export const ZONES = [
  { id: 1, label: "Fine Leg", center: 20 }, { id: 2, label: "Square Leg", center: 65 },
  { id: 3, label: "Mid Wicket", center: 110 }, { id: 4, label: "Mid On", center: 155 },
  { id: 5, label: "Mid Off", center: 205 }, { id: 6, label: "Cover", center: 250 },
  { id: 7, label: "Point", center: 295 }, { id: 8, label: "Third Man", center: 340 },
];

const LINE_X = { wide_leg: 0.1, leg: 0.3, middle: 0.5, off: 0.7, wide_off: 0.9 };
const LENGTH_Y = { bouncer: 0.1, short: 0.25, good: 0.5, full: 0.75, yorker: 0.95 };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function weightedPick(weightMap) {
  const entries = Object.entries(weightMap);
  const total = entries.reduce((s, [, w]) => s + Math.max(w, 0), 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= Math.max(w, 0);
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

export function battingSkill(player, ctx) {
  let s = CONFIG.battingBase;
  const roleBonus = { Batsman: CONFIG.roleBonusBatsman, "WK-Batsman": CONFIG.roleBonusWK,
    "All-rounder": CONFIG.roleBonusAllrounderBat, Bowler: CONFIG.roleBonusBowlerBat };
  s += roleBonus[player.role] ?? 0;
  const caps = clamp(Number(player.experience) || 0, 0, 200);
  s += (caps / 200) * CONFIG.experienceWeightBat;
  const age = clamp(Number(player.age) || 27, 15, 45);
  s -= Math.abs(age - CONFIG.agePeakBat) * CONFIG.agePenaltyBat;
  s += ctx.weather.battingBonus;
  if (ctx.ground.pitch === "flat") s += CONFIG.pitchFlatBatBonus;
  if (ctx.ground.pitch === "green") s += CONFIG.pitchGreenBatPenalty;
  if (ctx.ground.pitch === "dry_turner" && ctx.phase !== "powerplay") s -= 2;
  s += rand(-CONFIG.formVarianceBat, CONFIG.formVarianceBat);
  return clamp(s, 5, 96);
}

export function bowlingSkill(player, ctx) {
  let s = CONFIG.bowlingBase;
  const roleBonus = { Bowler: CONFIG.roleBonusBowler, "All-rounder": CONFIG.roleBonusAllrounderBowl,
    Batsman: CONFIG.roleBonusBatsmanBowl, "WK-Batsman": CONFIG.roleBonusWKBowl };
  s += roleBonus[player.role] ?? 0;
  const caps = clamp(Number(player.experience) || 0, 0, 200);
  s += (caps / 200) * CONFIG.experienceWeightBowl;
  const age = clamp(Number(player.age) || 27, 15, 45);
  const peak = player.bowlingType === "Spin" ? CONFIG.agePeakSpin : CONFIG.agePeakPace;
  s -= Math.abs(age - peak) * CONFIG.agePenaltyBowl;
  if (player.bowlingType === "Pace") {
    s += ctx.weather.paceBonus;
    if (ctx.ground.pitch === "green") s += CONFIG.pitchGreenPaceBonus;
    if (ctx.ground.pitch === "flat") s += CONFIG.pitchFlatPacePenalty;
  } else if (player.bowlingType === "Spin") {
    s += ctx.weather.spinBonus;
    if (ctx.ground.pitch === "dry_turner") s += CONFIG.pitchTurnerSpinBonus;
    if (ctx.ground.pitch === "green") s += CONFIG.pitchGreenSpinPenalty;
    if (ctx.format === "TEST" && ctx.overNumber > 60) s += 6;
  } else if (player.bowlingType === "Medium") {
    s += CONFIG.mediumFlatBonus;
  } else {
    s += CONFIG.noneBowlerPenalty;
  }
  s += rand(-CONFIG.formVarianceBowl, CONFIG.formVarianceBowl);
  return clamp(s, 5, 96);
}

function phaseFor(format, overNumber, totalOvers) {
  if (format === "T20") {
    if (overNumber < 6) return "powerplay";
    if (overNumber >= totalOvers - 4) return "death";
    return "middle";
  }
  if (format === "ODI") {
    if (overNumber < 10) return "powerplay";
    if (overNumber >= totalOvers - 10) return "death";
    return "middle";
  }
  return "middle";
}

function ballOutcomeWeights(matchup, format, phase, requiredRunRateRatio) {
  const m = clamp(matchup, -60, 60);
  const aggression = format === "T20" ? CONFIG.aggressionT20 : format === "ODI" ? CONFIG.aggressionODI : CONFIG.aggressionTest;
  const phaseAgg = phase === "powerplay" ? CONFIG.phasePowerplayMult : phase === "death" ? CONFIG.phaseDeathMult : 1.0;
  const chaseAgg = clamp(requiredRunRateRatio || 1, 0.7, 1.8);
  const agg = aggression * phaseAgg * chaseAgg;
  const wicketBase = format === "TEST" ? CONFIG.wicketBaseTest : format === "ODI" ? CONFIG.wicketBaseODI : CONFIG.wicketBaseT20;
  const wicketChance = clamp(wicketBase - m * CONFIG.wicketMatchupSensitivity, 0.6, 9);
  return {
    0: clamp(38 - m * 0.25 - (agg - 1) * 14, 8, 60),
    1: clamp(30 - (agg - 1) * 6, 10, 40),
    2: clamp(9 + m * 0.03, 3, 16),
    3: clamp(2, 1, 4),
    4: clamp((8 + m * 0.22) * agg * 0.6, 2, 26),
    6: clamp((2.5 + m * 0.16) * agg * 0.7, 0.5, 18),
    W: wicketChance,
  };
}

function wicketType(bowlingType) {
  const tables = {
    Pace: { bowled: 30, caught: 40, lbw: 20, run_out: 10 },
    Spin: { stumped: 20, caught: 45, bowled: 15, lbw: 15, run_out: 5 },
    Medium: { caught: 45, bowled: 25, lbw: 15, run_out: 15 },
    None: { caught: 50, run_out: 50 },
  };
  return weightedPick(tables[bowlingType] || tables.Medium);
}

function generateShot(runs, battingHand) {
  let zonePool = ZONES;
  if (runs >= 4) zonePool = ZONES.filter((z) => [3, 4, 5, 6, 2].includes(z.id));
  else if (runs === 0) return null;
  const zone = choice(zonePool);
  let angle = zone.center + rand(-18, 18);
  if (battingHand === "Left-hand") angle = (360 - angle) % 360;
  if (angle < 0) angle += 360;
  const distance = runs >= 6 ? rand(0.88, 1.0) : runs === 4 ? rand(0.7, 0.95) : runs >= 2 ? rand(0.45, 0.7) : rand(0.15, 0.4);
  return { angle: Math.round(angle * 10) / 10, distance: Math.round(distance * 100) / 100, runs };
}

function generateDelivery(bowlingType) {
  const lengthWeights = {
    Pace: { yorker: 10, full: 20, good: 35, short: 20, bouncer: 15 },
    Medium: { yorker: 5, full: 25, good: 40, short: 20, bouncer: 10 },
    Spin: { yorker: 2, full: 30, good: 45, short: 18, bouncer: 5 },
    None: { yorker: 5, full: 25, good: 40, short: 20, bouncer: 10 },
  }[bowlingType] || { yorker: 5, full: 25, good: 40, short: 20, bouncer: 10 };
  const lineWeights = {
    Pace: { wide_leg: 5, leg: 15, middle: 25, off: 40, wide_off: 15 },
    Medium: { wide_leg: 6, leg: 18, middle: 28, off: 34, wide_off: 14 },
    Spin: { wide_leg: 5, leg: 20, middle: 30, off: 35, wide_off: 10 },
    None: { wide_leg: 6, leg: 18, middle: 28, off: 34, wide_off: 14 },
  }[bowlingType] || { wide_leg: 6, leg: 18, middle: 28, off: 34, wide_off: 14 };
  const length = weightedPick(lengthWeights);
  const line = weightedPick(lineWeights);
  const x = clamp(LINE_X[line] + rand(-0.05, 0.05), 0, 1);
  const y = clamp(LENGTH_Y[length] + rand(-0.05, 0.05), 0, 1);
  return { line, length, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

function pickBowler(bowlers, lastBowlerIdx) {
  let idx, tries = 0;
  do { idx = Math.floor(Math.random() * bowlers.length); tries++; }
  while (idx === lastBowlerIdx && bowlers.length > 1 && tries < 10);
  return idx;
}

export function simulateInnings(battingXI, bowlingXI, ctx, target, oversLimitOverride) {
  const totalOvers = oversLimitOverride != null ? Math.max(1, Math.floor(oversLimitOverride)) : FORMATS[ctx.format].overs;
  const bowlers = bowlingXI.filter((p) => p.bowlingType !== "None");
  const usableBowlers = bowlers.length >= 5 ? bowlers : bowlingXI;

  let score = 0, wickets = 0, ballsBowled = 0;
  let strikerIdx = 0, nonStrikerIdx = 1;
  const dismissed = new Set();
  const battingCard = battingXI.map((p) => ({ name: p.name, runs: 0, balls: 0, fours: 0, sixes: 0, out: null, hand: p.battingHand }));
  const bowlingCard = usableBowlers.map((p) => ({ name: p.name, type: p.bowlingType, ballsBowled: 0, runsConceded: 0, wickets: 0 }));
  const wagonWheel = [];
  const pitchMap = [];
  let lastBowlerIdx = -1, overNumber = 0;

  outer:
  for (overNumber = 0; overNumber < totalOvers; overNumber++) {
    if (wickets >= 10) break;
    const bowlerIdx = pickBowler(usableBowlers, lastBowlerIdx);
    lastBowlerIdx = bowlerIdx;
    const bowlerPlayer = usableBowlers[bowlerIdx];
    const bCard = bowlingCard[bowlerIdx];

    for (let ballInOver = 0; ballInOver < 6; ballInOver++) {
      if (wickets >= 10) break outer;
      const strikerPlayer = battingXI[strikerIdx];
      const phase = phaseFor(ctx.format, overNumber, totalOvers);

      let requiredRunRateRatio = 1;
      if (target) {
        const ballsLeft = (totalOvers - overNumber) * 6 - ballInOver;
        const runsNeeded = target - score;
        const reqRate = ballsLeft > 0 ? (runsNeeded / ballsLeft) * 6 : 99;
        const curRate = ballsBowled > 0 ? (score / ballsBowled) * 6 : reqRate;
        requiredRunRateRatio = curRate > 0 ? clamp(reqRate / curRate, 0.6, 1.8) : 1;
      }

      const runCtx = { ...ctx, overNumber, phase };
      const batSkill = battingSkill(strikerPlayer, runCtx);
      const bowlSkill = bowlingSkill(bowlerPlayer, runCtx);
      const matchup = batSkill - bowlSkill;
      const weights = ballOutcomeWeights(matchup, ctx.format, phase, requiredRunRateRatio);
      const outcome = weightedPick(weights);

      ballsBowled++;
      bCard.ballsBowled++;
      battingCard[strikerIdx].balls++;
      const delivery = generateDelivery(bowlerPlayer.bowlingType);

      if (outcome === "W") {
        const wType = wicketType(bowlerPlayer.bowlingType);
        wickets++;
        battingCard[strikerIdx].out = wType.replace("_", " ");
        dismissed.add(strikerIdx);
        if (wType !== "run_out") bCard.wickets++;
        pitchMap.push({ bowler: bowlerPlayer.name, runsConceded: 0, isWicket: true, phase, ...delivery });
        const nextIdx = battingXI.findIndex((_, i) => !dismissed.has(i) && i !== strikerIdx && i !== nonStrikerIdx);
        if (nextIdx === -1) { wickets = 10; break outer; }
        strikerIdx = nextIdx;
      } else {
        const runs = Number(outcome);
        score += runs;
        bCard.runsConceded += runs;
        battingCard[strikerIdx].runs += runs;
        if (runs === 4) battingCard[strikerIdx].fours++;
        if (runs === 6) battingCard[strikerIdx].sixes++;
        pitchMap.push({ bowler: bowlerPlayer.name, runsConceded: runs, isWicket: false, phase, ...delivery });
        const shot = generateShot(runs, strikerPlayer.battingHand);
        if (shot) wagonWheel.push({ batsman: strikerPlayer.name, phase, ...shot });
        if (runs % 2 === 1) { const t = strikerIdx; strikerIdx = nonStrikerIdx; nonStrikerIdx = t; }
      }
      if (target && score >= target) break outer;
    }
    const t = strikerIdx; strikerIdx = nonStrikerIdx; nonStrikerIdx = t;
  }

  const oversText = Math.floor(ballsBowled / 6) + "." + (ballsBowled % 6);
  const allOut = wickets >= 10;
  const complete = allOut || (target && score >= target) || overNumber >= totalOvers;

  return {
    score, wickets, oversText, ballsBowled,
    battingCard, bowlingCard: bowlingCard.filter((b) => b.ballsBowled > 0),
    wagonWheel, pitchMap, allOut, complete,
  };
}

export function simulateTestMatch(teamA, teamB, ctx, teamAFirst) {
  const totalBudget = CONFIG.testMatchOvers;
  const perInningsCap = CONFIG.testInningsOversCap;
  const followOnMargin = CONFIG.followOnMargin;
  let budget = totalBudget;
  let drawn = false;

  const first = teamAFirst ? teamA : teamB;
  const second = teamAFirst ? teamB : teamA;
  const firstLabel = teamAFirst ? "Team A" : "Team B";
  const secondLabel = teamAFirst ? "Team B" : "Team A";
  const inningsList = [];

  function playInnings(battingXI, bowlingXI, battingLabel, bowlingLabel, target, inningsOf) {
    if (drawn || budget <= 0.17) { drawn = true; return null; }
    const cap = Math.min(perInningsCap, budget);
    const result = simulateInnings(battingXI, bowlingXI, ctx, target, cap);
    budget -= result.ballsBowled / 6;
    inningsList.push({ label: battingLabel + " — " + inningsOf, bowlingLabel, result, target: target || null });
    if (!result.complete) drawn = true;
    return result;
  }

  const inn1 = playInnings(first, second, firstLabel, secondLabel, null, "1st Innings");
  if (drawn) return finalize(inningsList, null, "Match drawn — overs exhausted during " + firstLabel + "'s 1st innings.", "draw", false);

  const inn2 = playInnings(second, first, secondLabel, firstLabel, null, "1st Innings");
  if (drawn) return finalize(inningsList, null, "Match drawn — overs exhausted during " + secondLabel + "'s 1st innings.", "draw", false);

  const deficit = inn1.score - inn2.score;
  const enforceFollowOn = deficit >= followOnMargin && budget > 20;

  if (enforceFollowOn) {
    const inn3 = playInnings(second, first, secondLabel, firstLabel, null, "2nd Innings (follow-on)");
    if (drawn) return finalize(inningsList, null, "Match drawn — overs exhausted during the follow-on.", "draw", true);
    const combinedSecond = inn2.score + inn3.score;
    if (combinedSecond <= inn1.score) {
      return finalize(inningsList, firstLabel, "an innings and " + (inn1.score - combinedSecond) + " runs", "innings", true);
    }
    const target = combinedSecond - inn1.score + 1;
    const inn4 = playInnings(first, second, firstLabel, secondLabel, target, "2nd Innings (chasing)");
    if (drawn) return finalize(inningsList, null, "Match drawn — overs exhausted in the run chase.", "draw", true);
    if (inn4.score >= target) return finalize(inningsList, firstLabel, (10 - inn4.wickets) + " wickets", "chase", true);
    return finalize(inningsList, secondLabel, (target - 1 - inn4.score) + " runs", "defend", true);
  }

  const inn3 = playInnings(first, second, firstLabel, secondLabel, null, "2nd Innings");
  if (drawn) return finalize(inningsList, null, "Match drawn — overs exhausted during " + firstLabel + "'s 2nd innings.", "draw", false);

  const target = Math.max(1, inn1.score + inn3.score - inn2.score + 1);
  const inn4 = playInnings(second, first, secondLabel, firstLabel, target, "2nd Innings (chasing)");
  if (drawn) return finalize(inningsList, null, "Match drawn — overs exhausted in the run chase.", "draw", false);

  if (inn4.score >= target) return finalize(inningsList, secondLabel, (10 - inn4.wickets) + " wickets", "chase", false);
  return finalize(inningsList, firstLabel, (target - 1 - inn4.score) + " runs", "defend", false);
}

function finalize(inningsList, winner, margin, resultType, followOnUsed) {
  return { inningsList, winner, margin, resultType, followOnUsed };
}
