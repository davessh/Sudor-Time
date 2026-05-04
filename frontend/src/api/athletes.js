import { apiRequest } from "./client";

export function createAthlete(payload) {
  return apiRequest("/athletes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}