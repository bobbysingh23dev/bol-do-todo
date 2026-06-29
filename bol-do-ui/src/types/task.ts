export type Task = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  personName: string | null;
  amount: number | null;
  dueDateText: string | null;
  dueAt: string | null;
  status: string;
  sourceText: string | null;
  generatedMsg: string | null;
  audioPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  type?: string;
  personName?: string;
  amount?: number;
  dueDateText?: string;
  dueAt?: string;
  sourceText?: string;
  generatedMsg?: string;
  audioPath?: string;
};
