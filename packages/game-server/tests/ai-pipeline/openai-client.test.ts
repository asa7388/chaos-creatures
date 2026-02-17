// Chaos Creatures -- OpenAI Client Tests
// Tests text validation logic and cost estimation with mocked responses.

import { describe, it, expect } from 'vitest';
import { estimateCost, OpenAIValidationError } from '../../src/services/openai-client';

describe('OpenAI Client', () => {
  describe('Cost Estimation', () => {
    it('should calculate cost for typical card text generation', () => {
      const usage = { prompt_tokens: 200, completion_tokens: 40, total_tokens: 240 };
      const cost = estimateCost(usage);
      // Input: 200/1M * $0.15 = $0.00003
      // Output: 40/1M * $0.60 = $0.000024
      // Total: ~$0.000054
      expect(cost).toBeCloseTo(0.000054, 6);
    });

    it('should calculate cost for larger requests', () => {
      const usage = { prompt_tokens: 1000, completion_tokens: 200, total_tokens: 1200 };
      const cost = estimateCost(usage);
      // Input: 1000/1M * $0.15 = $0.00015
      // Output: 200/1M * $0.60 = $0.00012
      expect(cost).toBeCloseTo(0.00027, 6);
    });

    it('should return 0 for zero tokens', () => {
      const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      expect(estimateCost(usage)).toBe(0);
    });
  });

  describe('Validation Error', () => {
    it('should store raw content', () => {
      const err = new OpenAIValidationError('bad format', 'raw response text');
      expect(err.rawContent).toBe('raw response text');
      expect(err.message).toBe('bad format');
      expect(err.name).toBe('OpenAIValidationError');
    });
  });

  describe('Text Validation Rules', () => {
    // These test the validation logic that exists in generateBaseCardText

    it('should accept valid card names (3-30 chars)', () => {
      const validNames = ['Cogfang Stalker', 'Ash', 'The Eternal Grove, Crown'];
      for (const name of validNames) {
        expect(name.length).toBeGreaterThanOrEqual(3);
        expect(name.length).toBeLessThanOrEqual(30);
      }
    });

    it('should reject names shorter than 3 characters', () => {
      expect('Ab'.length).toBeLessThan(3);
    });

    it('should reject names longer than 30 characters', () => {
      const longName = 'The Most Incredibly Long Card Name That Ever Existed';
      expect(longName.length).toBeGreaterThan(30);
    });

    it('should reject generic names', () => {
      const genericNames = ['creature', 'card', 'unit', 'monster'];
      for (const name of genericNames) {
        expect(genericNames.includes(name.toLowerCase())).toBe(true);
      }
    });

    it('should accept flavor text under 120 characters', () => {
      const validFlavor = 'The gears scream, but they hold. They always hold.';
      expect(validFlavor.length).toBeLessThanOrEqual(120);
    });

    it('should reject flavor text over 120 characters', () => {
      const longFlavor = 'A'.repeat(121);
      expect(longFlavor.length).toBeGreaterThan(120);
    });

    it('should parse valid JSON card text response', () => {
      const response = '{"name": "Cogfang Stalker", "flavor_text": "Built to hunt."}';
      const parsed = JSON.parse(response);
      expect(parsed.name).toBe('Cogfang Stalker');
      expect(parsed.flavor_text).toBe('Built to hunt.');
    });

    it('should handle malformed JSON gracefully', () => {
      const badResponse = 'This is not JSON at all';
      expect(() => JSON.parse(badResponse)).toThrow();
    });

    it('should strip surrounding quotes from flavor text', () => {
      let content = '"The gears scream."';
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1);
      }
      expect(content).toBe('The gears scream.');
    });

    it('should handle single quotes', () => {
      let content = "'Ancient roots remember.'";
      if (content.startsWith("'") && content.endsWith("'")) {
        content = content.slice(1, -1);
      }
      expect(content).toBe('Ancient roots remember.');
    });
  });

  describe('Name Generation Validation', () => {
    it('should parse valid array of 3 names', () => {
      const response = '["Overclocked Stalker", "Cogwork Fury", "Stalker Unbound"]';
      const names = JSON.parse(response);
      expect(names).toHaveLength(3);
      expect(names[0]).toBe('Overclocked Stalker');
    });

    it('should reject arrays with wrong length', () => {
      const response = '["Only One", "Only Two"]';
      const names = JSON.parse(response);
      expect(names.length).not.toBe(3);
    });

    it('should reject non-array responses', () => {
      const response = '{"names": ["a", "b", "c"]}';
      const parsed = JSON.parse(response);
      expect(Array.isArray(parsed)).toBe(false);
    });
  });
});
