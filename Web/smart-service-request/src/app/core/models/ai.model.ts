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

// A suggested request type and priority for a description
export interface AiRequestClassification {
  // false = no suggestion (see note)
  aiUsed: boolean;
  // Why there is no suggestion (empty when there is one)
  note: string;
  // Always one of the form's own request types
  requestType: string;
  // Always Low, Medium, High or Critical
  priority: string;
  // One short sentence explaining the suggestion
  reason: string;
}