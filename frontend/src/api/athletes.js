import { createParticipant } from './participants'

// Alias temporal para no romper imports viejos.
export function createAthlete(payload) {
  return createParticipant(payload)
}
