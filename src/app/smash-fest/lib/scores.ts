import { supabase } from "@/lib/supabaseClient";

/**
 * Star scores for SmashFest.
 *
 * localStorage is the source of truth so the game keeps working offline and
 * before the Supabase table exists; the remote copy is a best-effort sync used
 * to share progress between the two profiles' devices.
 *
 * The table this expects (run once in Supabase, optional):
 *
 *   create table smash_fest_scores (
 *     id          bigint generated always as identity primary key,
 *     profile     text not null,
 *     level_id    text not null,
 *     stars       smallint not null,
 *     shots_used  smallint not null,
 *     created_at  timestamptz not null default now(),
 *     unique (profile, level_id)
 *   );
 */

export type LevelScore = {
  stars: number;
  shotsUsed: number;
};

export type ScoreMap = Record<string, LevelScore>;

const STORAGE_KEY = "smash-fest-scores-v1";

/**
 * Three stars for a clean demolition, one for simply finishing. Thresholds are
 * on the fraction of the projectile budget spent, so they scale with a level's
 * own allowance instead of a fixed shot count.
 */
export function starsFor(shotsUsed: number, limit: number): number {
  if (limit <= 0) return 1;
  const spent = shotsUsed / limit;
  if (spent <= 0.45) return 3;
  if (spent <= 0.75) return 2;
  return 1;
}

export function loadLocalScores(): ScoreMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as ScoreMap) : {};
  } catch {
    return {};
  }
}

function writeLocalScores(scores: ScoreMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // Private mode / quota: scores are a nicety, never worth breaking the game.
  }
}

/** Higher star count wins; on a tie, fewer shots wins. */
function isBetter(next: LevelScore, prev: LevelScore | undefined) {
  if (!prev) return true;
  if (next.stars !== prev.stars) return next.stars > prev.stars;
  return next.shotsUsed < prev.shotsUsed;
}

/**
 * Records a run. Returns the stored best and whether this run improved on it,
 * so the UI can celebrate a new record.
 */
export function recordScore(
  levelId: string,
  score: LevelScore,
  profile: string | null
): { best: LevelScore; isRecord: boolean } {
  const scores = loadLocalScores();
  const previous = scores[levelId];
  const isRecord = isBetter(score, previous);

  if (isRecord) {
    scores[levelId] = score;
    writeLocalScores(scores);

    if (profile) {
      void supabase
        .from("smash_fest_scores")
        .upsert(
          { profile, level_id: levelId, stars: score.stars, shots_used: score.shotsUsed },
          { onConflict: "profile,level_id" }
        )
        .then(undefined, () => {
          // Table missing or offline — the local copy already holds the record.
        });
    }
  }

  return { best: isRecord ? score : previous, isRecord };
}

/**
 * Pulls remote scores and merges them into the local map, keeping whichever
 * side is better per level. Safe to call when the table doesn't exist.
 */
export async function syncScores(profile: string | null): Promise<ScoreMap> {
  const local = loadLocalScores();
  if (!profile) return local;

  try {
    const { data, error } = await supabase
      .from("smash_fest_scores")
      .select("level_id, stars, shots_used")
      .eq("profile", profile);

    if (error || !data) return local;

    const merged: ScoreMap = { ...local };
    for (const row of data as { level_id: string; stars: number; shots_used: number }[]) {
      const remote: LevelScore = { stars: row.stars, shotsUsed: row.shots_used };
      if (isBetter(remote, merged[row.level_id])) merged[row.level_id] = remote;
    }

    writeLocalScores(merged);
    return merged;
  } catch {
    return local;
  }
}
