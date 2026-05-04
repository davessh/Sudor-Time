import { apiRequest } from "./client";

export function getResultsByEvent(eventId) {
  return apiRequest(`/events/${eventId}/results`);
}