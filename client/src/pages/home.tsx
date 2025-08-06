import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

const categories = [
  { id: "ความสามารถทั่วไป", name: "ความสามารถทั่วไป", maxQuestions: 30 },
  { id: "ภาษาไทย", name: "ภาษาไทย", maxQuestions: 25 },
  { id: "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", name: "คอมพิวเตอร์", maxQuestions: 25 },
  { id: "ภาษาอังกฤษ", name: "ภาษาอังกฤษ", maxQuestions: 30 },
  { id: "สังคม วัฒนธรรม จริยธรรม และอาเซียน", name: "สังคม วัฒนธรรม", maxQuestions: 20 },
  { id: "กฎหมายที่ประชาชนควรรู้", name: "กฎหมาย", maxQuestions: 20 },
];

export default function HomePage() {
  const [examType, setExamType] = useState<"full" | "custom">("full");
  const [customConfig, setCustomConfig] = useState<Record<string, number>>({});

  const { data: stats } = useQuery<{ totalQuestions: number; totalExams: number; averageScore: number; averageTime: number }>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: questions } = useQuery<any[]>({
    queryKey: ["/api/questions"],
  });

  const handleCustomConfigChange = (categoryId: string, count: number) => {
    setCustomConfig(prev => ({
      ...prev,
      [categoryId]: count
    }));
  };

  const totalCustomQuestions = Object.values(customConfig).reduce((sum, count) => sum + count, 0);

  const handleStartExam = () => {
    const config = {
      type: examType,
      categories: examType === "custom" ? customConfig : undefined,
    };
    
    // Store exam config in localStorage for the exam page
    localStorage.setItem("examConfig", JSON.stringify(config));
  };

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-secondary-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-blue">Leo Exam 2568</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/profile">
                <Button variant="ghost" className="text-gray-600 hover:text-primary-blue">
                  โปรไฟล์
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost" className="text-gray-600 hover:text-primary-blue">
                  จัดการ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-16">
        {/* Hero Banner */}
        <div className="relative mb-12">
          <div className="w-full aspect-video rounded-2xl overflow-hidden card-shadow bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="w-full h-full flex items-center justify-center relative">
              {/* Thai police theme SVG */}
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">เทพเจ้าลีโอ</h2>
                  <p className="text-lg sm:text-xl opacity-90">กำลังเตรียมสอบนายสิบตำรวจ</p>
                </div>
              </div>
              <svg className="w-full h-full object-cover opacity-20" viewBox="0 0 400 225" fill="none">
                <rect width="400" height="225" fill="url(#police-gradient)"/>
                <circle cx="200" cy="112" r="40" fill="white" opacity="0.1"/>
                <rect x="180" y="80" width="40" height="60" rx="20" fill="white" opacity="0.1"/>
                <rect x="160" y="140" width="80" height="40" rx="5" fill="white" opacity="0.1"/>
                <defs>
                  <linearGradient id="police-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e40af"/>
                    <stop offset="100%" stopColor="#1e3a8a"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Main Action Section */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">เริ่มต้นการฝึกสอบจำลอง</h3>
          
          {/* Exam Configuration Card */}
          <Card className="max-w-2xl mx-auto mb-8">
            <CardContent className="pt-6 p-8">
              <h4 className="text-lg font-medium mb-6">เลือกรูปแบบการสอบ</h4>
              
              {/* Exam Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Button
                  variant={examType === "full" ? "default" : "outline"}
                  className={`p-6 h-auto flex-col ${examType === "full" ? "bg-primary-blue hover:bg-blue-500" : ""}`}
                  onClick={() => setExamType("full")}
                >
                  <div className="font-medium mb-2">สอบเต็มรูปแบบ</div>
                  <div className="text-sm opacity-80">150 ข้อ • 3 ชั่วโมง</div>
                </Button>
                
                <Button
                  variant={examType === "custom" ? "default" : "outline"}
                  className={`p-6 h-auto flex-col ${examType === "custom" ? "bg-primary-blue hover:bg-blue-500" : ""}`}
                  onClick={() => setExamType("custom")}
                >
                  <div className="font-medium mb-2">สอบแบบกำหนดเอง</div>
                  <div className="text-sm opacity-80">เลือกวิชาและจำนวนข้อ</div>
                </Button>
              </div>

              {/* Custom Exam Configuration */}
              {examType === "custom" && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {categories.map((category) => (
                      <div key={category.id} className="text-left">
                        <label className="block text-sm font-medium mb-2">{category.name}</label>
                        <Select
                          value={customConfig[category.id]?.toString() || "0"}
                          onValueChange={(value) => handleCustomConfigChange(category.id, parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">ไม่สอบ</SelectItem>
                            <SelectItem value="10">10 ข้อ</SelectItem>
                            <SelectItem value="15">15 ข้อ</SelectItem>
                            <SelectItem value="20">20 ข้อ</SelectItem>
                            <SelectItem value="25">25 ข้อ</SelectItem>
                            <SelectItem value="30">30 ข้อ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">
                      รวม: <span className="font-medium text-primary-blue">{totalCustomQuestions} ข้อ</span>
                    </span>
                  </div>
                </div>
              )}

              <Link href="/exam" onClick={handleStartExam}>
                <Button 
                  className="w-full sm:w-auto px-12 py-4 bg-primary-blue text-white text-lg font-medium hover:bg-blue-500 hover-scale"
                  disabled={examType === "custom" && totalCustomQuestions === 0}
                >
                  เริ่มสอบจำลอง
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary-blue mb-1">
                  {questions?.length || 0}
                </div>
                <div className="text-sm text-gray-600">ข้อสอบทั้งหมด</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats?.totalExams || 0}
                </div>
                <div className="text-sm text-gray-600">ครั้งที่สอบแล้ว</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {stats?.averageScore || 0}%
                </div>
                <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
