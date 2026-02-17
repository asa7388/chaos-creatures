// Chaos Creatures -- R2 Key Format Tests
// Verifies key generation follows the naming convention from the agent spec:
//   Base:      cards/{faction}/{rarity}/{card_id}_{tier}.webp
//   Evolution: cards/{faction}/{rarity}/{card_id}_{tier}_evo{n}.webp
//   Fallback:  cards/{faction}/{rarity}/{card_id}_{tier}_fallback.webp

import { describe, it, expect } from 'vitest';
import { baseCardKey, evolutionArtKey, fallbackArtKey, getPublicUrl } from '../../src/services/r2';

describe('R2 Key Generation', () => {
  describe('baseCardKey', () => {
    it('should generate correct key format', () => {
      const key = baseCardKey('IRONWRIGHT', 'COMMON', 'abc123', 'COMMON');
      expect(key).toBe('cards/ironwright/common/abc123_common.webp');
    });

    it('should lowercase faction and rarity', () => {
      const key = baseCardKey('FEY_COURTS', 'LEGENDARY', 'xyz789', 'UNCOMMON');
      expect(key).toBe('cards/fey_courts/legendary/xyz789_uncommon.webp');
    });

    it('should handle DEMONIC_KINGDOMS faction', () => {
      const key = baseCardKey('DEMONIC_KINGDOMS', 'RARE', 'def456', 'EPIC');
      expect(key).toBe('cards/demonic_kingdoms/rare/def456_epic.webp');
    });

    it('should always end with .webp', () => {
      const key = baseCardKey('IRONWRIGHT', 'COMMON', 'test', 'COMMON');
      expect(key).toMatch(/\.webp$/);
    });

    it('should start with cards/', () => {
      const key = baseCardKey('IRONWRIGHT', 'COMMON', 'test', 'COMMON');
      expect(key).toMatch(/^cards\//);
    });
  });

  describe('evolutionArtKey', () => {
    it('should include evolution number suffix', () => {
      const key = evolutionArtKey('IRONWRIGHT', 'UNCOMMON', 'abc123', 'UNCOMMON', 1);
      expect(key).toBe('cards/ironwright/uncommon/abc123_uncommon_evo1.webp');
    });

    it('should handle multi-digit evolution numbers', () => {
      const key = evolutionArtKey('FEY_COURTS', 'EPIC', 'xyz', 'EPIC', 12);
      expect(key).toBe('cards/fey_courts/epic/xyz_epic_evo12.webp');
    });
  });

  describe('fallbackArtKey', () => {
    it('should include _fallback suffix', () => {
      const key = fallbackArtKey('DEMONIC', 'COMMON', 'abc123', 'COMMON');
      expect(key).toBe('cards/demonic/common/abc123_common_fallback.webp');
    });
  });

  describe('getPublicUrl', () => {
    it('should combine public URL with key', () => {
      // This test uses the env var set in setup.ts
      const url = getPublicUrl('cards/ironwright/common/abc123_common.webp');
      expect(url).toBe('https://art.chaoscreatures.com/cards/ironwright/common/abc123_common.webp');
    });

    it('should handle trailing slash in public URL', () => {
      // The function strips trailing slashes
      const url = getPublicUrl('test/key.webp');
      expect(url).not.toContain('//test');
    });
  });
});
