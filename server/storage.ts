import { type Question, type InsertQuestion, type Score, type InsertScore, type ExamSet, type InsertExamSet } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Questions
  getQuestions(filters?: { category?: string; difficulty?: string; search?: string }): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;
  getRandomQuestions(count: number, categories?: Record<string, number>): Promise<Question[]>;
  
  // Exam Sets
  getExamSets(): Promise<ExamSet[]>;
  getExamSet(id: string): Promise<ExamSet | undefined>;
  createExamSet(examSet: InsertExamSet): Promise<ExamSet>;
  updateExamSet(id: string, examSet: Partial<InsertExamSet>): Promise<ExamSet | undefined>;
  deleteExamSet(id: string): Promise<boolean>;
  
  // Scores
  getScores(): Promise<Score[]>;
  createScore(score: InsertScore): Promise<Score>;
  getScoresByLimit(limit?: number): Promise<Score[]>;
  
  // Bulk operations
  createQuestionsFromCsv(questions: InsertQuestion[]): Promise<{ success: number; errors: number }>;
}

export class MemStorage implements IStorage {
  private questions: Map<string, Question>;
  private scores: Map<string, Score>;
  private examSets: Map<string, ExamSet>;

  constructor() {
    this.questions = new Map();
    this.scores = new Map();
    this.examSets = new Map();
    this.initializeSampleData();
    this.initializeDefaultExamSet();
  }

  private initializeSampleData() {
    // Sample questions from the CSV data provided
    const sampleQuestions: InsertQuestion[] = [
      {
        questionText: "ถ้า 2x + 5 = 17 แล้วค่าของ x คือเท่าใด?",
        options: ["5", "6", "7", "8"],
        correctAnswerIndex: 1,
        explanation: "แก้สมการ: 2x = 17 - 5 = 12 → x = 12/2 = 6",
        category: "ความสามารถทั่วไป",
        difficulty: "ปานกลาง"
      },
      {
        questionText: "ผลลัพธ์ของ 3^2 + 4 × 2 เท่ากับเท่าใด?",
        options: ["15", "17", "19", "21"],
        correctAnswerIndex: 1,
        explanation: "ทำคูณก่อน: 4×2=8, แล้ว 3²=9 → 9+8=17",
        category: "ความสามารถทั่วไป",
        difficulty: "ง่าย"
      },
      {
        questionText: "คำว่า \"สุจริต\" หมายถึงอะไร?",
        options: ["ซื่อสัตย์", "ขี้โกง", "ขี้โมโห", "ขี้อาย"],
        correctAnswerIndex: 0,
        explanation: "\"สุจริต\" หมายถึง ซื่อสัตย์ ไม่ทุจริต",
        category: "ภาษาไทย",
        difficulty: "ง่าย"
      },
      {
        questionText: "หน่วยความจำหลักของคอมพิวเตอร์คืออะไร?",
        options: ["RAM", "Hard Disk", "USB Drive", "CD-ROM"],
        correctAnswerIndex: 0,
        explanation: "RAM (Random Access Memory) เป็นหน่วยความจำหลักที่ CPU ใช้ประมวลผลชั่วคราว",
        category: "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)",
        difficulty: "ปานกลาง"
      },
      {
        questionText: "Choose the correct sentence with proper grammar:",
        options: [
          "She have been working here for five years.",
          "She has been working here for five years.",
          "She is been working here for five years.",
          "She was been working here for five years."
        ],
        correctAnswerIndex: 1,
        explanation: "ในประโยคนี้ต้องใช้ Present Perfect Continuous Tense เพื่อแสดงการกระทำที่เริ่มต้นในอดีตและยังคงดำเนินต่อมาจนถึงปัจจุบัน โครงสร้าง: Subject + has/have + been + V-ing + for/since + time เนื่องจาก \"She\" เป็นประธานเอกพจน์ จึงใช้ \"has\" ไม่ใช่ \"have\" หรือ \"is\"",
        category: "ภาษาอังกฤษ",
        difficulty: "ปานกลาง"
      }
    ];

    sampleQuestions.forEach(q => {
      const id = randomUUID();
      const question: Question = { 
        ...q, 
        id, 
        createdAt: new Date() 
      };
      this.questions.set(id, question);
    });
  }

  private initializeDefaultExamSet() {
    const defaultExamSet: ExamSet = {
      id: randomUUID(),
      name: "การสอบนายสิบตำรวจ 2568",
      description: "ชุดข้อสอบมาตรฐานสำหรับการสอบนายสิบตำรวจ ประจำปี 2568 จำนวน 150 ข้อ",
      categoryDistribution: {
        "ความสามารถทั่วไป": 30,
        "ภาษาไทย": 25,
        "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)": 25,
        "ภาษาอังกฤษ": 30,
        "สังคม วัฒนธรรม จริยธรรม และอาเซียน": 20,
        "กฎหมายที่ประชาชนควรรู้": 20
      },
      isActive: 1,
      createdAt: new Date()
    };
    this.examSets.set(defaultExamSet.id, defaultExamSet);
  }

