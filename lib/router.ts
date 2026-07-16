import { curriculumAgent } from "@/agents/curriculum";
import { worksheetAgent } from "@/agents/worksheet";
import { AgentType } from "@/types/agent";

interface RouterRequest {
  agent: AgentType;
  prompt?: string;
  lesson?: string;
}

export async function routeAgent(request: RouterRequest) {
  switch (request.agent) {

    case "curriculum":
      return curriculumAgent({
        topic: request.prompt || "",
      });

    case "worksheet":
      return worksheetAgent({
        lesson: request.lesson || "",
      });

    default:
      throw new Error("Unknown agent");
  }
}