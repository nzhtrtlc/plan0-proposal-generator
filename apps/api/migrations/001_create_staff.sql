CREATE TABLE IF NOT EXISTS proposal_generator.staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL
);

INSERT INTO proposal_generator.staff (name, surname) VALUES
  ('NIALL', 'FINNEGAN'),
  ('KEN', 'MARSHALL'),
  ('CIARAN', 'BRADY'),
  ('ALISHA', 'GUNNESS'),
  ('BRENDA', 'MURPHY'),
  ('MARK', 'SMITH'),
  ('EMMA', 'HICKEY'),
  ('TREVOR', 'BASS'),
  ('YALDA', 'RANJBARAN');
