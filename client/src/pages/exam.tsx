import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExamTimer from "@/components/exam-timer";
import { Moon, Sun, BookOpen, Filter } from "lucide-react";
import type { Question, ExamConfig } from "@/lib/types";

// Placeholder for exam duration (in seconds) - assuming 3 hours
const EXAM_DURATION = 3 * 60 * 60;

const categories = [
  { id: "ความสามารถทั่วไป", name: "ความสามารถทั่วไป", color: "bg-blue-500", darkColor: "bg-blue-600" },
  { id: "ภาษาไทย", name: "ภาษาไทย", color: "bg-green-500", darkColor: "bg-green-600" },
  { id: "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", name: "คอมพิวเตอร์", color: "bg-purple-500", darkColor: "bg-purple-600" },
  { id: "ภาษาอังกฤษ", name: "ภาษาอังกฤษ", color: "bg-red-500", darkColor: "bg-red-600" },
  { id: "สังคม วัฒนธรรม จริยธรรม และอาเซียน", name: "สังคม วัฒนธรรม", color: "bg-yellow-500", darkColor: "bg-yellow-600" },
  { id: "กฎหมายที่ประชาชนควรรู้", name: "กฎหมาย", color: "bg-indigo-500", darkColor: "bg-indigo-600" },
];

