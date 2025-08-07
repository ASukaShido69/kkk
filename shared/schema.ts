import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswerIndex: integer("correct_answer_index").notNull(),
  explanation: text("explanation").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const examSets = pgTable("exam_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryDistribution: jsonb("category_distribution").$type<Record<string, number>>().notNull(),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scores = pgTable("scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalScore: integer("total_score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  dateTaken: timestamp("date_taken").defaultNow(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  examType: text("exam_type").notNull(),
  examSetId: varchar("exam_set_id"),
  answersGiven: jsonb("answers_given").$type<Record<string, number>>().notNull(),
  categoryBreakdown: jsonb("category_breakdown").$type<Record<string, { correct: number; total: number }>>(),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertExamSetSchema = createInsertSchema(examSets).omit({
  id: true,
  createdAt: true,
});

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  dateTaken: true,
});

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertExamSet = z.infer<typeof insertExamSetSchema>;
export type ExamSet = typeof examSets.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;

// Admin schema for authentication
export const adminCredentials = {
  username: "admin",
  password: "leo2568",
};

// Add insertExamSetSchema to routes.ts imports if not already present

// Exam configuration types
export const examConfigSchema = z.object({
  type: z.enum(["full", "custom"]),
  categories: z.record(z.number()).optional(),
});

export type ExamConfig = z.infer<typeof examConfigSchema>;

// CSV import schema
export const csvQuestionSchema = z.object({
  subject: z.string(),
  question: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  correct_answer: z.string(),
  explanation: z.string(),
});

export type CsvQuestion = z.infer<typeof csvQuestionSchema>;
