export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

export interface WaitlistSubmitResult {
  ok: boolean;
  duplicate?: boolean;
  error?: string;
}
