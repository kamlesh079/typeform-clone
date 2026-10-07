export type Option = { id?: number; label: string; position?: number };
export type Question = {
  id: number;
  title: string;
  description?: string | null;
  type: string;
  required: boolean;
  position: number;
  options: Option[];
};
export type Form = {
  id: number;
  title: string;
  slug: string;
  status: string;
  theme: string;
  thank_you_title: string;
  thank_you_message: string;
  created_at: string;
  updated_at: string;
  questions: Question[];
  response_count: number;
};
