// Chaos Creatures -- Fallback Art System Tests
// Tests the SVG fallback generation for failed art generations.

import { describe, it, expect } from 'vitest';
import { generateFallbackSvg, getFallbackImageBuffer } from '../../src/services/fallback-art';

describe('Fallback Art System', () => {
  describe('generateFallbackSvg', () => {
    it('should generate valid SVG for Ironwright', () => {
      const svg = generateFallbackSvg('IRONWRIGHT', 'COMMON');
      expect(svg).toContain('<?xml');
      expect(svg).toContain('<svg');
      expect(svg).toContain('768');
      expect(svg).toContain('1024');
      expect(svg).toContain('IRONWRIGHT');
    });

    it('should generate valid SVG for Fey Courts', () => {
      const svg = generateFallbackSvg('FEY_COURTS', 'RARE');
      expect(svg).toContain('FEY COURTS');
      // Fey Courts primary color
      expect(svg).toContain('#2D5016');
    });

    it('should generate valid SVG for Demonic', () => {
      const svg = generateFallbackSvg('DEMONIC', 'EPIC');
      expect(svg).toContain('DEMONIC');
      // Demonic primary color
      expect(svg).toContain('#8B0000');
    });

    it('should throw for unknown faction', () => {
      expect(() => generateFallbackSvg('UNKNOWN', 'COMMON')).toThrow();
    });

    it('should include rarity border color', () => {
      const commonSvg = generateFallbackSvg('IRONWRIGHT', 'COMMON');
      expect(commonSvg).toContain('#808080'); // Gray

      const legendarySvg = generateFallbackSvg('IRONWRIGHT', 'LEGENDARY');
      expect(legendarySvg).toContain('#FFD700'); // Gold
    });

    it('should include card name when provided', () => {
      const svg = generateFallbackSvg('IRONWRIGHT', 'COMMON', 'Cogwork Stalker');
      expect(svg).toContain('Cogwork Stalker');
    });

    it('should escape special XML characters in card name', () => {
      const svg = generateFallbackSvg('IRONWRIGHT', 'COMMON', 'Test & <Special>');
      expect(svg).toContain('Test &amp; &lt;Special&gt;');
    });

    it('should include "Art generation pending" notice', () => {
      const svg = generateFallbackSvg('IRONWRIGHT', 'COMMON');
      expect(svg).toContain('Art generation pending');
    });

    it('should display rarity text', () => {
      const svg = generateFallbackSvg('FEY_COURTS', 'LEGENDARY');
      expect(svg).toContain('LEGENDARY');
    });

    it('should have different border widths by rarity', () => {
      const commonSvg = generateFallbackSvg('IRONWRIGHT', 'COMMON');
      const legendarySvg = generateFallbackSvg('IRONWRIGHT', 'LEGENDARY');
      // Legendary has wider border
      expect(legendarySvg).toContain('stroke-width="8"');
      expect(commonSvg).toContain('stroke-width="4"');
    });
  });

  describe('getFallbackImageBuffer', () => {
    it('should return SVG buffer and correct content type', () => {
      const { buffer, contentType } = getFallbackImageBuffer('IRONWRIGHT', 'COMMON');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(contentType).toBe('image/svg+xml');
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should return valid SVG content in buffer', () => {
      const { buffer } = getFallbackImageBuffer('FEY_COURTS', 'EPIC', 'Test Card');
      const svgString = buffer.toString('utf-8');
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('Test Card');
    });
  });
});
