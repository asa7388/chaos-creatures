-- 00014_chaos_energy_rpc.sql
-- Atomically increment chaos_energy on card instances after matches.
-- Called by game server: winner gets +2, loser gets +1.

CREATE OR REPLACE FUNCTION increment_chaos_energy(
  instance_ids UUID[],
  amount INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE card_instances
  SET chaos_energy = chaos_energy + amount
  WHERE id = ANY(instance_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