export default function ExamPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [examConfig, setExamConfig] = useState<any>(null);
  const [showNavigationGrid, setShowNavigationGrid] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // State for pagination in navigation grid

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Helper function to determine difficulty color
  const getDifficultyColor = (difficulty: string) => {
    if (darkMode) {
      switch (difficulty.toLowerCase()) {
        case "ง่าย":
        case "easy":
          return "bg-green-800 text-green-200 border-green-600";
        case "ปานกลาง":
        case "medium":
          return "bg-yellow-800 text-yellow-200 border-yellow-600";
        case "ยาก":
        case "hard":
          return "bg-red-800 text-red-200 border-red-600";
        default:
          return "bg-gray-700 text-gray-200 border-gray-500";
      }
    } else {
      switch (difficulty.toLowerCase()) {
        case "ง่าย":
        case "easy":
          return "bg-green-100 text-green-800 border-green-300";
        case "ปานกลาง":
        case "medium":
          return "bg-yellow-100 text-yellow-800 border-yellow-300";
        case "ยาก":
        case "hard":
          return "bg-red-100 text-red-800 border-red-300";
        default:
          return "bg-gray-100 text-gray-800 border-gray-300";
      }
    }
  };

  // Load exam configuration and generate questions
  useEffect(() => {
    const savedConfig = localStorage.getItem("examConfig");
    if (savedConfig) {
      const config: ExamConfig = JSON.parse(savedConfig);
      setExamConfig(config);
      // Ensure the number of questions is limited to 150
      const limitedConfig = { ...config, numberOfQuestions: Math.min(config.numberOfQuestions, 150) };
      generateExam(limitedConfig);
    } else {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่พบการกำหนดค่าการสอบ กลับไปหน้าหลักเพื่อเริ่มใหม่",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, []);

  const generateExamMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await apiRequest("POST", "/api/mock-exam", config);
      if (!response.ok) {
        throw new Error("Failed to generate exam");
      }
      return response.json();
    },
    onSuccess: (questions: Question[]) => {
      const limitedQuestions = questions.slice(0, 150);
      setExamQuestions(limitedQuestions);
      setStartTime(new Date());
    },
    onError: (error) => {
      console.error("Error generating exam:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างข้อสอบได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
      setLocation("/");
    },
  });

  const generateExam = (config: any) => {
    generateExamMutation.mutate(config);
  };

  // Auto-save functionality
  useEffect(() => {
    if (examQuestions.length > 0) {
      setAutoSaveStatus("saving");
      const saveTimer = setTimeout(() => {
        localStorage.setItem("examProgress", JSON.stringify({
          answers,
          currentQuestionIndex,
          bookmarkedQuestions: Array.from(bookmarkedQuestions),
          startTime: startTime?.toISOString(), // Use optional chaining for startTime
          examQuestions: examQuestions, // Save the current set of questions
        }));
        setAutoSaveStatus("saved");
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [answers, currentQuestionIndex, bookmarkedQuestions, startTime, examQuestions]); // Dependencies added

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem("examProgress");
    const savedConfig = localStorage.getItem("examConfig"); // Also load saved config to ensure consistency

    if (savedProgress && savedConfig) {
      const progress = JSON.parse(savedProgress);
      const config = JSON.parse(savedConfig);

      // Basic check to see if loaded progress matches current exam config (e.g., exam ID or type)
      // This is a simplified check; a more robust solution might involve exam IDs.
      if (config.examId === examConfig?.examId || !examConfig) { // If no examConfig is set yet, or if IDs match
        setAnswers(progress.answers || {});
        setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
        setBookmarkedQuestions(progress.bookmarkedQuestions || []);
        if (progress.startTime) {
          setStartTime(new Date(progress.startTime));
        }
        // Ensure loaded questions are also within the limit
        setExamQuestions(progress.examQuestions.slice(0, 150) || []);
      } else {
        // If configs don't match, clear saved progress and start fresh
        localStorage.removeItem("examProgress");
        // Re-generate exam if config changed
        const limitedConfig = { ...config, numberOfQuestions: Math.min(config.numberOfQuestions, 150) };
        generateExam(limitedConfig);
      }
    } else if (savedConfig && !savedProgress) {
        // If config exists but no progress, generate exam
        const config = JSON.parse(savedConfig);
        const limitedConfig = { ...config, numberOfQuestions: Math.min(config.numberOfQuestions, 150) };
        generateExam(limitedConfig);
    }
  }, [examConfig]); // Depend on examConfig to re-evaluate on load


  const submitExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      const response = await apiRequest("POST", "/api/scores", examData);
      if (!response.ok) {
        throw new Error("Failed to submit exam");
      }
      return response.json();
    },
    onSuccess: (score) => {
      localStorage.removeItem("examProgress");
      localStorage.setItem("lastExamScore", JSON.stringify(score));
      setLocation("/results");
    },
    onError: (error) => {
      console.error("Error submitting exam:", error);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกผลสอบได้ กรุณาลองส่งอีกครั้ง",
        variant: "destructive",
      });
    },
  });

  const handleAnswerSelect = (answerIndex: number) => {
    const currentQuestion = examQuestions[currentQuestionIndex];
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answerIndex,
      }));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // If on the last question, show the submit confirmation
      setShowConfirmSubmit(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const toggleBookmark = (questionId: string) => {
    setBookmarkedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const jumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowNavigationGrid(false);
  };

  const handleSubmitExam = () => {
    if (!startTime) return; // Should not happen if exam started

    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    let correctAnswers = 0;
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

    examQuestions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswerIndex;

      if (isCorrect) {
        correctAnswers++;
      }

      if (!categoryBreakdown[question.category]) {
        categoryBreakdown[question.category] = { correct: 0, total: 0 };
      }
      categoryBreakdown[question.category].total++;
      if (isCorrect) {
        categoryBreakdown[question.category].correct++;
      }
    });

    const examData = {
      totalScore: Math.round((correctAnswers / examQuestions.length) * 100),
      totalQuestions: examQuestions.length,
      correctAnswers,
      timeSpent,
      examType: examConfig?.type === "full" ? "สอบเต็มรูปแบบ" : "สอบแบบกำหนดเอง",
      answersGiven: answers,
      categoryBreakdown,
      questions: examQuestions,
      bookmarkedQuestions: bookmarkedQuestions,
    };

    // Store complete exam data for results page
    localStorage.setItem("lastExamData", JSON.stringify({
      score: examData,
      questions: examQuestions,
      answers: answers,
      bookmarkedQuestions: bookmarkedQuestions
    }));

    submitExamMutation.mutate(examData);
  };

  const handleTimeUp = () => {
    toast({
      title: "หมดเวลาการสอบ",
      description: "ระบบจะส่งข้อสอบโดยอัตโนมัติ",
      variant: "destructive",
    });
    // Automatically submit after a short delay to allow the toast to be seen
    setTimeout(() => {
      handleSubmitExam();
    }, 1500);
  };

  if (generateExamMutation.isPending || examQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">กำลังเตรียมข้อสอบ...</h2>
            <p className="text-gray-600">กรุณารอสักครู่</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;
  const allQuestionsAnswered = answeredQuestions === examQuestions.length;

  // Get category progress
  const getCategoryProgress = () => {
    const categoryStats: Record<string, { total: number; answered: number; color: string }> = {};

    examQuestions.forEach(question => {
      const categoryInfo = categories.find(cat => cat.id === question.category);
      const categoryKey = categoryInfo?.id || question.category;

      if (!categoryStats[categoryKey]) {
        categoryStats[categoryKey] = {
          total: 0,
          answered: 0,
          color: categoryInfo?.color || "bg-gray-500"
        };
      }

      categoryStats[categoryKey].total++;
      if (answers[question.id] !== undefined) {
        categoryStats[categoryKey].answered++;
      }
    });

    return categoryStats;
  };

  // Filter questions by category
  const filteredQuestions = selectedCategory === "all" 
    ? examQuestions 
    : examQuestions.filter(q => q.category === selectedCategory);

  const getQuestionsByCategory = (categoryId: string) => {
    return examQuestions.filter(q => q.category === categoryId);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-primary-bg'}`}>
      {/* Exam Header */}
      <div className={`border-b sticky top-0 z-10 backdrop-blur-sm transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/95 border-gray-700' 
          : 'bg-white/95 border-secondary-gray'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className={`text-lg font-medium flex items-center gap-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <BookOpen className="w-5 h-5 text-primary-blue" />
              ข้อที่ <span className="text-primary-blue font-bold text-xl">{currentQuestionIndex + 1}</span> จาก{" "}
              <span className="font-semibold">{examQuestions.length}</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-2">
                <Sun className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-gray-600"
                />
                <Moon className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-gray-400'}`} />
              </div>
              <ExamTimer
                duration={examConfig?.duration || EXAM_DURATION}
                onTimeUp={handleTimeUp}
                startTime={startTime}
              />
            </div>
          </div>

          {/* Enhanced Category Filter */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                กรองตามวิชา:
              </span>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className={`w-80 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : ''}`}>
                <SelectValue placeholder="เลือกวิชา" />
              </SelectTrigger>
              <SelectContent className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                <SelectItem value="all" className={darkMode ? 'text-gray-200 focus:bg-gray-600' : ''}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    ทุกวิชา
                  </div>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id}
                    className={darkMode ? 'text-gray-200 focus:bg-gray-600' : ''}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${darkMode ? category.darkColor : category.color} rounded-full`}></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-4">
            <div className={`flex items-center justify-between text-xs mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <span>ความคืบหน้าโดยรวม</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className={`w-full h-3 ${darkMode ? 'bg-gray-700' : ''}`} />
          </div>

          {/* Enhanced Category Progress Bars */}
          <div className="space-y-3 mb-4">
            <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              ความคืบหน้าตามวิชา
            </h4>
            {Object.entries(getCategoryProgress()).map(([categoryId, stats]) => {
              const categoryInfo = categories.find(cat => cat.id === categoryId);
              const categoryProgress = (stats.answered / stats.total) * 100;

              return (
                <div key={categoryId} className={`rounded-lg p-3 transition-colors ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${darkMode ? categoryInfo?.darkColor : categoryInfo?.color || stats.color}`}></div>
                      <span className={`text-xs font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {categoryInfo?.name || categoryId}
                      </span>
                    </div>
                    <div className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {stats.answered}/{stats.total}
                    </div>
                  </div>
                  <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${darkMode ? categoryInfo?.darkColor : categoryInfo?.color || stats.color}`}
                      style={{ width: `${categoryProgress}%` }}
                    ></div>
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {categoryProgress.toFixed(1)}% เสร็จสิ้น
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-gray-600">
            ความคืบหน้า: {progress.toFixed(1)}% • ตอบแล้ว: {answeredQuestions}/{examQuestions.length} ข้อ
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation Grid Modal */}
        {showNavigationGrid && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className={`rounded-2xl p-6 max-w-5xl w-full mx-4 max-h-[85vh] overflow-auto shadow-2xl border transition-colors ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-primary-blue'}`} />
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    เลือกข้อสอบ
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowNavigationGrid(false)}
                  className={`text-2xl font-light ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ✕
                </Button>
              </div>

              {/* Category Filter in Navigation Grid */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Filter className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    กรองตามวิชา:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                    className={`rounded-full ${selectedCategory === "all" 
                      ? 'bg-primary-blue hover:bg-blue-600 text-white' 
                      : darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      ทุกวิชา
                    </div>
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`rounded-full ${selectedCategory === category.id
                        ? 'bg-primary-blue hover:bg-blue-600 text-white'
                        : darkMode
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${darkMode ? category.darkColor : category.color} rounded-full`}></div>
                        {category.name}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Pagination for the Question Grid */}
              <div className="flex justify-center mb-6">
                {Array.from({ length: Math.ceil(filteredQuestions.length / 10) }).map((_, pageIndex) => (
                  <Button
                    key={pageIndex}
                    variant={currentPage === pageIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageIndex)}
                    className={`mx-1 rounded-full w-10 h-10 ${
                      currentPage === pageIndex
                        ? 'bg-primary-blue hover:bg-blue-600'
                        : darkMode
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageIndex + 1}
                  </Button>
                ))}
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                {filteredQuestions.slice(currentPage * 10, (currentPage + 1) * 10).map((question, index) => {
                  const globalIndex = currentPage * 10 + index;
                  const questionId = question.id;
                  const isAnswered = answers[questionId] !== undefined;
                  const isBookmarked = bookmarkedQuestions.includes(questionId);
                  const isCurrent = globalIndex === currentQuestionIndex;
                  const categoryInfo = categories.find(cat => cat.id === question.category);

                  return (
                    <Button
                      key={question.id}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      className={`
                        relative h-12 w-12 p-0 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg
                        ${isCurrent 
                          ? `bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/50 scale-110 ring-2 ${darkMode ? 'ring-blue-400' : 'ring-blue-300'}` 
                          : isAnswered 
                            ? `bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/30 ${darkMode ? 'hover:from-emerald-400 hover:to-green-500' : 'hover:from-emerald-600 hover:to-green-700'}` 
                            : `${darkMode 
                                ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300 shadow-slate-900/30 hover:from-slate-600 hover:to-slate-700 hover:border-blue-500' 
                                : 'bg-gradient-to-br from-white to-slate-50 border-slate-300 text-slate-700 shadow-slate-200/50 hover:from-blue-50 hover:to-blue-100 hover:border-blue-400'}`
                        }
                        ${isBookmarked ? `ring-2 ${darkMode ? 'ring-yellow-400' : 'ring-yellow-500'}` : ''}
                      `}
                      onClick={() => {
                        setCurrentQuestionIndex(globalIndex);
                        setShowNavigationGrid(false);
                      }}
                    >
                      <span className="relative z-10">{globalIndex + 1}</span>
                      {/* Category color indicator */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-xl opacity-70 ${categoryInfo?.darkColor || categoryInfo?.color || 'bg-gray-500'}`}></div>
                      {/* Bookmark indicator */}
                      {isBookmarked && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full shadow-lg flex items-center justify-center ${
                          darkMode ? 'bg-yellow-400' : 'bg-yellow-500'
                        }`}>
                          <span className="text-xs">★</span>
                        </div>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Enhanced Legend */}
              <div className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                darkMode 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-slate-900/50' 
                  : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-slate-200/50'
              }`}>
                <div className={`text-sm font-bold mb-4 flex items-center gap-2 ${
                  darkMode ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  คำอธิบายสัญลักษณ์
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">●</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>ข้อปัจจุบัน</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>ตอบแล้ว</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-xl shadow-lg border-2 flex items-center justify-center ${
                      darkMode 
                        ? 'bg-gradient-to-br from-slate-600 to-slate-700 border-slate-500' 
                        : 'bg-gradient-to-br from-white to-slate-100 border-slate-300'
                    }`}>
                      <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>○</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>ยังไม่ตอบ</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">★</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>บุ๊กมาร์ก</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-2">
            <Card className={`shadow-2xl border-2 transition-all duration-300 ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-slate-900/50' 
                : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-blue-100/50'
            }`}>
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <Badge 
                      variant="secondary" 
                      className={`px-4 py-2 text-sm font-bold rounded-xl shadow-lg ${
                        darkMode 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      }`}
                    >
                      ข้อ {currentQuestionIndex + 1} จาก {examQuestions.length}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        categories.find(cat => cat.id === currentQuestion?.category)?.darkColor || 
                        categories.find(cat => cat.id === currentQuestion?.category)?.color || 
                        'bg-gray-500'
                      }`}></div>
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border-2 ${
                          darkMode 
                            ? 'border-slate-500 text-slate-300 bg-slate-700/50' 
                            : 'border-slate-300 text-slate-600 bg-white/80'
                        }`}
                      >
                        {categories.find(cat => cat.id === currentQuestion?.category)?.name || currentQuestion?.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => toggleBookmark(currentQuestion?.id)}
                      className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        bookmarkedQuestions.includes(currentQuestion?.id || "")
                          ? darkMode 
                            ? 'border-yellow-400 text-yellow-300 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 hover:from-yellow-800/40 hover:to-yellow-700/40' 
                            : 'border-yellow-500 text-yellow-700 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200'
                          : darkMode
                            ? 'border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-yellow-500'
                            : 'border-slate-300 text-slate-600 bg-white hover:bg-yellow-50 hover:border-yellow-400'
                      }`}
                    >
                      {bookmarkedQuestions.includes(currentQuestion?.id || "") ? "★" : "☆"} บุ๊กมาร์ก
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowNavigationGrid(!showNavigationGrid)}
                      className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        darkMode 
                          ? 'border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-blue-500' 
                          : 'border-slate-300 text-slate-600 bg-white hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      แผนที่ข้อสอบ
                    </Button>
                  </div>
                </div>

                {/* Question Text */}
                <div className={`p-6 rounded-xl mb-6 ${
                  darkMode ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50' : 'bg-gradient-to-br from-white to-slate-50'
                }`}>
                  <h2 className={`text-xl font-medium leading-relaxed ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {currentQuestion.questionText}
                  </h2>
                </div>

                {/* Answer Options */}
                <div className="space-y-4 mb-8">
                  {currentQuestion?.options.map((option, index) => (
                    <button
                      key={index}
                      className={`group w-full text-left p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${
                        answers[currentQuestion.id] === index
                          ? darkMode 
                            ? 'border-blue-400 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 text-blue-200 shadow-blue-500/30' 
                            : 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 shadow-blue-200/50'
                          : darkMode
                            ? 'border-slate-600 bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-slate-200 hover:border-blue-500 hover:bg-gradient-to-r hover:from-slate-600/50 hover:to-slate-700/50 shadow-slate-900/30'
                            : 'border-slate-300 bg-gradient-to-r from-white to-slate-50 text-slate-700 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 shadow-slate-200/50'
                      }`}
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
                          answers[currentQuestion.id] === index
                            ? darkMode 
                              ? 'border-blue-300 bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg' 
                              : 'border-blue-500 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg'
                            : darkMode
                              ? 'border-slate-500 bg-gradient-to-br from-slate-600 to-slate-700 group-hover:border-blue-400'
                              : 'border-slate-400 bg-gradient-to-br from-white to-slate-100 group-hover:border-blue-400'
                        }`}>
                          {answers[currentQuestion.id] === index ? (
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          ) : (
                            <span className={`text-sm font-bold ${
                              darkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-bold mb-1 block ${
                            answers[currentQuestion.id] === index
                              ? darkMode ? 'text-blue-300' : 'text-blue-700'
                              : darkMode ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            ตัวเลือก {String.fromCharCode(65 + index)}
                          </span>
                          <span className={`text-base font-medium leading-relaxed ${
                            answers[currentQuestion.id] === index
                              ? darkMode ? 'text-blue-200' : 'text-blue-800'
                              : darkMode ? 'text-slate-200' : 'text-slate-700'
                          }`}>
                            {option}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  darkMode 
                    ? 'border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-blue-500 disabled:opacity-50 disabled:transform-none' 
                    : 'border-slate-300 text-slate-600 bg-white hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:transform-none'
                }`}
              >
                ← ข้อก่อนหน้า
              </Button>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => toggleBookmark(currentQuestion?.id)}
                  className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    bookmarkedQuestions.includes(currentQuestion?.id || "")
                      ? darkMode 
                        ? 'border-yellow-400 text-yellow-300 bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 hover:from-yellow-800/40 hover:to-yellow-700/40' 
                        : 'border-yellow-500 text-yellow-700 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200'
                      : darkMode
                        ? 'border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-yellow-500'
                        : 'border-slate-300 text-slate-600 bg-white hover:bg-yellow-50 hover:border-yellow-400'
                  }`}
                >
                  {bookmarkedQuestions.includes(currentQuestion?.id || "") ? "★" : "☆"} บุ๊กมาร์ก
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowNavigationGrid(!showNavigationGrid)}
                  className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    darkMode 
                      ? 'border-slate-600 text-slate-300 bg-slate-700/50 hover:bg-slate-600 hover:border-blue-500' 
                      : 'border-slate-300 text-slate-600 bg-white hover:bg-blue-50 hover:border-blue-400'
                  }`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  แผนที่ข้อสอบ
                </Button>
              </div>

              <Button
                onClick={() => setShowConfirmSubmit(true)} // Show confirmation dialog
                className={`px-8 py-4 rounded-xl font-bold shadow-xl transition-all duration-300 transform hover:scale-105 ${
                  isLastQuestion ? 'bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700' : ''
                }`}
                disabled={submitExamMutation.isPending}
              >
                {isLastQuestion ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    ส่งข้อสอบ
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">➡️</span>
                    ข้อถัดไป
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className={`shadow-2xl border-2 transition-all duration-300 ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-slate-900/50' 
                : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-blue-100/50'
            }`}>
              <CardContent className="p-6">
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  สรุปข้อสอบ
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>ตอบแล้ว</span>
                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{answeredQuestions} / {examQuestions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>บุ๊กมาร์ก</span>
                    <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{bookmarkedQuestions.length}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <Button
                    onClick={() => setShowNavigationGrid(true)}
                    className="w-full px-6 py-3 rounded-xl font-bold shadow-lg"
                    size="sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    แผนที่ข้อสอบ
                  </Button>
                </div>

                {/* Quick Navigation */}
                <div>
                  <h4 className={`text-sm font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    นำทางด่วน
                  </h4>
                  <div className="grid grid-cols-5 gap-1 max-h-60 overflow-y-auto">
                    {examQuestions.map((question, index) => {
                      const isAnswered = answers[question.id] !== undefined;
                      const isBookmarked = bookmarkedQuestions.includes(question.id);
                      const isCurrent = index === currentQuestionIndex;

                      return (
                        <Button
                          key={question.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`
                            h-8 text-xs p-0 min-w-0
                            ${isCurrent
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg ring-2 ring-blue-400"
                              : isAnswered
                                ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg ring-1 ring-green-500"
                                : `${darkMode ? "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-300" : "bg-white border-slate-300 text-slate-700"} hover:bg-blue-50 hover:border-blue-300`
                            }
                            ${isBookmarked ? `ring-1 ${darkMode ? "ring-yellow-400" : "ring-yellow-500"}` : ""}
                          `}
                        >
                          {index + 1}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className={`w-full max-w-lg mx-4 shadow-2xl border transition-colors ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📝</span>
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  ยืนยันการส่งข้อสอบ
                </h2>
                <div className={`text-base leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="mb-2">
                    คุณได้ตอบคำถาม <span className="font-semibold text-green-600">{answeredQuestions}</span> จาก{" "}
                    <span className="font-semibold">{examQuestions.length}</span> ข้อแล้ว
                  </p>
                  <p>ต้องการส่งข้อสอบหรือไม่?</p>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmSubmit(false)}
                  className={`px-6 py-3 rounded-xl font-medium ${
                    darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
                  }`}
                >
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleSubmitExam} 
                  disabled={submitExamMutation.isPending} 
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium text-white shadow-lg disabled:opacity-50"
                >
                  {submitExamMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังส่ง...
                    </div>
                  ) : (
                    "ส่งข้อสอบ"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}