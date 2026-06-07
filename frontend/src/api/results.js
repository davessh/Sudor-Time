import { apiRequest } from "./client";

export function getResultsByEvent(eventId) {
  return apiRequest(`/results/event/${eventId}`).then((data) => data.resultados || data);
}
