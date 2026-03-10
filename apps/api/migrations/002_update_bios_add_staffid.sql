-- Step 1: Add staff_id column (nullable initially)
ALTER TABLE proposal_generator."bios"
  ADD COLUMN IF NOT EXISTS staff_id INTEGER REFERENCES proposal_generator.staff(id);

-- Step 2: Auto-match existing bios to staff by name (handles "FIRST LAST" and "LAST FIRST" order)
UPDATE proposal_generator."bios" b
SET staff_id = s.id
FROM proposal_generator.staff s
WHERE LOWER(b.name) = LOWER(s.name || ' ' || s.surname)
   OR LOWER(b.name) = LOWER(s.surname || ' ' || s.name);

-- Step 3: Check which rows still have NULL staff_id — fix these manually before dropping name
-- SELECT id, name FROM proposal_generator."bios" WHERE staff_id IS NULL;

-- Staff IDs for reference:
--   1=NIALL FINNEGAN, 2=KEN MARSHALL, 3=CIARAN BRADY, 4=ALISHA GUNNESS
--   5=BRENDA MURPHY,  6=MARK SMITH,   7=EMMA HICKEY,  8=TREVOR BASS,  9=YALDA RANJBARAN
--
-- Fix unmatched rows like this:
-- UPDATE proposal_generator."bios" SET staff_id = 3 WHERE id = <bio_id>;

-- Step 4: Once all staff_id values are set, drop the name column:
-- ALTER TABLE proposal_generator."bios" DROP COLUMN name;
