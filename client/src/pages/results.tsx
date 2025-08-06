import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun, Filter } from "lucide-react"; // Import Filter icon
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
    // Load complete exam data from localStorage
    const lastExamData = localStorage.getItem("lastExamData");

    if (lastExamData) {
      const examData = JSON.parse(lastExamData);
      setScore(examData.score);

      // Process questions for review
      const questions: QuestionReview[] = examData.questions.map((q: Question) => ({
        ...q,
        userAnswer: examData.answers[q.id],
        isCorrect: examData.answers[q.id] === q.correctAnswerIndex,
        isBookmarked: examData.bookmarkedQuestions.includes(q.id),
      }));
      setExamQuestions(questions);
    } else {
      // Fallback to old method
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
    if (percentage >= 80) return "bg-green-50 dark:bg-green-900/20";
    if (percentage >= 60) return "bg-yellow-50 dark:bg-yellow-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "ง่าย": return "bg-green-500 text-white";
      case "ปานกลาง": return "bg-yellow-500 text-white";
      case "ยาก": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
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

            <div className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              คะแนนรวม {score.correctAnswers} จาก {score.totalQuestions} ข้อ
            </div>

            {/* Score Breakdown */}
            {score.categoryBreakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto mb-6">
                {Object.entries(score.categoryBreakdown).map(([category, breakdown]) => {
                  const categoryScore = Math.round((breakdown.correct / breakdown.total) * 100);
                  return (
                    <div key={category} className={`rounded-xl p-4 ${getScoreBgColor(categoryScore)}`}>
                      <div className={`text-sm mb-1 truncate ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} title={category}>
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

            <div className={`text-sm mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
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
      </div>

      {/* Answer Review */}
      <main className="max-w-4xl mx-auto px-4 py-8" id="review-section">
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>รีวิวข้อสอบ</h2>

        {/* Filter Options */}
        <Card className={`mb-8 shadow-xl border-2 transition-all duration-300 ${
          darkMode 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-slate-900/50' 
            : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-blue-100/50'
        }`}>
          <CardContent className="pt-8 pb-6">
            <h3 className={`font-bold text-lg mb-6 flex items-center gap-3 ${
              darkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Filter className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              กรองข้อสอบ
            </h3>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("all")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  filter === "all" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700" 
                    : darkMode
                      ? "border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-blue-500"
                      : "border-slate-300 text-slate-600 bg-white hover:bg-blue-50 hover:border-blue-400"
                }`}
              >
                ทั้งหมด ({examQuestions.length})
              </Button>
              <Button
                variant={filter === "correct" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("correct")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  filter === "correct" 
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700" 
                    : darkMode
                      ? "border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-emerald-500"
                      : "border-slate-300 text-slate-600 bg-white hover:bg-emerald-50 hover:border-emerald-400"
                }`}
              >
                ตอบถูก ({examQuestions.filter(q => q.isCorrect).length})
              </Button>
              <Button
                variant={filter === "incorrect" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("incorrect")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  filter === "incorrect" 
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700" 
                    : darkMode
                      ? "border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-red-500"
                      : "border-slate-300 text-slate-600 bg-white hover:bg-red-50 hover:border-red-400"
                }`}
              >
                ตอบผิด ({examQuestions.filter(q => !q.isCorrect && q.userAnswer !== undefined).length})
              </Button>
              <Button
                variant={filter === "bookmarked" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("bookmarked")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  filter === "bookmarked" 
                    ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-600 hover:to-amber-700" 
                    : darkMode
                      ? "border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-yellow-500"
                      : "border-slate-300 text-slate-600 bg-white hover:bg-yellow-50 hover:border-yellow-400"
                }`}
              >
                บุ๊กมาร์ก ({examQuestions.filter(q => q.isBookmarked).length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Review Items */}
        {filteredQuestions.length > 0 && (
          <div className="space-y-6">
            {filteredQuestions.map((question, index) => {
              const questionIndex = examQuestions.findIndex(q => q.id === question.id);
              return (
                <Card key={question.id} className={`transition-all duration-300 hover:shadow-lg ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                      <div className="flex items-center space-x-3 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`px-3 py-1 font-semibold ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          ข้อ {questionIndex + 1}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`px-3 py-1 font-medium border-2 ${
                            question.isCorrect
                              ? darkMode
                                ? 'border-green-500 bg-green-900/30 text-green-400'
                                : 'border-green-500 bg-green-50 text-green-700'
                              : darkMode
                                ? 'border-red-500 bg-red-900/30 text-red-400'
                                : 'border-red-500 bg-red-50 text-red-700'
                          }`}
                        >
                          {question.isCorrect ? "✓ ตอบถูก" : "✗ ตอบผิด"}
                        </Badge>
                        {question.isBookmarked && (
                          <Badge className="bg-yellow-400 text-yellow-900 px-3 py-1 font-medium">
                            📌 บุ๊กมาร์ก
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`px-3 py-1 ${
                            darkMode ? 'border-blue-500 bg-blue-900/30 text-blue-400' : 'border-blue-500 bg-blue-50 text-blue-700'
                          }`}
                        >
                          {question.category}
                        </Badge>
                      </div>
                      <Badge
                        className={`px-3 py-1 ${getDifficultyColor(question.difficulty)}`}
                      >
                        {question.difficulty}
                      </Badge>
                    </div>

                    <div className={`p-4 rounded-lg mb-6 ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <h3 className={`text-lg font-medium leading-relaxed ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {question.questionText}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = question.userAnswer === optionIndex;
                        const isCorrectAnswer = question.correctAnswerIndex === optionIndex;
                        const optionLabels = ['ก', 'ข', 'ค', 'ง'];

                        let optionStyle = `p-4 border-2 rounded-xl transition-all duration-300 ${
                          darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-300 bg-gray-50'
                        }`;

                        if (isCorrectAnswer) {
                          optionStyle = `p-4 border-2 rounded-xl transition-all duration-300 ${
                            darkMode
                              ? 'border-green-500 bg-green-900/30 shadow-md'
                              : 'border-green-500 bg-green-50 shadow-md'
                          }`;
                        }
                        if (isUserAnswer && !isCorrectAnswer) {
                          optionStyle = `p-4 border-2 rounded-xl transition-all duration-300 ${
                            darkMode
                              ? 'border-red-500 bg-red-900/30 shadow-md'
                              : 'border-red-500 bg-red-50 shadow-md'
                          }`;
                        }

                        return (
                          <div key={optionIndex} className={optionStyle}>
                            <div className="flex items-center">
                              <span className={`w-10 h-10 text-sm font-bold rounded-full flex items-center justify-center mr-4 transition-all duration-300 ${
                                isCorrectAnswer
                                  ? 'bg-green-500 text-white shadow-md'
                                  : isUserAnswer && !isCorrectAnswer
                                    ? 'bg-red-500 text-white shadow-md'
                                    : darkMode
                                      ? 'bg-gray-600 text-gray-300'
                                      : 'bg-gray-300 text-gray-700'
                              }`}>
                                {optionLabels[optionIndex]}
                              </span>
                              <span className={`flex-1 text-base leading-relaxed ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {option}
                              </span>
                              <div className="flex flex-col items-end gap-1">
                                {isUserAnswer && (
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${
                                      isCorrectAnswer
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    คุณเลือก
                                  </Badge>
                                )}
                                {isCorrectAnswer && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 text-xs"
                                  >
                                    ✓ เฉลย
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Show explanation if user got it wrong */}
                    {!question.isCorrect && (
                      <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                        darkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-500'
                      }`}>
                        <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          <strong>เฉลย:</strong> ตัวเลือกที่ถูกต้องคือ "{question.options[question.correctAnswerIndex]}"
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredQuestions.length === 0 && (
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
            <CardContent className="pt-6 text-center py-12">
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ไม่พบข้อสอบที่ตรงกับเงื่อนไขที่เลือก
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}