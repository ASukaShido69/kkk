import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExamTimer from "@/components/exam-timer";
import type { Question, ExamConfig } from "@/lib/types";

// Placeholder for exam duration (in seconds) - assuming 3 hours
const EXAM_DURATION = 3 * 60 * 60;

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

  // Helper function to determine difficulty color
  const getDifficultyColor = (difficulty: string) => {
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
    mutationFn: async (config: ExamConfig) => {
      // The API should handle the question limit internally, but we also ensure it here.
      const response = await apiRequest("POST", "/api/mock-exam", { ...config, numberOfQuestions: Math.min(config.numberOfQuestions, 150) });
      if (!response.ok) {
        throw new Error("Failed to generate exam");
      }
      return response.json();
    },
    onSuccess: (questions: Question[]) => {
      setExamQuestions(questions);
      setStartTime(new Date());
      // Ensure we don't exceed 150 questions if the backend returns more
      setExamQuestions(prevQuestions => prevQuestions.slice(0, 150));
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

  const generateExam = (config: ExamConfig) => {
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
    };

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

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Exam Header */}
      <div className="bg-white border-b border-secondary-gray sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium text-gray-800">
              ข้อที่ <span className="text-primary-blue font-bold">{currentQuestionIndex + 1}</span> จาก{" "}
              <span>{examQuestions.length}</span>
            </div>
            <ExamTimer
              duration={examConfig?.duration || EXAM_DURATION} // Use duration from config or default
              onTimeUp={handleTimeUp}
              startTime={startTime}
            />
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="w-full h-2 mb-2" />
          <div className="text-xs text-gray-600">
            ความคืบหน้า: {progress.toFixed(1)}% • ตอบแล้ว: {answeredQuestions}/{examQuestions.length} ข้อ
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation Grid Modal */}
        {showNavigationGrid && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">เลือกข้อสอบ</h3>
                <Button
                  variant="ghost"
                  onClick={() => setShowNavigationGrid(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-2 mb-4">
                {examQuestions.map((question, index) => {
                  const isAnswered = answers[question.id] !== undefined;
                  const isBookmarked = bookmarkedQuestions.includes(question.id);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <Button
                      key={question.id}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      onClick={() => jumpToQuestion(index)}
                      className={`
                        relative min-w-[40px] h-10 text-sm font-medium
                        ${isCurrent
                          ? "bg-primary-blue text-white"
                          : isAnswered
                            ? "bg-green-100 text-green-800 border-green-300"
                            : "bg-gray-50 text-gray-600 border-gray-300"
                        }
                        ${isBookmarked ? "ring-2 ring-yellow-400" : ""}
                      `}
                    >
                      {index + 1}
                      {isBookmarked && (
                        <span className="absolute -top-1 -right-1 text-yellow-500 text-xs">
                          📌
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary-blue rounded"></div>
                  <span>ข้อปัจจุบัน</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>ตอบแล้ว</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
                  <span>ยังไม่ตอบ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">📌</span>
                  <span>บุ๊กมาร์ก</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="px-3 py-1">
                      ข้อ {currentQuestionIndex + 1} / {examQuestions.length}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-3 py-1 text-primary-blue border-primary-blue"
                    >
                      {currentQuestion.category}
                    </Badge>
                    <Badge
                      className={`px-3 py-1 ${getDifficultyColor(currentQuestion.difficulty)}`}
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant={bookmarkedQuestions.includes(currentQuestion.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBookmark(currentQuestion.id)}
                      className="flex items-center space-x-2"
                    >
                      <span>{bookmarkedQuestions.includes(currentQuestion.id) ? "🔖" : "📑"}</span>
                      <span>บุ๊กมาร์ก</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNavigationGrid(true)}
                      className="flex items-center space-x-2"
                    >
                      <span>🗂️</span>
                      <span>เลือกข้อสอบ</span>
                    </Button>
                  </div>
                </div>

                {/* Question Text */}
                <h2 className="text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                  {currentQuestion.questionText}
                </h2>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === index;
                    const optionLabels = ['ก', 'ข', 'ค', 'ง'];

                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={`answer-option w-full p-4 text-left h-auto justify-start ${
                          isSelected ? "border-primary-blue bg-primary-blue bg-opacity-10" : ""
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <div className="flex items-center">
                          <span className={`w-8 h-8 text-white text-sm font-medium rounded-full flex items-center justify-center mr-4 ${
                            isSelected ? "bg-primary-blue" : "bg-secondary-gray"
                          }`}>
                            {optionLabels[index]}
                          </span>
                          <span className={isSelected ? "text-primary-blue font-medium" : ""}>
                            {option}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-6">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3"
                variant="outline"
              >
                ← ข้อก่อนหน้า
              </Button>

              <div className="text-center">
                {/* Auto-save Status */}
                <div className="text-xs mb-2">
                  {autoSaveStatus === "saved" && (
                    <span className="text-green-600">✓ บันทึกอัตโนมัติแล้ว</span>
                  )}
                  {autoSaveStatus === "saving" && (
                    <span className="text-blue-600">💾 กำลังบันทึก...</span>
                  )}
                  {autoSaveStatus === "error" && (
                    <span className="text-red-600">⚠️ บันทึกไม่สำเร็จ</span>
                  )}
                </div>
              </div>

              {!isLastQuestion ? (
                <Button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-primary-blue hover:bg-blue-500"
                >
                  ข้อถัดไป →
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirmSubmit(true)} // Show confirmation dialog
                  className="px-6 py-3 bg-green-600 hover:bg-green-700"
                >
                  ส่งข้อสอบ
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar (e.g., Timer, Summary) - Optional, kept for context */}
          <div className="lg:col-span-1 lg:block">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">สรุปข้อสอบ</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>เวลาที่ใช้</span>
                    <span className="font-medium">
                       {/* Timer component already handles display */}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ตอบแล้ว</span>
                    <span className="font-medium">{answeredQuestions} / {examQuestions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>บุ๊กมาร์ก</span>
                    <span className="font-medium">{bookmarkedQuestions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-4">ยืนยันการส่งข้อสอบ</h2>
              <p className="text-gray-600 mb-6">
                คุณได้ตอบคำถาม {answeredQuestions} จาก {examQuestions.length} ข้อแล้ว ต้องการส่งข้อสอบหรือไม่?
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setShowConfirmSubmit(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmitExam} disabled={submitExamMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {submitExamMutation.isPending ? "กำลังส่ง..." : "ส่งข้อสอบ"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}