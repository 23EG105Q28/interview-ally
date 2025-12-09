import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseInterviewChatOptions {
  personality?: string;
  resumeText?: string;
  targetRole?: string;
  onResponse?: (text: string) => void;
}

export const useInterviewChat = (options: UseInterviewChatOptions = {}) => {
  const { personality = "professional", resumeText, targetRole, onResponse } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");

  const sendMessage = useCallback(async (userMessage: string): Promise<string | null> => {
    if (!userMessage.trim()) return null;
    
    setIsLoading(true);
    setError(null);
    setCurrentResponse("");

    const userMsg: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          personality,
          resumeText,
          targetRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setCurrentResponse(fullResponse);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.startsWith("data: ")) {
        const jsonStr = buffer.slice(6).trim();
        if (jsonStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
            }
          } catch {
            // Ignore
          }
        }
      }

      if (fullResponse) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullResponse }]);
        onResponse?.(fullResponse);
      }

      setCurrentResponse("");
      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, personality, resumeText, targetRole, onResponse]);

  const startInterview = useCallback(async (): Promise<string | null> => {
    setMessages([]);
    setCurrentResponse("");
    setError(null);
    setIsLoading(true);

    try {
      const startPrompt = resumeText
        ? "Start the interview. Begin by acknowledging you've reviewed my resume and ask the first question based on my background."
        : "Please start the interview with your first question.";

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: startPrompt }],
          personality,
          resumeText,
          targetRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setCurrentResponse(fullResponse);
            }
          } catch {
            // Ignore
          }
        }
      }

      if (fullResponse) {
        setMessages([
          { role: "user", content: startPrompt },
          { role: "assistant", content: fullResponse },
        ]);
        onResponse?.(fullResponse);
      }

      setCurrentResponse("");
      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start interview";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [personality, resumeText, targetRole, onResponse]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentResponse("");
    setError(null);
  }, []);

  return {
    messages,
    currentResponse,
    isLoading,
    error,
    sendMessage,
    startInterview,
    resetChat,
  };
};
