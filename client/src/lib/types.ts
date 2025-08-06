// Re-export types from shared schema for frontend use
export type {
  Question,
  InsertQuestion,
  Score,
  InsertScore,
  ExamConfig,
  CsvQuestion
} from "@shared/schema";

// Additional frontend-specific types
export interface ExamProgress {
  answers: Record<string, number>;
  currentQuestionIndex: number;
  bookmarkedQuestions: string[];
  startTime: string;
  examQuestions: Question[];
}

export interface QuestionReview extends Question {
  userAnswer?: number;
  isCorrect: boolean;
  isBookmarked: boolean;
}

export interface AdminStats {
  totalQuestions: number;
  totalExams: number;
  averageScore: number;
  averageTime: number;
}

export interface CategoryStats {
  [category: string]: {
    correct: number;
    total: number;
    percentage: number;
  };
}

export interface ImportResult {
  success: number;
  errors: number;
}

export type ExamFilter = "all" | "correct" | "incorrect" | "bookmarked";
export type AutoSaveStatus = "saved" | "saving" | "error";
