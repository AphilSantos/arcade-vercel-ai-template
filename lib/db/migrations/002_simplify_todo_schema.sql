-- Simplify todo schema by removing complex fields
-- This migration assumes the enhanced schema was never deployed to production

-- Drop columns that were added in the enhanced schema
ALTER TABLE "UserTask" 
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS dueDate,
DROP COLUMN IF EXISTS updatedAt,
DROP COLUMN IF EXISTS "order";

-- Note: If the original simple schema was already in place,
-- this migration will effectively be a no-op