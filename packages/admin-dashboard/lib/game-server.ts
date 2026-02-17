// Chaos Creatures Admin Dashboard — Game Server HTTP Client
// HTTP client for Railway game server API calls.
// Used by admin API routes to proxy requests to the game server.

const GAME_SERVER_URL = process.env.GAME_SERVER_URL || 'http://localhost:3001';
const GAME_SERVER_SECRET = process.env.GAME_SERVER_SECRET || '';

interface GameServerResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export async function gameServerFetch<T = unknown>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown>;
  } = {}
): Promise<GameServerResponse<T>> {
  const { method = 'GET', body } = options;

  try {
    const res = await fetch(`${GAME_SERVER_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': GAME_SERVER_SECRET,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    return { data: data as T, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: `Game server unreachable: ${message}`, status: 503 };
  }
}

// Convenience methods
export async function validateBalance() {
  return gameServerFetch('/api/admin/validate-balance', { method: 'POST' });
}

export async function startBatch(params: {
  faction_id: string;
  count: number;
  card_type: string;
  creature_type_hint?: string;
}) {
  return gameServerFetch('/api/admin/batch/start', {
    method: 'POST',
    body: params,
  });
}
