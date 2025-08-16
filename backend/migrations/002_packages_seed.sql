INSERT INTO packages (name, price_cents, features, is_default) VALUES
('Starter', 990, JSON_OBJECT('sites', 1, 'bandwidth', '10GB'), 1),
('Business', 2990, JSON_OBJECT('sites', 3, 'bandwidth', '100GB'), 0),
('Pro', 5990, JSON_OBJECT('sites', 10, 'bandwidth', '1TB'), 0);