  async getQuestions(filters?: { category?: string; difficulty?: string; search?: string }): Promise<Question[]> {
    let questions = Array.from(this.questions.values());
    
    if (filters?.category && filters.category !== "all") {
      questions = questions.filter(q => q.category === filters.category);
    }
    
    if (filters?.difficulty && filters.difficulty !== "all") {
      questions = questions.filter(q => q.difficulty === filters.difficulty);
    }
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      questions = questions.filter(q => 
        q.questionText.toLowerCase().includes(searchLower) ||
        q.explanation.toLowerCase().includes(searchLower)
      );
    }
    
    return questions.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { 
      ...insertQuestion, 
      id, 
      createdAt: new Date() 
    };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const existing = this.questions.get(id);
    if (!existing) return undefined;
    
    const updated: Question = { ...existing, ...updateData };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return this.questions.delete(id);
  }

  async getRandomQuestions(count: number, categories?: Record<string, number>): Promise<Question[]> {
    const allQuestions = Array.from(this.questions.values());
    const selectedQuestions: Question[] = [];
    
    if (categories) {
      // Custom exam - select specified number of questions per category
      for (const [category, questionCount] of Object.entries(categories)) {
        if (questionCount > 0) {
          const categoryQuestions = allQuestions.filter(q => q.category === category);
          const shuffled = categoryQuestions.sort(() => Math.random() - 0.5);
          selectedQuestions.push(...shuffled.slice(0, questionCount));
        }
      }
    } else {
      // Full exam - 150 questions with specified distribution
      const distribution = {
        "ความสามารถทั่วไป": 30,
        "ภาษาไทย": 25,
        "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)": 25,
        "ภาษาอังกฤษ": 30,
        "สังคม วัฒนธรรม จริยธรรม และอาเซียน": 20,
        "กฎหมายที่ประชาชนควรรู้": 20
      };
      
      for (const [category, questionCount] of Object.entries(distribution)) {
        const categoryQuestions = allQuestions.filter(q => q.category === category);
        const shuffled = categoryQuestions.sort(() => Math.random() - 0.5);
        selectedQuestions.push(...shuffled.slice(0, questionCount));
      }
    }
    
    return selectedQuestions.sort(() => Math.random() - 0.5);
  }

  async getScores(): Promise<Score[]> {
    return Array.from(this.scores.values()).sort((a, b) => 
      (b.dateTaken?.getTime() || 0) - (a.dateTaken?.getTime() || 0)
    );
  }

  async createScore(insertScore: InsertScore): Promise<Score> {
    const id = randomUUID();
    const score: Score = { 
      ...insertScore,
      id, 
      dateTaken: new Date(),
      categoryBreakdown: insertScore.categoryBreakdown || null
    };
    this.scores.set(id, score);
    return score;
  }

  async getScoresByLimit(limit?: number): Promise<Score[]> {
    const scores = await this.getScores();
    return limit ? scores.slice(0, limit) : scores;
  }

  async createQuestionsFromCsv(questions: InsertQuestion[]): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;
    
    for (const question of questions) {
      try {
        await this.createQuestion(question);
        success++;
      } catch (error) {
        errors++;
      }
    }
    
    return { success, errors };
  }

  // Exam Sets methods
  async getExamSets(): Promise<ExamSet[]> {
    return Array.from(this.examSets.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getExamSet(id: string): Promise<ExamSet | undefined> {
    return this.examSets.get(id);
  }

  async createExamSet(insertExamSet: InsertExamSet): Promise<ExamSet> {
    const id = randomUUID();
    const examSet: ExamSet = {
      ...insertExamSet,
      id,
      createdAt: new Date()
    };
    this.examSets.set(id, examSet);
    return examSet;
  }

  async updateExamSet(id: string, updateData: Partial<InsertExamSet>): Promise<ExamSet | undefined> {
    const existingExamSet = this.examSets.get(id);
    if (!existingExamSet) return undefined;

    const updatedExamSet: ExamSet = {
      ...existingExamSet,
      ...updateData
    };
    this.examSets.set(id, updatedExamSet);
    return updatedExamSet;
  }

  async deleteExamSet(id: string): Promise<boolean> {
    return this.examSets.delete(id);
  }
}

export const storage = new MemStorage();
