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

// Help with a request description: questions about missing details and clearer wording
export interface AiDescriptionHelp {
  // false = no help (see note)
  aiUsed: boolean;
  // Why there is no help, or a short remark (for example why no rewrite is offered)
  note: string;
  // Up to 3 short questions about details that are still missing (may be empty)
  missingDetails: string[];
  // A clearer version of the user's own text. Empty = nothing to offer.
  improvedDescription: string;
}

// A few safe things to try before submitting a request
export interface AiQuickTips {
  // true = the AI ran (the list may still be empty: nothing simple to try)
  aiUsed: boolean;
  // true = the description looks like a security matter, so no tips are given
  securityConcern: boolean;
  // A short remark: why there are no tips, or the security advice (empty otherwise)
  note: string;
  // 2 to 4 short, safe steps (empty when there is nothing simple to try)
  tips: string[];
}

// A short summary of one request (Admin and Technician)
export interface AiRequestSummary {
  // false = no summary (see note)
  aiUsed: boolean;
  // Why there is no summary (empty when there is one)
  note: string;
  // What the request is about and where it stands now
  overview: string;
  // What is stopping progress ("None" when nothing is)
  blockers: string;
  // The most useful next action
  nextStep: string;
  // true when this is a saved summary (nothing changed since it was made)
  cached: boolean;
  generatedAtUtc: string | null;
}

// What a drafted reply is for
export type ReplyDraftIntent = 'progress' | 'info' | 'resolved';

// A draft comment for the person to edit and post (Admin and Technician)
export interface AiReplyDraft {
  // false = no draft (see note)
  aiUsed: boolean;
  // Why there is no draft (empty when there is one)
  note: string;
  // Plain text, may have line breaks
  draft: string;
}