-- STEP 1: Device Types
INSERT INTO device_types (id, name, is_active) VALUES 
('2c20478c-fcc2-44a1-a3a0-9b61e60f4481', 'Apple Watch', true),
('b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b', 'Console', true),
('7c151c62-6ff0-47c7-a619-23323067b1e6', 'Desktop', true),
('dfd146f2-08af-40fe-bd5b-6b0c851a6f76', 'Laptop', true),
('b8e7d07b-1502-439e-9166-222bb3e0376b', 'PC fisso', true),
('c8aab45b-4c23-47f1-835c-5c9afc46799d', 'Smartphone', true),
('7b4db345-71b3-4332-8223-57c1f5df76f0', 'Smartwatch', true),
('34ee92ca-5ef6-44c8-a3ef-47c8083df0f6', 'TV', true),
('101c2d6d-eb55-42f5-96d7-cb059d926ca4', 'Tablet', true),
('f0ed735c-0a76-492e-8282-82712a8d54a6', 'iPad', true),
('e3ab9898-14e0-4d03-9730-f011498b6932', 'iPhone', true)
ON CONFLICT (id) DO NOTHING;
