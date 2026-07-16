import { curriculumAgent } from "@/agents/curriculum";
import { worksheetAgent } from "@/agents/worksheet";
import { quizAgent } from "@/agents/quiz";
import { teacherAgent } from "@/agents/teacher";

interface MasterRequest {
  topic: string;
}

export async function masterAgent({
  topic,
}: MasterRequest) {

  console.time("Master Agent");

  const [
    lesson,
    worksheet,
    quiz,
    teacher,
  ] = await Promise.all([
    curriculumAgent({ topic }),
    worksheetAgent({ topic }),
    quizAgent({ topic }),
    teacherAgent({ topic }),
  ]);

  console.timeEnd("Master Agent");

  return {
    lesson,
    worksheet,
    quiz,
    teacher,
  };
}