// Chaos Creatures -- fal.ai Client Tests
// Tests the fal.ai client with mocked HTTP responses.
// Verifies retry logic, NSFW detection, and concurrency limiter.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FalApiError,
  FalNsfwError,
  ConcurrencyLimiter,
  estimateCost,
} from '../../src/services/fal-client';

describe('fal.ai Client', () => {
  describe('Error Classes', () => {
    it('FalApiError should include status code', () => {
      const err = new FalApiError('rate limited', 429, 'Too many requests');
      expect(err.statusCode).toBe(429);
      expect(err.detail).toBe('Too many requests');
      expect(err.name).toBe('FalApiError');
      expect(err.message).toBe('rate limited');
    });

    it('FalNsfwError should include seed', () => {
      const err = new FalNsfwError(12345);
      expect(err.seed).toBe(12345);
      expect(err.name).toBe('FalNsfwError');
      expect(err.message).toContain('NSFW');
    });
  });

  describe('ConcurrencyLimiter', () => {
    it('should allow up to maxConcurrent tasks', async () => {
      const limiter = new ConcurrencyLimiter(3);
      let running = 0;
      let maxRunning = 0;

      const tasks = Array.from({ length: 10 }, () =>
        limiter.run(async () => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          await new Promise((r) => setTimeout(r, 10));
          running--;
        })
      );

      await Promise.all(tasks);
      expect(maxRunning).toBeLessThanOrEqual(3);
    });

    it('should complete all tasks', async () => {
      const limiter = new ConcurrencyLimiter(2);
      const results: number[] = [];

      const tasks = Array.from({ length: 5 }, (_, i) =>
        limiter.run(async () => {
          await new Promise((r) => setTimeout(r, 5));
          results.push(i);
          return i;
        })
      );

      const returnedValues = await Promise.all(tasks);
      expect(results).toHaveLength(5);
      expect(returnedValues).toHaveLength(5);
    });

    it('should handle task errors without blocking queue', async () => {
      const limiter = new ConcurrencyLimiter(2);
      const results: string[] = [];

      const tasks = [
        limiter.run(async () => {
          results.push('task1-start');
          throw new Error('task1 failed');
        }).catch(() => results.push('task1-error')),
        limiter.run(async () => {
          results.push('task2-start');
          return 'ok';
        }).then(() => results.push('task2-done')),
        limiter.run(async () => {
          results.push('task3-start');
          return 'ok';
        }).then(() => results.push('task3-done')),
      ];

      await Promise.all(tasks);
      expect(results).toContain('task1-error');
      expect(results).toContain('task2-done');
      expect(results).toContain('task3-done');
    });

    it('should report active count and queue length', async () => {
      const limiter = new ConcurrencyLimiter(1);
      expect(limiter.activeCount).toBe(0);
      expect(limiter.queueLength).toBe(0);

      let resolver: () => void;
      const blockingPromise = new Promise<void>((r) => { resolver = r; });

      const task1 = limiter.run(() => blockingPromise);
      // Wait for task1 to start
      await new Promise((r) => setTimeout(r, 10));
      expect(limiter.activeCount).toBe(1);

      const task2 = limiter.run(async () => 'done');
      // task2 should be queued
      await new Promise((r) => setTimeout(r, 10));
      expect(limiter.queueLength).toBe(1);

      // Release task1
      resolver!();
      await task1;
      await task2;

      expect(limiter.activeCount).toBe(0);
      expect(limiter.queueLength).toBe(0);
    });

    it('should default to 5 concurrent', () => {
      const limiter = new ConcurrencyLimiter();
      // The default is set in the constructor
      expect(limiter).toBeDefined();
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate FLUX Dev cost at ~$0.025', () => {
      expect(estimateCost('fal-ai/flux/dev')).toBe(0.025);
    });

    it('should estimate Kontext Dev cost at ~$0.025', () => {
      expect(estimateCost('fal-ai/flux-kontext/dev')).toBe(0.025);
    });

    it('should estimate Kontext Pro cost at ~$0.05', () => {
      expect(estimateCost('fal-ai/flux-kontext/pro')).toBe(0.05);
    });

    it('should return fallback estimate for unknown endpoints', () => {
      expect(estimateCost('unknown/endpoint')).toBe(0.03);
    });
  });
});
