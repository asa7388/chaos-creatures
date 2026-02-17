// Chaos Creatures Game Server — Test Setup
// Configures the Vitest test environment with mock env vars.

// Set test environment variables
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GAME_SERVER_PORT = '3099';
process.env.GAME_SERVER_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// AI pipeline env vars
process.env.FAL_KEY = 'test-fal-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// R2 env vars
process.env.R2_ACCOUNT_ID = 'test-account-id';
process.env.R2_ACCESS_KEY_ID = 'test-access-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.R2_BUCKET_NAME = 'chaos-creatures-art';
process.env.R2_PUBLIC_URL = 'https://art.chaoscreatures.com';
