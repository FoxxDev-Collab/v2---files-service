ALTER TABLE users
ADD COLUMN profile_picture_url VARCHAR(255);
UPDATE users SET profile_picture_url = '/default-avatar.png' WHERE profile_picture_url IS NULL;
