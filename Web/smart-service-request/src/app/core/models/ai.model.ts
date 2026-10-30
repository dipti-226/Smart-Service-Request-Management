export interface AiStatus {
  // true when the AI features are switched on and ready
  enabled: boolean;
}

export interface EligibleTechnician {
  technicianId: number;
  technicianName: string;
  activeRequests: number;
  maxActiveRequests: number;
  matchesSpecialization: boolean;
}

export interface AiTechnicianSuggestion {
  // false = this is the standard rule order, the AI was not used
  aiUsed: boolean;
  // Why the AI was not used (empty when it was)
  note: string;
  // The AI's short reason (empty when the AI was not used)
  reason: string;
  recommendedTechnicianId: number | null;
  // true when the AI's first choice differs from the standard rule's first choice
  aiChangedTopChoice: boolean;
  // Only technicians the server already considers eligible, in the suggested order
  technicians: EligibleTechnician[];
}