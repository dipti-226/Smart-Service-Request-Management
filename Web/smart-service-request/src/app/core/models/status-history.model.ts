// One step in the life of a request (the API sends them oldest first)
export interface StatusHistoryEntry {
  historyId: number;
  requestId: number;

  // null for the first step (the request was created)
  oldStatus: string | null;
  newStatus: string;

  changedByUserId: number | null;
  changedByUsername: string | null;
  changedByRole: string | null;

  remarks: string | null;
  changedDate: string;
}