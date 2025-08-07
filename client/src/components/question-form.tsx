import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Question, InsertQuestion } from "@/lib/types";

const questionSchema = z.object({
  questionText: z.string().min(10, "คำถามต้องมีความยาวอย่างน้อย 10 ตัวอักษร"),
  option1: z.string().min(1, "กรุณากรอกตัวเลือก ก"),
  option2: z.string().min(1, "กรุณากรอกตัวเลือก ข"),
  option3: z.string().min(1, "กรุณากรอกตัวเลือก ค"),
  option4: z.string().min(1, "กรุณากรอกตัวเลือก ง"),
  correctAnswerIndex: z.number().min(0).max(3),
  explanation: z.string().min(20, "คำอธิบายต้องมีความยาวอย่างน้อย 20 ตัวอักษร"),
  category: z.string().min(1, "กรุณาเลือกหมวดวิชา"),
  difficulty: z.string().min(1, "กรุณาเลือกระดับความยาก"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  question?: Question | null;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  "ความสามารถทั่วไป",
  "ภาษาไทย", 
  "คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)",
  "ภาษาอังกฤษ",
  "สังคม วัฒนธรรม จริยธรรม และอาเซียน",
  "กฎหมายที่ประชาชนควรรู้"
];

const difficulties = ["ง่าย", "ปานกลาง", "ยาก"];

export default function QuestionForm({ question, onClose, onSuccess }: QuestionFormProps) {
  const { toast } = useToast();
  const isEditing = !!question;

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correctAnswerIndex: 0,
      explanation: "",
      category: "",
      difficulty: "ปานกลาง",
    },
  });

  useEffect(() => {
    if (question) {
      form.reset({
        questionText: question.questionText,
        option1: question.options[0] || "",
        option2: question.options[1] || "",
        option3: question.options[2] || "",
        option4: question.options[3] || "",
        correctAnswerIndex: question.correctAnswerIndex,
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty,
      });
    } else {
      form.reset({
        questionText: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswerIndex: 0,
        explanation: "",
        category: "",
        difficulty: "ปานกลาง",
      });
    }
  }, [question, form]);

  const createQuestionMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const response = await apiRequest("POST", "/api/questions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "เพิ่มข้อสอบสำเร็จ",
        description: "ข้อสอบใหม่ถูกเพิ่มเข้าระบบแล้ว",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "เพิ่มข้อสอบไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการเพิ่มข้อสอบ",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const response = await apiRequest("PUT", `/api/questions/${question?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "แก้ไขข้อสอบสำเร็จ",
        description: "ข้อมูลข้อสอบถูกอัปเดตแล้ว",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "แก้ไขข้อสอบไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการแก้ไขข้อสอบ",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    const questionData: InsertQuestion = {
      questionText: data.questionText,
      options: [data.option1, data.option2, data.option3, data.option4],
      correctAnswerIndex: data.correctAnswerIndex,
      explanation: data.explanation,
      category: data.category,
      difficulty: data.difficulty,
    };

    if (isEditing) {
      updateQuestionMutation.mutate(questionData);
    } else {
      createQuestionMutation.mutate(questionData);
    }
  };

  const isPending = createQuestionMutation.isPending || updateQuestionMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขข้อสอบ" : "เพิ่มข้อสอบใหม่"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question Text */}
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำถาม *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="กรอกคำถาม..."
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="option1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตัวเลือก ก *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="ตัวเลือก ก"
                        rows={2}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="option2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตัวเลือก ข *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="ตัวเลือก ข"
                        rows={2}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="option3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตัวเลือก ค *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="ตัวเลือก ค"
                        rows={2}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="option4"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตัวเลือก ง *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="ตัวเลือก ง"
                        rows={2}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Correct Answer */}
            <FormField
              control={form.control}
              name="correctAnswerIndex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำตอบที่ถูกต้อง *</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกคำตอบที่ถูกต้อง" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">ก</SelectItem>
                      <SelectItem value="1">ข</SelectItem>
                      <SelectItem value="2">ค</SelectItem>
                      <SelectItem value="3">ง</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมวดวิชา *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดวิชา" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.replace("คอมพิวเตอร์ (เทคโนโลยีสารสนเทศ)", "คอมพิวเตอร์")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ระดับความยาก *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกระดับความยาก" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>
                            {difficulty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Explanation */}
            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบาย *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="กรอกคำอธิบายอย่างละเอียด (อย่างน้อย 20 ตัวอักษร)..."
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 mt-1">
                    ความยาวปัจจุบัน: {field.value?.length || 0} ตัวอักษร
                  </div>
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                className="bg-primary-blue hover:bg-blue-500"
                disabled={isPending}
              >
                {isPending
                  ? isEditing
                    ? "กำลังแก้ไข..."
                    : "กำลังเพิ่ม..."
                  : isEditing
                  ? "บันทึกการแก้ไข"
                  : "เพิ่มข้อสอบ"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
