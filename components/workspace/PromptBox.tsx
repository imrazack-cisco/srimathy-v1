"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RuntimeInfo {
  model?: string;
  provider?: string;
  runtime?: string;
  fallback?: boolean;
  totalLatencyMs?: number;
}

interface PromptBoxProps {
  onLessonGenerated: (lesson: string) => void;
  onWorksheetGenerated: (worksheet: string) => void;
  onQuizGenerated: (quiz: string) => void;
  onTeacherGenerated: (teacher: string) => void;
}

export default function PromptBox({
  onLessonGenerated,
  onWorksheetGenerated,
  onQuizGenerated,
  onTeacherGenerated,
}: PromptBoxProps) {
  const [prompt, setPrompt] = useState("");
  const [grade, setGrade] = useState("5");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [runtime, setRuntime] =
    useState<RuntimeInfo | null>(null);

  const [error, setError] = useState("");

  const chatRef =
    useRef<HTMLDivElement>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  // ----------------------------------------------------------
  // Auto-scroll
  // ----------------------------------------------------------

  useEffect(() => {
    if (!chatRef.current) return;

    chatRef.current.scrollTop =
      chatRef.current.scrollHeight;
  }, [messages, loading]);

  // ----------------------------------------------------------
  // Curriculum
  // ----------------------------------------------------------

  function getCurriculum() {
    return {
      grade,
      subject: "Mathematics",
      board: "NCERT",
      book:
        grade === "5"
          ? "Math Mela"
          : "Ganita Prakash",
    };
  }

  // ----------------------------------------------------------
  // Send message
  // ----------------------------------------------------------

  async function sendMessage() {
    const trimmed =
      prompt.trim();

    if (!trimmed || loading) {
      return;
    }

    setError("");

    const curriculum =
      getCurriculum();

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
    };

    const nextMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(nextMessages);

    setPrompt("");

    setLoading(true);

    try {
      console.log(
        "📩 SRIMATHY CHAT REQUEST:",
        trimmed
      );

      const res =
        await fetch(
          "/api/agent",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              agent: "master",

              prompt: trimmed,

              curriculum,

              history:
                messages,
            }),
          }
        );

      const text =
        await res.text();

      let data: any;

      try {
        data =
          JSON.parse(text);
      } catch {
        throw new Error(
          `Server returned invalid JSON (${res.status}).`
        );
      }

      if (
        !res.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "SRIMATHY generation failed."
        );
      }

      const payload =
        data.data ?? data;

      // ------------------------------------------------------
      // Runtime information
      // ------------------------------------------------------

      const runtimeInfo =
        payload.runtime ??
        data.runtime ??
        null;

      if (runtimeInfo) {
        setRuntime(runtimeInfo);
      }

      console.log(
        "🎯 SRIMATHY Runtime:",
        runtimeInfo
      );

      // ------------------------------------------------------
      // Extract generated content
      // ------------------------------------------------------

      const lessonContent =
        payload.lesson?.content ??
        payload.lesson ??
        "";

      const worksheetContent =
        payload.worksheet?.content ??
        payload.worksheet ??
        "";

      const quizContent =
        payload.quiz?.content ??
        payload.quiz ??
        "";

      const teacherContent =
        payload.teacher?.content ??
        payload.teacher ??
        "";

      // ------------------------------------------------------
      // Choose the best conversational answer
      //
      // Lesson is the primary response.
      // If unavailable, fall back to the other agents.
      // ------------------------------------------------------

      let assistantContent =
        typeof lessonContent ===
        "string"
          ? lessonContent
          : "";

      if (
        !assistantContent.trim()
      ) {
        assistantContent =
          typeof worksheetContent ===
          "string"
            ? worksheetContent
            : "";
      }

      if (
        !assistantContent.trim()
      ) {
        assistantContent =
          typeof quizContent ===
          "string"
            ? quizContent
            : "";
      }

      if (
        !assistantContent.trim()
      ) {
        assistantContent =
          typeof teacherContent ===
          "string"
            ? teacherContent
            : "";
      }

      if (
        !assistantContent.trim()
      ) {
        throw new Error(
          "SRIMATHY completed generation but returned no content."
        );
      }

      // ------------------------------------------------------
      // Add assistant message
      // ------------------------------------------------------

      setMessages(
        previous => [
          ...previous,
          {
            role: "assistant",
            content:
              assistantContent,
          },
        ]
      );

      // ------------------------------------------------------
      // Preserve existing workspace tabs
      // ------------------------------------------------------

      onLessonGenerated(
        typeof lessonContent ===
        "string"
          ? lessonContent
          : JSON.stringify(
              lessonContent,
              null,
              2
            )
      );

      onWorksheetGenerated(
        typeof worksheetContent ===
        "string"
          ? worksheetContent
          : JSON.stringify(
              worksheetContent,
              null,
              2
            )
      );

      onQuizGenerated(
        typeof quizContent ===
        "string"
          ? quizContent
          : JSON.stringify(
              quizContent,
              null,
              2
            )
      );

      onTeacherGenerated(
        typeof teacherContent ===
        "string"
          ? teacherContent
          : JSON.stringify(
              teacherContent,
              null,
              2
            )
      );
    } catch (err) {
      console.error(
        "❌ SRIMATHY chat error:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Generation failed.";

      setError(message);

      setMessages(
        previous => [
          ...previous,
          {
            role: "assistant",
            content:
              `Sorry, I couldn't generate that.\n\n${message}`,
          },
        ]
      );
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }

  // ----------------------------------------------------------
  // Keyboard behavior
  //
  // ENTER       = Send
  // SHIFT+ENTER = New line
  // ----------------------------------------------------------

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage();
    }
  }

  // ----------------------------------------------------------
  // Runtime label
  // ----------------------------------------------------------

  function runtimeLabel() {
    if (!runtime) {
      return "🤖 SRIMATHY • Ready";
    }

    const provider =
      runtime.provider
        ?.toLowerCase()
        .includes("circuit")
        ? "Cisco CIRCUIT"
        : "Ollama";

    const model =
      runtime.model &&
      runtime.model !==
        "Not yet measured"
        ? runtime.model
        : "Model";

    if (runtime.fallback) {
      return `☁️ ${provider} • ${model} • FALLBACK`;
    }

    return runtime.runtime ===
      "online"
      ? `☁️ ${provider} • ${model} • Online`
      : `🦙 ${provider} • ${model} • Local / Offline`;
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="rounded-xl bg-slate-800 shadow-xl overflow-hidden">

      {/* ======================================================
          CURRICULUM HEADER
      ====================================================== */}

      <div className="border-b border-slate-700 px-8 py-5">

        <div className="flex flex-wrap items-center gap-4">

          <label className="text-sm font-medium text-slate-300">
            NCERT Grade
          </label>

          <select
            value={grade}
            disabled={loading}
            onChange={(e) =>
              setGrade(e.target.value)
            }
            className="
              rounded-lg
              bg-slate-700
              px-4
              py-2
              text-white
              outline-none
              focus:ring-2
              focus:ring-cyan-500
            "
          >
            <option value="5">
              Grade 5 — Math Mela
            </option>

            <option value="7">
              Grade 7 — Ganita Prakash
            </option>
          </select>

          <span className="text-sm text-slate-400">
            Mathematics · NCERT
          </span>

        </div>

      </div>

      {/* ======================================================
          CHAT AREA
      ====================================================== */}

      <div
        ref={chatRef}
        className="
          h-[470px]
          overflow-y-auto
          px-6
          py-6
          space-y-6
        "
      >

        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">

            <div className="
              max-w-xl
              text-center
              text-slate-400
            ">
              <div className="mb-3 text-4xl">
                🤖
              </div>

              <div className="text-lg text-slate-300">
                Hi, I'm SRIMATHY.
              </div>

              <div className="mt-2 text-sm">
                Ask me anything about the
                selected NCERT curriculum.
              </div>

              <div className="mt-5 text-xs text-slate-500">
                Try:
                <br />
                "Explain fractions"
                <br />
                "Give me two examples"
                <br />
                "Now explain it like I'm 10"
              </div>
            </div>

          </div>
        )}

        {messages.map(
          (message, index) => {

            const isUser =
              message.role ===
              "user";

            return (
              <div
                key={index}
                className={
                  isUser
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >

                <div
                  className={
                    isUser
                      ? `
                        max-w-[70%]
                        rounded-2xl
                        rounded-tr-md
                        bg-cyan-500
                        px-5
                        py-4
                        text-slate-950
                        shadow-lg
                      `
                      : `
                        max-w-[85%]
                        rounded-2xl
                        rounded-tl-md
                        bg-slate-700
                        px-5
                        py-4
                        text-white
                        shadow-lg
                      `
                  }
                >

                  <div
                    className={
                      isUser
                        ? "mb-2 text-xs font-bold uppercase text-slate-900"
                        : "mb-2 text-xs font-bold uppercase text-cyan-300"
                    }
                  >
                    {isUser
                      ? "YOU"
                      : "🤖 SRIMATHY"}
                  </div>

                  <div className="
                    whitespace-pre-wrap
                    leading-7
                  ">
                    {message.content}
                  </div>

                </div>

              </div>
            );
          }
        )}

        {loading && (
          <div className="flex justify-start">

            <div className="
              rounded-2xl
              rounded-tl-md
              bg-slate-700
              px-5
              py-4
              text-cyan-300
            ">
              🤖 SRIMATHY is thinking
              <span className="animate-pulse">
                ...
              </span>
            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          INPUT
      ====================================================== */}

      <div className="
        border-t
        border-slate-700
        p-5
      ">

        <div className="flex gap-3">

          <textarea
            ref={textareaRef}
            value={prompt}
            disabled={loading}
            onChange={(e) =>
              setPrompt(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            className="
              min-h-[88px]
              max-h-[180px]
              flex-1
              resize-none
              rounded-xl
              bg-slate-700
              px-5
              py-4
              text-white
              outline-none
              placeholder:text-slate-400
              focus:ring-2
              focus:ring-cyan-500
            "
          />

          <button
            onClick={sendMessage}
            disabled={
              loading ||
              !prompt.trim()
            }
            className="
              self-end
              rounded-xl
              bg-cyan-500
              px-6
              py-4
              text-xl
              font-bold
              text-slate-950
              hover:bg-cyan-400
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            ➤
          </button>

        </div>

        {/* KEYBOARD HELP */}

        <div className="
          mt-2
          text-xs
          text-slate-500
        ">
          Enter to send · Shift+Enter for new line
        </div>

        {/* ERROR */}

        {error && (
          <div className="
            mt-3
            rounded-lg
            bg-red-950/40
            px-4
            py-3
            text-sm
            text-red-300
          ">
            ⚠️ {error}
          </div>
        )}

        {/* ====================================================
            LIVE RUNTIME FOOTER
        ==================================================== */}

        <div className="
          mt-3
          flex
          items-center
          justify-between
          gap-3
          text-xs
        ">

          <span className="text-slate-500">
            {runtimeLabel()}
          </span>

          {runtime?.totalLatencyMs != null && (
            <span className="text-slate-500">
              {Math.round(
                runtime.totalLatencyMs
              )} ms
            </span>
          )}

        </div>

      </div>

    </div>
  );
}