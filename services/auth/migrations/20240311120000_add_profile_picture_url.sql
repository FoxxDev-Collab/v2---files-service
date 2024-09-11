-- In each migration file (e.g., 20240311120000_add_profile_picture_url.sql)
SET search_path TO newcloud_schema, public;

-- Your existing migration SQL follows...
ALTER TABLE users
ADD COLUMN profile_picture_url VARCHAR(255);

UPDATE users SET profile_picture_url = '/default-avatar.png' WHERE profile_picture_url IS NULL;