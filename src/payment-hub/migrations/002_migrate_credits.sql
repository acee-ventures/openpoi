-- Payment Hub: Credits Migration 002
-- Migrates all immortalityCredits to poiCredits
--
-- This is a ONE-TIME migration. Run ONCE on production after verifying on staging.
-- Idempotent: safe to run multiple times (only moves non-zero balances).

BEGIN;

-- Step 1: Record pre-migration snapshot for audit
INSERT INTO unified_ledger (user_id, type, amount_credits, scene, source, reference, metadata)
SELECT
  user_id,
  'credit',
  immortality_credits,
  'migration',
  'migration',
  'immortality_to_poi_credits_v1',
  jsonb_build_object(
    'migratedFrom', 'immortalityCredits',
    'originalAmount', immortality_credits,
    'migrationTimestamp', NOW()
  )
FROM user_balances
WHERE immortality_credits > 0;

-- Step 2: Atomically move immortalityCredits → poiCredits
UPDATE user_balances
SET poi_credits = poi_credits + immortality_credits,
    immortality_credits = 0,
    updated_at = NOW()
WHERE immortality_credits > 0;

-- Step 3: Verification query (run manually to verify)
-- SELECT
--   COUNT(*) AS users_with_remaining_immortality,
--   SUM(immortality_credits) AS remaining_immortality_total,
--   SUM(poi_credits) AS total_poi_credits
-- FROM user_balances;

COMMIT;
