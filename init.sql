CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'America/Boise',
    profile_picture_url VARCHAR(255),
    role_id INTEGER REFERENCES roles(id)
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('user'), ('application_admin'), ('site_admin')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO newcloud_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO newcloud_user;