import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Clock, BookOpen, Target, Star, Play, Trophy, Users, TrendingUp, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { ExamSet } from "@shared/schema";

const categories = [
  { id: "ความสามารถทั่วไป", name: "ความสามารถทั่วไป", maxQuestions: 30 },
  { id: "ภาษาไทย", name: "ภาษาไทย", maxQuestions: 25 },
  { id: "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", name: "คอมพิวเตอร์", maxQuestions: 25 },
  { id: "ภาษาอังกฤษ", name: "ภาษาอังกฤษ", maxQuestions: 30 },
  { id: "สังคม วัฒนธรรม จริยธรรม และอาเซียน", name: "สังคม วัฒนธรรม", maxQuestions: 20 },
  { id: "กฎหมายที่ประชาชนควรรู้", name: "กฎหมาย", maxQuestions: 20 },
];

export default function HomePage() {
  const [examType, setExamType] = useState<"examSet" | "custom">("examSet");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedExamSetId, setSelectedExamSetId] = useState<string>("");
  const [customConfig, setCustomConfig] = useState<Record<string, number>>({});
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode effect
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const { data: stats } = useQuery<{ totalQuestions: number; totalExams: number; averageScore: number; averageTime: number }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: questions } = useQuery<any[]>({
    queryKey: ["/api/questions"],
  });

  const { data: examSets } = useQuery<ExamSet[]>({
    queryKey: ["/api/exam-sets"],
  });

  // Auto-select first exam set when available
  useEffect(() => {
    if (examSets && examSets.length > 0 && !selectedExamSetId) {
      setSelectedExamSetId(examSets[0].id);
    }
  }, [examSets, selectedExamSetId]);

  const handleCustomConfigChange = (categoryId: string, count: number) => {
    setCustomConfig(prev => ({
      ...prev,
      [categoryId]: count
    }));
  };

  const totalCustomQuestions = Object.values(customConfig).reduce((sum, count) => sum + count, 0);

  const handleStartExam = () => {
    if (examType === "examSet" && !selectedExamSetId) {
      toast({
        title: "กรุณาเลือกชุดข้อสอบ",
        description: "โปรดเลือกชุดข้อสอบก่อนเริ่มทำการสอบ",
        variant: "destructive",
      });
      return;
    }

    if (examType === "custom" && totalCustomQuestions === 0) {
      toast({
        title: "กรุณากำหนดจำนวนข้อสอบ",
        description: "โปรดระบุจำนวนข้อสอบในแต่ละหมวดวิชา",
        variant: "destructive",
      });
      return;
    }

    // จำกัดข้อสอบไม่เกิน 150 ข้อ
    let totalQuestions = 0;
    if (examType === "examSet") {
      const examSet = examSets?.find(set => set.id === selectedExamSetId);
      if (examSet) {
        totalQuestions = Object.values(examSet.categoryDistribution).reduce((sum, count) => sum + count, 0);
      }
    } else {
      totalQuestions = totalCustomQuestions;
    }

    if (totalQuestions > 150) {
      toast({
        title: "จำนวนข้อสอบเกินขีดจำกัด",
        description: "จำนวนข้อสอบต้องไม่เกิน 150 ข้อ",
        variant: "destructive",
      });
      return;
    }

    const config = {
      examSetId: examType === "examSet" ? selectedExamSetId : undefined,
      customCategories: examType === "custom" ? customConfig : undefined,
      numberOfQuestions: Math.min(totalQuestions, 150),
      duration: 3 * 60 * 60, // 3 hours in seconds
    };

    // บันทึกการตั้งค่าการสอบและไปหน้าสอบ
    localStorage.setItem("examConfig", JSON.stringify(config));
    setLocation("/exam");
  };

  const selectedExamSet = examSets?.find(set => set.id === selectedExamSetId);
  const totalExamSetQuestions = selectedExamSet 
    ? Object.values(selectedExamSet.categoryDistribution).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-primary-bg'}`}>
      {/* Hero Section */}
      <div className={`transition-colors duration-300 ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-600 to-indigo-700'} text-white`}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex justify-end mb-4">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${darkMode ? 'bg-gray-800' : 'bg-white/20 backdrop-blur-md'}`}>
                <Sun className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-yellow-300'}`} />
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-gray-600"
                />
                <Moon className={`w-4 h-4 ${darkMode ? 'text-blue-300' : 'text-gray-400'}`} />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Leo Exam 2568</h1>
            <p className={`text-lg mb-6 ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
              แอปพลิเคชันฝึกสอบนายสิบตำรวจ
            </p>
            <div className={`flex items-center justify-center space-x-8 ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>ข้อสอบหลากหลาย</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>จับเวลาแม่นยำ</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>วิเคราะห์ผลลัพธ์</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-md shadow-sm border-gray-100'} sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className={`rounded-xl ${darkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                  <Target className="h-4 w-4 mr-2" />
                  สถิติของฉัน
                </Button>
              </Link>
            </div>
            <div>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className={`rounded-xl ${darkMode ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`}>
                  จัดการระบบ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Exam Selection */}
          <div className="lg:col-span-2">
            <Card className={`shadow-xl border-0 transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm'}`}>
              <CardHeader className="pb-4">
                <CardTitle className={`text-2xl font-bold flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  <Play className={`h-6 w-6 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  เริ่มทำการสอบ
                </CardTitle>
                <CardDescription className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  เลือกรูปแบบการสอบที่ต้องการ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs value={examType} onValueChange={(value) => setExamType(value as "examSet" | "custom")}>
                  <TabsList className={`grid w-full grid-cols-2 p-1 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <TabsTrigger value="examSet" className={`rounded-lg font-medium ${darkMode ? 'text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-white' : 'text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary-blue'}`}>ชุดข้อสอบมาตรฐาน</TabsTrigger>
                    <TabsTrigger value="custom" className={`rounded-lg font-medium ${darkMode ? 'text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-white' : 'text-gray-600 data-[state=active]:bg-white data-[state=active]:text-primary-blue'}`}>สอบแบบกำหนดเอง</TabsTrigger>
                  </TabsList>

                  <TabsContent value="examSet" className="space-y-4 mt-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>เลือกชุดข้อสอบ</label>
                      <Select value={selectedExamSetId} onValueChange={setSelectedExamSetId}>
                        <SelectTrigger className={`w-full h-12 border-2 ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white'}`}>
                          <SelectValue placeholder="เลือกชุดข้อสอบ" />
                        </SelectTrigger>
                        <SelectContent>
                          {examSets?.map((examSet) => (
                            <SelectItem key={examSet.id} value={examSet.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{examSet.name}</span>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{examSet.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedExamSet && (
                      <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                        <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-blue-900'}`}>รายละเอียดชุดข้อสอบ</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(selectedExamSet.categoryDistribution).map(([category, count]) => (
                            <div key={category} className="flex justify-between">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{categories.find(c => c.id === category)?.name || category}:</span>
                              <Badge variant="secondary" className={` ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>{count} ข้อ</Badge>
                            </div>
                          ))}
                        </div>
                        <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-blue-200'}`}>
                          <div className={`flex justify-between font-semibold ${darkMode ? 'text-gray-200' : 'text-blue-900'}`}>
                            <span>รวมทั้งหมด:</span>
                            <span>{totalExamSetQuestions} ข้อ</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>กำหนดจำนวนข้อสอบในแต่ละหมวดวิชา (สูงสุด 150 ข้อ)</div>
                      {categories.map((category) => (
                        <div key={category.id} className={`flex items-center justify-between p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <div className="flex-1">
                            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {category.name}
                            </label>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>สูงสุด {category.maxQuestions} ข้อ</span>
                          </div>
                          <Select 
                            value={String(customConfig[category.id] || 0)} 
                            onValueChange={(value) => handleCustomConfigChange(category.id, parseInt(value))}
                          >
                            <SelectTrigger className={`w-20 h-10 ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white'}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: category.maxQuestions + 1 }, (_, i) => (
                                <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}

                      {totalCustomQuestions > 0 && (
                        <div className={`rounded-xl p-4 ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-900'}`}>รวมจำนวนข้อสอบ</span>
                            <Badge variant="secondary" className={` ${darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-800'}`}>
                              {totalCustomQuestions} ข้อ
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="pt-4">
                  <Link href="/exam" onClick={handleStartExam}>
                    <Button 
                      className={`w-full h-14 text-lg font-semibold rounded-xl shadow-lg ${darkMode ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                      disabled={
                        (examType === "examSet" && !selectedExamSetId) ||
                        (examType === "custom" && totalCustomQuestions === 0)
                      }
                    >
                      <Play className="h-5 w-5 mr-3" />
                      เริ่มทำการสอบ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className={`shadow-lg transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg font-semibold flex items-center ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  <TrendingUp className={`h-5 w-5 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  สถิติ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>เวลาเฉลี่ย</span>
                  </div>
                  <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{Math.floor((stats?.averageTime || 0) / 60)} นาที</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>คะแนนเฉลี่ย</span>
                  </div>
                  <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{stats?.averageScore || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>ครั้งที่สอบ</span>
                  </div>
                  <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{stats?.totalExams || 0} ครั้ง</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Access */}
            <Card className={`shadow-lg transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/70 backdrop-blur-sm'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>เมนูหลัก</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/profile">
                  <Button variant="ghost" className={`w-full justify-start rounded-xl ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                    <Target className="h-4 w-4 mr-3" />
                    ดูผลสอบของฉัน
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="ghost" className={`w-full justify-start rounded-xl ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                    <BookOpen className="h-4 w-4 mr-3" />
                    จัดการข้อสอบ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}