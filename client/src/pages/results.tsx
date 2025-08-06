import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";
import type { Score, Question } from "@/lib/types";

interface QuestionReview extends Question {
  userAnswer?: number;
  isCorrect: boolean;
  isBookmarked: boolean;
}

export default function ResultsPage() {
  const [score, setScore] = useState<Score | null>(null);
  const [examQuestions, setExamQuestions] = useState<QuestionReview[]>([]);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "bookmarked">("all");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load last exam score and questions from localStorage
    const lastScoreData = localStorage.getItem("lastExamScore");
    const examProgressData = localStorage.getItem("examProgress");
    
    if (lastScoreData) {
      const scoreData: Score = JSON.parse(lastScoreData);
      setScore(scoreData);
    }

    if (examProgressData) {
      const progressData = JSON.parse(examProgressData);
      const questions: QuestionReview[] = progressData.examQuestions.map((q: Question) => ({
        ...q,
        userAnswer: progressData.answers[q.id],
        isCorrect: progressData.answers[q.id] === q.correctAnswerIndex,
        isBookmarked: progressData.bookmarkedQuestions.includes(q.id),
      }));
      setExamQuestions(questions);
    }
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!score) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-primary-bg'} flex items-center justify-center`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-lg font-semibold mb-2">ไม่พบผลการสอบ</h2>
            <p className="text-gray-600 mb-4">กรุณาทำข้อสอบก่อนดูผลลัพธ์</p>
            <Link href="/">
              <Button>กลับหน้าหลัก</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredQuestions = examQuestions.filter(question => {
    switch (filter) {
      case "correct":
        return question.isCorrect;
      case "incorrect":
        return !question.isCorrect;
      case "bookmarked":
        return question.isBookmarked;
      default:
        return true;
    }
  });

  const scorePercentage = Math.round((score.correctAnswers / score.totalQuestions) * 100);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-50";
    if (percentage >= 60) return "bg-yellow-50";
    return "bg-red-50";
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-primary-bg'}`}>
      {/* Results Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-secondary-gray'} border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">ผลการสอบ</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="text-center">
          
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(scorePercentage)}`}>
            {scorePercentage}%
          </div>
          
          <div className="text-lg text-gray-600 mb-4">
            คะแนนรวม {score.correctAnswers} จาก {score.totalQuestions} ข้อ
          </div>
          
          {/* Score Breakdown */}
          {score.categoryBreakdown && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto mb-6">
              {Object.entries(score.categoryBreakdown).map(([category, breakdown]) => {
                const categoryScore = Math.round((breakdown.correct / breakdown.total) * 100);
                return (
                  <div key={category} className={`rounded-xl p-4 ${getScoreBgColor(categoryScore)}`}>
                    <div className="text-sm text-gray-600 mb-1 truncate" title={category}>
                      {category.replace("คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", "คอมพิวเตอร์")}
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(categoryScore)}`}>
                      {breakdown.correct}/{breakdown.total}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="text-sm text-gray-600 mb-6">
            เวลาที่ใช้: {Math.floor(score.timeSpent / 60)} นาที {score.timeSpent % 60} วินาที
          </div>
          
          <div className="space-x-4">
            <Button 
              className="bg-primary-blue hover:bg-blue-500"
              onClick={() => document.getElementById("review-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              ดูเฉลยข้อสอบ
            </Button>
            <Link href="/">
              <Button variant="outline">กลับหน้าหลัก</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      <main className="max-w-4xl mx-auto px-4 py-8" id="review-section">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">รีวิวข้อสอบ</h2>
        
        {/* Filter Options */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">กรองข้อสอบ</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-primary-blue" : ""}
              >
                ทั้งหมด ({examQuestions.length})
              </Button>
              <Button
                variant={filter === "correct" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("correct")}
                className={filter === "correct" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                ตอบถูก ({examQuestions.filter(q => q.isCorrect).length})
              </Button>
              <Button
                variant={filter === "incorrect" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("incorrect")}
                className={filter === "incorrect" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                ตอบผิด ({examQuestions.filter(q => !q.isCorrect).length})
              </Button>
              <Button
                variant={filter === "bookmarked" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("bookmarked")}
                className={filter === "bookmarked" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
              >
                ทำเครื่องหมาย ({examQuestions.filter(q => q.isBookmarked).length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Review Items */}
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => {
            const optionLabels = ['ก', 'ข', 'ค', 'ง'];
            const questionNumber = examQuestions.findIndex(q => q.id === question.id) + 1;
            
            return (
              <Card key={question.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-600">ข้อ {questionNumber}</span>
                      <Badge variant={question.isCorrect ? "default" : "destructive"} className={
                        question.isCorrect 
                          ? "bg-green-100 text-green-800 hover:bg-green-100" 
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }>
                        {question.isCorrect ? "ตอบถูก" : "ตอบผิด"}
                      </Badge>
                      <Badge variant="secondary" className="bg-primary-blue bg-opacity-10 text-primary-blue">
                        {question.category}
                      </Badge>
                    </div>
                    {question.isBookmarked && <span className="text-yellow-500">🔖</span>}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    {question.questionText}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = optionIndex === question.correctAnswerIndex;
                      const isUserAnswer = optionIndex === question.userAnswer;
                      
                      let className = "flex items-center p-3 rounded-lg ";
                      let statusText = "";
                      
                      if (isCorrect) {
                        className += "bg-green-50 border-2 border-green-500 ";
                        statusText = " ✓ (คำตอบที่ถูก)";
                      } else if (isUserAnswer && !isCorrect) {
                        className += "bg-red-50 border-2 border-red-500 ";
                        statusText = " ✗ (คำตอบที่คุณเลือก)";
                      } else if (isUserAnswer) {
                        className += "bg-blue-50 border-2 border-blue-500 ";
                        statusText = " (คำตอบที่คุณเลือก)";
                      } else {
                        className += "bg-gray-50 ";
                      }
                      
                      return (
                        <div key={optionIndex} className={className}>
                          <span className={`w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center mr-3 ${
                            isCorrect ? "bg-green-500" : 
                            isUserAnswer ? (isCorrect ? "bg-green-500" : "bg-red-500") : 
                            "bg-gray-400"
                          }`}>
                            {optionLabels[optionIndex]}
                          </span>
                          <span className={`${isCorrect || isUserAnswer ? "font-medium" : ""} ${
                            isCorrect ? "text-green-700" : 
                            isUserAnswer && !isCorrect ? "text-red-700" : 
                            isUserAnswer ? "text-blue-700" : 
                            "text-gray-600"
                          }`}>
                            {option}{statusText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-800 mb-2">คำอธิบาย:</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredQuestions.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <div className="text-gray-500 text-lg">ไม่พบข้อสอบที่ตรงกับเงื่อนไขที่เลือก</div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
