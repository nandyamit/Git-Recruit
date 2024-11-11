// Candidate.interface.tsx
export interface Candidate {
    login: string;          // GitHub username
    name: string | null;    // Full name
    avatar_url: string;     // Profile picture URL
    location: string | null;
    email: string | null;
    html_url: string;       // GitHub profile URL
    company: string | null;
    id: number;            // Unique identifier
  }
  
  export interface CandidateResponse {
    message?: string;      // For error handling
    data?: Candidate[];
  }