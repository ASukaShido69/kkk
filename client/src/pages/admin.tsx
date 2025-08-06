import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import QuestionForm from "@/components/question-form";
import CsvImport from "@/components/csv-import";
import type { Question } from "@/lib/types";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(true);
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับสู่ระบบจัดการ",
      });
    },
    onError: () => {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive",
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", { category: categoryFilter, difficulty: difficultyFilter, search: searchQuery }],
    enabled: isAuthenticated,
  });

  const { data: scores } = useQuery({
    queryKey: ["/api/scores"],
    enabled: isAuthenticated,
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "ลบข้อสอบสำเร็จ",
        description: "ข้อสอบถูกลบออกจากระบบแล้ว",
      });
    },
    onError: () => {
      toast({
        title: "ลบข้อสอบไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการลบข้อสอบ",
        variant: "destructive",
      });
    },
  });

  const exportScoresMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/scores/export");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam_scores_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ไฟล์ CSV ถูกดาวน์โหลดแล้ว",
      });
    },
    onError: () => {
      toast({
        title: "ส่งออกข้อมูลไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการส่งออกข้อมูล",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginForm({ username: "", password: "" });
    toast({
      title: "ออกจากระบบแล้ว",
      description: "ขออำลาครับ!",
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm("คุณแน่ใจหรือไม่ที่จะลบข้อสอบนี้?")) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "ง่าย":
        return "bg-green-100 text-green-800";
      case "ปานกลาง":
        return "bg-yellow-100 text-yellow-800";
      case "ยาก":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ];
    return colors[category.length % colors.length];
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center">เข้าสู่ระบบจัดการ</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ชื่อผู้ใช้</label>
                <Input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="admin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">รหัสผ่าน</label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="leo2568"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary-blue hover:bg-blue-500"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/">
                <Button variant="outline">กลับหน้าหลัก</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-secondary-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <Button variant="ghost" className="text-primary-blue font-bold text-xl">
                Leo Exam 2568
              </Button>
            </Link>
            <div className="flex space-x-4">
              <Link href="/">
                <Button variant="ghost">หน้าหลัก</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">จัดการระบบ</h1>
          <p className="text-gray-600 mt-1">Dashboard สำหรับจัดการข้อสอบและดูสถิติ</p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary-blue bg-opacity-10 rounded-lg mr-4">
                  <span className="text-primary-blue text-2xl">📚</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats?.totalQuestions || 0}
                  </div>
                  <div className="text-sm text-gray-600">ข้อสอบทั้งหมด</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <span className="text-green-600 text-2xl">✅</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats?.totalExams || 0}
                  </div>
                  <div className="text-sm text-gray-600">การสอบทั้งหมด</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <span className="text-yellow-600 text-2xl">📊</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats?.averageScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <span className="text-red-600 text-2xl">⏱️</span>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {stats?.averageTime ? `${Math.floor(stats.averageTime / 60)}:${(stats.averageTime % 60).toString().padStart(2, '0')}` : "0:00"}
                  </div>
                  <div className="text-sm text-gray-600">เวลาเฉลี่ย (นาที)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">จัดการข้อสอบ</TabsTrigger>
            <TabsTrigger value="scores">จัดการผลคะแนน</TabsTrigger>
            <TabsTrigger value="import">นำเข้าข้อมูล</TabsTrigger>
          </TabsList>

          {/* Questions Management Tab */}
          <TabsContent value="questions" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="ค้นหาข้อสอบ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="เลือกวิชา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกวิชา</SelectItem>
                      <SelectItem value="ความสามารถทั่วไป">ความสามารถทั่วไป</SelectItem>
                      <SelectItem value="ภาษาไทย">ภาษาไทย</SelectItem>
                      <SelectItem value="คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)">คอมพิวเตอร์</SelectItem>
                      <SelectItem value="ภาษาอังกฤษ">ภาษาอังกฤษ</SelectItem>
                      <SelectItem value="สังคม วัฒนธรรม จริยธรรม และอาเซียน">สังคม วัฒนธรรม</SelectItem>
                      <SelectItem value="กฎหมายที่ประชาชนควรรู้">กฎหมาย</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-full md:w-32">
                      <SelectValue placeholder="ระดับความยาก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกระดับ</SelectItem>
                      <SelectItem value="ง่าย">ง่าย</SelectItem>
                      <SelectItem value="ปานกลาง">ปานกลาง</SelectItem>
                      <SelectItem value="ยาก">ยาก</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowQuestionForm(true);
                    }}
                    className="bg-primary-blue hover:bg-blue-500"
                  >
                    เพิ่มข้อสอบ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions Table */}
            <Card>
              <CardContent className="pt-6">
                {questionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mx-auto"></div>
                    <p className="mt-2 text-gray-600">กำลังโหลดข้อสอบ...</p>
                  </div>
                ) : questions && questions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-secondary-gray">
                        <tr>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">คำถาม</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">หมวดวิชา</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">ความยาก</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">การกระทำ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-gray">
                        {questions.map((question) => (
                          <tr key={question.id}>
                            <td className="py-4 text-sm text-gray-800 max-w-md">
                              <div className="truncate" title={question.questionText}>
                                {question.questionText}
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge className={getCategoryColor(question.category)}>
                                {question.category.replace("คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", "คอมพิวเตอร์")}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditQuestion(question)}
                                  className="text-xs"
                                >
                                  แก้ไข
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="text-xs text-red-600 hover:text-red-700"
                                  disabled={deleteQuestionMutation.isPending}
                                >
                                  ลบ
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    ไม่พบข้อสอบที่ตรงกับเงื่อนไขการค้นหา
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scores Management Tab */}
          <TabsContent value="scores" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>ประวัติผลคะแนนทั้งหมด</CardTitle>
                  <Button
                    onClick={() => exportScoresMutation.mutate()}
                    disabled={exportScoresMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {exportScoresMutation.isPending ? "กำลังส่งออก..." : "ส่งออก CSV"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scores && scores.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-secondary-gray">
                        <tr>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">วันที่</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">ประเภทการสอบ</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">คะแนนรวม</th>
                          <th className="text-left py-3 text-sm font-medium text-gray-600">เวลาที่ใช้</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-gray">
                        {scores.map((score) => {
                          const scorePercentage = Math.round((score.correctAnswers / score.totalQuestions) * 100);
                          const examDate = new Date(score.dateTaken || 0);
                          
                          return (
                            <tr key={score.id}>
                              <td className="py-4 text-sm text-gray-800">
                                {examDate.toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-4 text-sm text-gray-600">
                                {score.examType} ({score.totalQuestions} ข้อ)
                              </td>
                              <td className="py-4 text-sm font-medium text-primary-blue">
                                {scorePercentage}% ({score.correctAnswers}/{score.totalQuestions})
                              </td>
                              <td className="py-4 text-sm text-gray-600">
                                {Math.floor(score.timeSpent / 60)}:{(score.timeSpent % 60).toString().padStart(2, '0')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    ยังไม่มีประวัติการสอบ
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Import Data Tab */}
          <TabsContent value="import">
            <CsvImport />
          </TabsContent>
        </Tabs>

        {/* Question Form Modal */}
        {showQuestionForm && (
          <QuestionForm
            question={editingQuestion}
            onClose={() => {
              setShowQuestionForm(false);
              setEditingQuestion(null);
            }}
            onSuccess={() => {
              setShowQuestionForm(false);
              setEditingQuestion(null);
              queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
              queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            }}
          />
        )}
      </div>
    </div>
  );
}
