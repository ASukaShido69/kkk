import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";
import type { ImportResult } from "@/lib/types";

export default function CsvImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Import failed');
      }
      
      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      toast({
        title: "นำเข้าข้อมูลสำเร็จ",
        description: `นำเข้าข้อสอบได้ ${result.success} ข้อ${result.errors > 0 ? `, พบข้อผิดพลาด ${result.errors} ข้อ` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: "นำเข้าข้อมูลไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการประมวลผลไฟล์ CSV",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์ CSV เท่านั้น",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "ไฟล์ต้องมีขนาดไม่เกิน 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>นำเข้าข้อสอบจาก CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CSV Format Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">รูปแบบไฟล์ CSV ที่ถูกต้อง:</div>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• คอลัมน์: subject, question, option_a, option_b, option_c, option_d, correct_answer, explanation</li>
                  <li>• correct_answer: ใช้ตัวอักษร a, b, c, d</li>
                  <li>• subject: ความสามารถทั่วไป, ภาษาไทย, คอมพิวเตอร์, ภาษาอังกฤษ เป็นต้น</li>
                  <li>• ไฟล์ต้องมี header row และมีข้อมูลครบทุกคอลัมน์</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-primary-blue bg-blue-50"
                : selectedFile
                ? "border-green-400 bg-green-50"
                : "border-secondary-gray hover:border-primary-blue"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              id="csv-file-input"
              disabled={importMutation.isPending}
            />
            
            <div className="space-y-4">
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <div className="text-lg font-medium text-green-800">
                    ไฟล์ที่เลือก: {selectedFile.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    ขนาด: {(selectedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div className="text-lg font-medium text-gray-600">
                    เลือกไฟล์ CSV หรือลากไฟล์มาวางที่นี่
                  </div>
                  <div className="text-sm text-gray-500">
                    รองรับไฟล์ .csv ขนาดไม่เกิน 10MB
                  </div>
                </div>
              )}
              
              <label
                htmlFor="csv-file-input"
                className="inline-flex items-center px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-500 cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                {selectedFile ? "เลือกไฟล์อื่น" : "เลือกไฟล์"}
              </label>
            </div>
          </div>

          {/* Import Progress */}
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">กำลังนำเข้าข้อมูล...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <div className="text-xs text-gray-600 text-center">
                กรุณารอสักครู่ ระบบกำลังประมวลผลไฟล์ของคุณ
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <Alert className={importResult.errors === 0 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              {importResult.errors === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">ผลการนำเข้าข้อมูล:</div>
                  <ul className="text-sm space-y-1">
                    <li className="text-green-700">✓ นำเข้าสำเร็จ: {importResult.success} ข้อ</li>
                    {importResult.errors > 0 && (
                      <li className="text-yellow-700">⚠️ พบข้อผิดพลาด: {importResult.errors} ข้อ</li>
                    )}
                    <li className="text-blue-700">📊 อัปเดตระบบเรียบร้อยแล้ว</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={importMutation.isPending}
            >
              รีเซ็ต
            </Button>
            
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {importMutation.isPending
                ? "กำลังนำเข้า..."
                : "เริ่มนำเข้าข้อมูล"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample CSV Format */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวอย่างรูปแบบไฟล์ CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs text-gray-800 whitespace-pre">
{`subject,question,option_a,option_b,option_c,option_d,correct_answer,explanation
ความสามารถทั่วไป,"ถ้า 2x + 5 = 17 แล้วค่าของ x คือเท่าใด?",5,6,7,8,b,"แก้สมการ: 2x = 17 - 5 = 12 → x = 12/2 = 6"
ภาษาไทย,"คำว่า ""สุจริต"" หมายถึงอะไร?",ซื่อสัตย์,ขี้โกง,ขี้โมโห,ขี้อาย,a,"""สุจริต"" หมายถึง ซื่อสัตย์ ไม่ทุจริต"`}
            </pre>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <div className="font-medium mb-1">หมายเหตุ:</div>
            <ul className="space-y-1 ml-4">
              <li>• บรรทัดแรกต้องเป็น header</li>
              <li>• ใช้เครื่องหมายคำพูด (") สำหรับข้อความที่มีเครื่องหมายจุลภาค</li>
              <li>• correct_answer ใช้ตัวอักษรพิมพ์เล็ก a, b, c, d</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
