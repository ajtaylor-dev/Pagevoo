ALTER TABLE users
  ADD COLUMN totp_secret VARCHAR(255) NULL AFTER login_count;