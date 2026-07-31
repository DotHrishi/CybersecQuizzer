import { z } from 'zod';

// Username / Nickname validation
export const UserNameSchema = z.object({
  userName: z
    .string({ required_error: 'First name or nickname is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters long.')
    .max(30, 'Name must be at most 30 characters long.')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Name can only contain letters, numbers, spaces, underscores, or hyphens.'),
});

// Quiz Answer Submission validation
export const QuizSubmissionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required.'),
  userName: z.string().trim().min(2, 'Username is required.'),
  selectedOption: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Selected option must be A, B, C, or D.' }),
  }),
  selectedOptionText: z.string().min(1, 'Selected option text is required.'),
  // Stateless signed token for serverless fallback (session may not exist in memory on a different instance)
  sessionToken: z.string().optional(),
});


// Question Bank CRUD validation
export const QuestionSchema = z.object({
  questionText: z.string().trim().min(10, 'Question text must be at least 10 characters long.'),
  optionA: z.string().trim().min(1, 'Option A is required.'),
  optionB: z.string().trim().min(1, 'Option B is required.'),
  optionC: z.string().trim().min(1, 'Option C is required.'),
  optionD: z.string().trim().min(1, 'Option D is required.'),
  correctOption: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Correct option must be A, B, C, or D.' }),
  }),
  category: z.string().trim().min(2, 'Category is required.').default('General Security'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
  active: z.boolean().default(true),
});

// Admin Password Auth validation
export const AdminAuthSchema = z.object({
  adminPassword: z.string().min(1, 'Admin password is required.'),
});
