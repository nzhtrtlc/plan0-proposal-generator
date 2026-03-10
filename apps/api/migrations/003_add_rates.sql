-- Step 1: Insert new staff (name only, surname blank) that don't already exist
INSERT INTO proposal_generator.staff (name, surname) VALUES
  ('Adrian',''), ('John',''), ('Kelly',''), ('Raef',''),
  ('Alessia',''), ('Claire',''), ('Petre',''), ('Yahya',''),
  ('Gerard',''), ('Bridget',''), ('Jacky',''), ('Harman',''),
  ('Stephanie',''), ('Parham',''), ('Harsh',''), ('Kellie',''),
  ('Davog',''), ('Matthea',''), ('Kian',''), ('Ryan',''),
  ('Alex',''), ('Austin',''), ('Hanieh',''), ('Conor',''),
  ('Brianna',''), ('Cesar',''), ('Sogand',''), ('Garrett',''),
  ('Lucien',''), ('Mihir',''), ('Joy',''), ('Alyssa',''), ('Kyle','')
ON CONFLICT DO NOTHING;

-- Step 2: Create rates table
CREATE TABLE IF NOT EXISTS proposal_generator.rates (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES proposal_generator.staff(id) ON DELETE CASCADE,
  hourly_rate NUMERIC(10,2) NOT NULL,
  UNIQUE(staff_id)
);

-- Step 3: Insert all rates (matched by first name, case-insensitive)
INSERT INTO proposal_generator.rates (staff_id, hourly_rate)
SELECT s.id, v.rate
FROM (VALUES
  ('Niall',595),('Ken',575),('Ciaran',395),('Brenda',395),
  ('Alisha',395),('Emma',350),('Yalda',350),('Adrian',350),
  ('Trevor',330),('Mark',320),('John',275),('Kelly',275),
  ('Raef',275),('Alessia',275),('Claire',275),('Petre',255),
  ('Yahya',260),('Gerard',250),('Bridget',240),('Jacky',200),
  ('Harman',200),('Stephanie',200),('Parham',200),('Harsh',190),
  ('Kellie',190),('Davog',190),('Matthea',180),('Kian',180),
  ('Ryan',180),('Alex',180),('Austin',180),('Hanieh',175),
  ('Conor',155),('Brianna',155),('Cesar',155),('Sogand',155),
  ('Garrett',155),('Lucien',155),('Mihir',155),('Joy',155),
  ('Alyssa',150),('Kyle',150)
) AS v(name, rate)
JOIN proposal_generator.staff s ON LOWER(s.name) = LOWER(v.name)
ON CONFLICT (staff_id) DO UPDATE SET hourly_rate = EXCLUDED.hourly_rate;
