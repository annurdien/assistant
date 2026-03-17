/**
 * Shared type definitions for @assistant/core.
 */

/** Generic result type for operation outcomes. */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/** ISO 8601 date string. */
export type IsoDateString = string;

/** Branded string for IDs. */
export type Brand<T, B extends string> = T & { readonly __brand: B };
export type Id = Brand<string, 'Id'>;
