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

export default function ExamPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // Load exam configuration and generate questions
  useEffect(() => {
    const savedConfig = localStorage.getItem("examConfig");
    if (savedConfig) {
      const config: ExamConfig = JSON.parse(savedConfig);
      setExamConfig(config);
      generateExam(config);
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
      const response = await apiRequest("POST", "/api/mock-exam", config);
      return response.json();
    },
    onSuccess: (questions: Question[]) => {
      setExamQuestions(questions);
      setStartTime(new Date());
    },
    onError: () => {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถสร้างข้อสอบได้",
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
          startTime: startTime.toISOString(),
          examQuestions,
        }));
        setAutoSaveStatus("saved");
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [answers, currentQuestionIndex, bookmarkedQuestions]);

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem("examProgress");
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setAnswers(progress.answers || {});
      setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      setBookmarkedQuestions(new Set(progress.bookmarkedQuestions || []));
      if (progress.startTime) {
        setStartTime(new Date(progress.startTime));
      }
    }
  }, []);

  const submitExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      const response = await apiRequest("POST", "/api/scores", examData);
      return response.json();
    },
    onSuccess: (score) => {
      localStorage.removeItem("examProgress");
      localStorage.setItem("lastExamScore", JSON.stringify(score));
      setLocation("/results");
    },
    onError: () => {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถบันทึกผลสอบได้",
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
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleToggleBookmark = () => {
    const currentQuestion = examQuestions[currentQuestionIndex];
    if (currentQuestion) {
      setBookmarkedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(currentQuestion.id)) {
          newSet.delete(currentQuestion.id);
        } else {
          newSet.add(currentQuestion.id);
        }
        return newSet;
      });
    }
  };

  const handleSubmitExam = () => {
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
    setTimeout(() => {
      handleSubmitExam();
    }, 2000);
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
              duration={10800} // 3 hours
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

      {/* Question Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="pt-6 p-8">
            {/* Subject Badge */}
            <Badge variant="secondary" className="bg-primary-blue bg-opacity-10 text-primary-blue mb-4">
              {currentQuestion.category}
            </Badge>
            
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
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3"
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleBookmark}
              className={bookmarkedQuestions.has(currentQuestion.id) ? "bg-yellow-50 border-yellow-300" : ""}
            >
              {bookmarkedQuestions.has(currentQuestion.id) ? "🔖" : "🔖"} ทำเครื่องหมาย
            </Button>
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
              onClick={handleNextQuestion}
              className="px-6 py-3 bg-primary-blue hover:bg-blue-500"
              disabled={isLastQuestion}
            >
              ข้อถัดไป →
            </Button>
          )}
        </div>

        {/* Submit Section */}
        {isLastQuestion && (
          <div className="mt-6 text-center">
            <Card className="bg-yellow-50 border border-yellow-200 mb-4">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">พร้อมส่งข้อสอบแล้วหรือไม่?</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  คุณได้ตอบคำถาม {answeredQuestions} จาก {examQuestions.length} ข้อแล้ว
                  {!allQuestionsAnswered && " (ยังมีคำถามที่ยังไม่ได้ตอบ)"}
                </p>
                <Button
                  onClick={handleSubmitExam}
                  className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-medium hover-scale"
                  disabled={submitExamMutation.isPending}
                >
                  {submitExamMutation.isPending ? "กำลังส่งข้อสอบ..." : "ส่งข้อสอบ"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
