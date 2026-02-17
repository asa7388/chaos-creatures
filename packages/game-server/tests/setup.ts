// Chaos Creatures Game Server — Test Setup
// TODO: Implement test configuration in Wave 1
// This file configures the Vitest test environment.

// Set test environment variables
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GAME_SERVER_PORT = '3099';
process.env.GAME_SERVER_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
