import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionSchema, insertScoreSchema, examConfigSchema, csvQuestionSchema, adminCredentials, insertExamSetSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";

const upload = multer({ dest: '/tmp/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Questions endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      const { category, difficulty, search } = req.query;
      const questions = await storage.getQuestions({
        category: category as string,
        difficulty: difficulty as string,
        search: search as string,
      });
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(req.params.id, validatedData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteQuestion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Mock exam endpoint
  app.post("/api/mock-exam", async (req, res) => {
    try {
      const config = examConfigSchema.parse(req.body);
      let questions;
      
      if (config.type === "full") {
        questions = await storage.getRandomQuestions(150);
      } else {
        const totalQuestions = Object.values(config.categories || {}).reduce((sum, count) => sum + count, 0);
        questions = await storage.getRandomQuestions(totalQuestions, config.categories);
      }
      
      res.json(questions);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid exam configuration", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate mock exam" });
    }
  });

  // Scores endpoints
  app.get("/api/scores", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const scores = await storage.getScoresByLimit(limit);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  app.post("/api/scores", async (req, res) => {
    try {
      const validatedData = insertScoreSchema.parse(req.body);
      const score = await storage.createScore(validatedData);
      res.status(201).json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save score" });
    }
  });

  // CSV import endpoint
  app.post("/api/import-csv", upload.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file provided" });
      }

      const fs = await import('fs');
      const csvContent = fs.readFileSync(req.file.path, 'utf-8');
      
      // Parse CSV content (simplified parser)
      const lines = csvContent.split('\n').slice(1); // Skip header
      const questions = [];
      
      for (const line of lines) {
        if (line.trim()) {
          const columns = line.split(',');
          if (columns.length >= 8) {
            try {
              const csvQuestion = csvQuestionSchema.parse({
                subject: columns[0]?.trim(),
                question: columns[1]?.trim(),
                option_a: columns[2]?.trim(),
                option_b: columns[3]?.trim(),
                option_c: columns[4]?.trim(),
                option_d: columns[5]?.trim(),
                correct_answer: columns[6]?.trim(),
                explanation: columns[7]?.trim(),
              });

              // Convert to our question format
              const correctAnswerMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
              const correctAnswerIndex = correctAnswerMap[csvQuestion.correct_answer.toLowerCase()];
              
              if (correctAnswerIndex !== undefined) {
                questions.push({
                  questionText: csvQuestion.question,
                  options: [csvQuestion.option_a, csvQuestion.option_b, csvQuestion.option_c, csvQuestion.option_d],
                  correctAnswerIndex,
                  explanation: csvQuestion.explanation,
                  category: csvQuestion.subject,
                  difficulty: "ปานกลาง", // Default difficulty
                });
              }
            } catch (parseError) {
              // Skip invalid rows
            }
          }
        }
      }

      const result = await storage.createQuestionsFromCsv(questions);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to import CSV" });
    }
  });

  // CSV export endpoint
  app.post("/api/scores/export", async (req, res) => {
    try {
      const scores = await storage.getScores();
      
      // Generate CSV content
      const headers = ['Date', 'Exam Type', 'Total Score (%)', 'Correct Answers', 'Total Questions', 'Time Spent (min)'];
      const csvRows = [headers.join(',')];
      
      scores.forEach(score => {
        const row = [
          score.dateTaken?.toISOString().split('T')[0] || '',
          score.examType,
          Math.round((score.correctAnswers / score.totalQuestions) * 100),
          score.correctAnswers,
          score.totalQuestions,
          Math.round(score.timeSpent / 60)
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="exam_scores.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export scores" });
    }
  });

  // Admin authentication endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === adminCredentials.username && password === adminCredentials.password) {
        // In a real app, you'd generate a JWT token here
        res.json({ 
          success: true, 
          token: "admin-token-" + Date.now(),
          message: "Login successful" 
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Statistics endpoint for admin dashboard
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      const scores = await storage.getScores();
      
      const stats = {
        totalQuestions: questions.length,
        totalExams: scores.length,
        averageScore: scores.length > 0 
          ? Math.round(scores.reduce((sum, score) => sum + (score.correctAnswers / score.totalQuestions), 0) / scores.length * 100)
          : 0,
        averageTime: scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score.timeSpent, 0) / scores.length)
          : 0,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Exam Sets endpoints
  app.get("/api/exam-sets", async (req, res) => {
    try {
      const examSets = await storage.getExamSets();
      res.json(examSets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam sets" });
    }
  });

  app.get("/api/exam-sets/:id", async (req, res) => {
    try {
      const examSet = await storage.getExamSet(req.params.id);
      if (!examSet) {
        return res.status(404).json({ message: "Exam set not found" });
      }
      res.json(examSet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam set" });
    }
  });

  app.post("/api/exam-sets", async (req, res) => {
    try {
      const result = insertExamSetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const examSet = await storage.createExamSet(result.data);
      res.status(201).json(examSet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create exam set" });
    }
  });

  app.put("/api/exam-sets/:id", async (req, res) => {
    try {
      const result = insertExamSetSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      const examSet = await storage.updateExamSet(req.params.id, result.data);
      if (!examSet) {
        return res.status(404).json({ message: "Exam set not found" });
      }
      res.json(examSet);
    } catch (error) {
      res.status(500).json({ message: "Failed to update exam set" });
    }
  });

  app.delete("/api/exam-sets/:id", async (req, res) => {
    try {
      const success = await storage.deleteExamSet(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Exam set not found" });
      }
      res.json({ message: "Exam set deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam set" });
    }
  });

  // Updated mock exam endpoint to use exam sets
  app.post("/api/mock-exam", async (req, res) => {
    try {
      const { examSetId, customCategories } = req.body;
      
      let questions;
      if (examSetId) {
        const examSet = await storage.getExamSet(examSetId);
        if (!examSet) {
          return res.status(404).json({ message: "Exam set not found" });
        }
        // คำนวณจำนวนข้อสอบรวมและจำกัดไม่เกิน 150
        const totalQuestions = Object.values(examSet.categoryDistribution).reduce((sum, count) => sum + count, 0);
        const limitedTotal = Math.min(totalQuestions, 150);
        
        // ปรับสัดส่วนถ้าเกิน 150
        let distribution = examSet.categoryDistribution;
        if (totalQuestions > 150) {
          const ratio = 150 / totalQuestions;
          distribution = {};
          for (const [category, count] of Object.entries(examSet.categoryDistribution)) {
            distribution[category] = Math.floor(count * ratio);
          }
          // ปรับให้รวมเป็น 150 พอดี
          const currentTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
          if (currentTotal < 150) {
            const categories = Object.keys(distribution);
            const remaining = 150 - currentTotal;
            for (let i = 0; i < remaining; i++) {
              const category = categories[i % categories.length];
              distribution[category]++;
            }
          }
        }
        
        questions = await storage.getRandomQuestions(limitedTotal, distribution);
      } else if (customCategories) {
        const totalQuestions = Object.values(customCategories).reduce((sum, count) => sum + (count as number), 0);
        if (totalQuestions > 150) {
          return res.status(400).json({ message: "จำนวนข้อสอบต้องไม่เกิน 150 ข้อ" });
        }
        questions = await storage.getRandomQuestions(totalQuestions, customCategories);
      } else {
        // Default exam with standard distribution (150 questions total)
        const defaultDistribution = {
          "ความสามารถทั่วไป": 30,
          "ภาษาไทย": 25,
          "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)": 25,
          "ภาษาอังกฤษ": 30,
          "สังคม วัฒนธรรม จริยธรรม และอาเซียน": 20,
          "กฎหมายที่ประชาชนควรรู้": 20
        };
        questions = await storage.getRandomQuestions(150, defaultDistribution);
      }
      
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate mock exam" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
