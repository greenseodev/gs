-- Run this file with: psql postgres -f setup-db.sql

-- Grant permissions to textlink_user
GRANT ALL ON SCHEMA public TO textlink_user;
GRANT ALL ON DATABASE textlink_manager TO textlink_user;
ALTER DATABASE textlink_manager OWNER TO textlink_user;

-- Connect to textlink_manager database
\c textlink_manager

-- Grant all privileges on all tables (for future tables)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO textlink_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO textlink_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO textlink_user;

\echo 'Database permissions setup completed!'
