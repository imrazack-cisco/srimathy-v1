import { curriculumAgent } from "@/agents/curriculum";
import { worksheetAgent } from "@/agents/worksheet";
import { quizAgent } from "@/agents/quiz";
import { teacherAgent } from "@/agents/teacher";

export interface MasterRequest {
  topic: string;
}

export interface MasterResponse {
  lesson: {
    title: string;
    content: string;
  };
  worksheet: {
    content: string;
  };
  quiz: {
    content: string;
  };
  teacher: {
    content: string;
  };
}

export async function masterAgent(
  request: MasterRequest
): Promise<MasterResponse> {

  console.log("\n======================================");
  console.log("🚀 SRIMATHY MASTER AGENT");
  console.log("======================================");
  console.log("📚 Topic:", request.topic);

  const lesson = await curriculumAgent({
    topic: request.topic,
  });

  const worksheet = await worksheetAgent({
    topic: request.topic,
  });

  const quiz = await quizAgent({
    topic: request.topic,
  });

  const teacher = await teacherAgent({
    topic: request.topic,
  });

  console.log("\n=========== OUTPUT SIZES ===========");
  console.log("Lesson     :", lesson.content.length);
  console.log("Worksheet  :", worksheet.content.length);
  console.log("Quiz       :", quiz.content.length);
  console.log("Teacher    :", teacher.content.length);
  console.log("====================================\n");

  return {
    lesson,
    worksheet,
    quiz,
    teacher,
  };
}