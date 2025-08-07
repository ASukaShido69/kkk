import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import ScoreChart from "@/components/score-chart";
import type { Score } from "@/lib/types";

export default function ProfilePage() {
  const [scoreLimit, setScoreLimit] = useState("5");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const filteredScores = scores?.slice(0, parseInt(scoreLimit)) || [];
  
  const calculateStats = () => {
    if (!scores || scores.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        bestScore: 0,
        studyStreak: 0,
        categoryStats: {},
      };
    }

    const totalExams = scores.length;
    const averageScore = Math.round(
      scores.reduce((sum, score) => sum + (score.correctAnswers / score.totalQuestions), 0) / totalExams * 100
    );
    const bestScore = Math.max(
      ...scores.map(score => Math.round((score.correctAnswers / score.totalQuestions) * 100))
    );

    // Calculate study streak (consecutive days)
    const studyStreak = calculateStudyStreak(scores);

    // Calculate category statistics
    const categoryStats: Record<string, { correct: number; total: number; percentage: number }> = {};
    
    scores.forEach(score => {
      if (score.categoryBreakdown) {
        Object.entries(score.categoryBreakdown).forEach(([category, breakdown]) => {
          if (!categoryStats[category]) {
            categoryStats[category] = { correct: 0, total: 0, percentage: 0 };
          }
          categoryStats[category].correct += breakdown.correct;
          categoryStats[category].total += breakdown.total;
        });
      }
    });

    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.percentage = Math.round((stats.correct / stats.total) * 100);
    });

    return {
      totalExams,
      averageScore,
      bestScore,
      studyStreak,
      categoryStats,
    };
  };

  const calculateStudyStreak = (scores: Score[]): number => {
    if (!scores || scores.length === 0) return 0;
    
    const sortedDates = scores
      .map(score => new Date(score.dateTaken || 0).toDateString())
      .sort()
      .reverse();
    
    const uniqueDates = Array.from(new Set(sortedDates));
    let streak = 0;
    let currentDate = new Date();
    
    for (const dateStr of uniqueDates) {
      const examDate = new Date(dateStr);
      const diffTime = currentDate.getTime() - examDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= streak + 1) {
        streak++;
        currentDate = examDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const userStats = calculateStats();

  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getPassStatus = (score: number) => {
    return score >= 60 ? "ผ่าน" : "ไม่ผ่าน";
  };

  const getPassStatusColor = (score: number) => {
    return score >= 60 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
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
              <Link href="/admin">
                <Button variant="ghost">จัดการ</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">โปรไฟล์ของคุณ</h1>
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary-blue mb-2">
                {userStats.totalExams}
              </div>
              <div className="text-sm text-gray-600">ครั้งที่สอบทั้งหมด</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {userStats.averageScore}%
              </div>
              <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {userStats.bestScore}%
              </div>
              <div className="text-sm text-gray-600">คะแนนสูงสุด</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {userStats.studyStreak}
              </div>
              <div className="text-sm text-gray-600">วันติดต่อกัน</div>
            </CardContent>
          </Card>
        </div>

        {/* Score History Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>ประวัติคะแนน</CardTitle>
              <div className="flex space-x-2">
                <Select value={scoreLimit} onValueChange={setScoreLimit}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 ครั้งล่าสุด</SelectItem>
                    <SelectItem value="10">10 ครั้งล่าสุด</SelectItem>
                    <SelectItem value="20">20 ครั้งล่าสุด</SelectItem>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกวิชา</SelectItem>
                    <SelectItem value="ความสามารถทั่วไป">ความสามารถทั่วไป</SelectItem>
                    <SelectItem value="ภาษาไทย">ภาษาไทย</SelectItem>
                    <SelectItem value="คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)">คอมพิวเตอร์</SelectItem>
                    <SelectItem value="ภาษาอังกฤษ">ภาษาอังกฤษ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ScoreChart scores={filteredScores} />
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance and Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>ผลการเรียนแต่ละวิชา</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(userStats.categoryStats).map(([category, stats]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm truncate flex-1 mr-4" title={category}>
                      {category.replace("คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", "คอมพิวเตอร์")}
                    </span>
                    <div className="flex items-center">
                      <Progress value={stats.percentage} className="w-24 mr-3" />
                      <span className="text-sm font-medium text-primary-blue w-12 text-right">
                        {stats.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
                
                {Object.keys(userStats.categoryStats).length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    ยังไม่มีข้อมูลการสอบ
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>เป้าหมาย</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">คะแนนเป้าหมาย</span>
                    <span className="text-lg font-bold text-primary-blue">80%</span>
                  </div>
                  <Progress value={Math.min((userStats.averageScore / 80) * 100, 100)} className="mb-2" />
                  <div className="text-xs text-gray-600">
                    {userStats.averageScore >= 80 
                      ? "ถึงเป้าหมายแล้ว! 🎉" 
                      : `อีก ${80 - userStats.averageScore}% เท่านั้น`}
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${
                  userStats.studyStreak >= 7 
                    ? "bg-green-50 border-green-200" 
                    : "bg-gray-50 border-gray-200"
                }`}>
                  <div className="flex items-center">
                    <span className={userStats.studyStreak >= 7 ? "text-green-600" : "text-gray-600"}>
                      {userStats.studyStreak >= 7 ? "✓" : "⏰"}
                    </span>
                    <span className={`ml-2 font-medium ${
                      userStats.studyStreak >= 7 ? "text-green-600" : "text-gray-600"
                    }`}>
                      สอบติดต่อกัน {userStats.studyStreak} วัน
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">📚</span>
                    <span className="text-blue-600 font-medium">
                      รวมฝึกสอบ {userStats.totalExams} ครั้งแล้ว
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle>ประวัติการสอบล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-secondary-gray">
                  <tr>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">วันที่</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">ประเภท</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">คะแนน</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">เวลาที่ใช้</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-gray">
                  {scores && scores.length > 0 ? (
                    scores.slice(0, 10).map((score) => {
                      const scorePercentage = Math.round((score.correctAnswers / score.totalQuestions) * 100);
                      const examDate = new Date(score.dateTaken || 0);
                      
                      return (
                        <tr key={score.id}>
                          <td className="py-3 text-sm text-gray-800">
                            {examDate.toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 text-sm text-gray-600">{score.examType}</td>
                          <td className="py-3 text-sm font-medium text-primary-blue">
                            {scorePercentage}%
                          </td>
                          <td className="py-3 text-sm text-gray-600">
                            {formatTimeSpent(score.timeSpent)}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPassStatusColor(scorePercentage)}`}>
                              {getPassStatus(scorePercentage)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        ยังไม่มีประวัติการสอบ
                        <div className="mt-4">
                          <Link href="/">
                            <Button>เริ่มทำข้อสอบ</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
