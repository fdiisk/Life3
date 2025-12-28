// Shared constants across the app

// Core values - unified across morning routine and dashboard
export const CORE_VALUES = [
  'Health',
  'Family', 
  'Career',
  'Growth',
  'Joy',
] as const

export type CoreValue = typeof CORE_VALUES[number]

// Default user ID for demo purposes
export const DEFAULT_USER_ID = 'user-123'
