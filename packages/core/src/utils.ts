/**
 * Utility functions for @assistant/core.
 */

import { type Result } from './types.js';

/** Wraps a value in a successful Result. */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/** Wraps an error in a failed Result. */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/** Asserts a value is non-null and non-undefined. */
export function assertDefined<T>(
  value: T | null | undefined,
  label = 'value',
): T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${label} to be defined, but got ${String(value)}`);
  }
  return value;
}
