export interface Event {
  id: number;
  userId: string;
  name: string;
  date: string;
  resetCount: number;
  createdAt: string;
  reminderDays: number | null;
  reminderSent: boolean;
}
