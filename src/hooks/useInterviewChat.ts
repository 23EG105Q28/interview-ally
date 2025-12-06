import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseInterviewChatOptions {
  personality?: string;
  onResponse?: (text: string) => void;
}

export const useInterviewChat = (options: UseInterviewChatOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState("");

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;
    
    const newUserMessage: Message = { role: "user", content: userMessage };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);
    setCurrentResponse("");

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          personality: options.personality || "professional",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullResponse = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.startsWith(":") || line.trim() === "") continue;
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
            // Incomplete JSON, will try next chunk
          }
        }
      }

      const assistantMessage: Message = { role: "assistant", content: fullResponse };
      setMessages([...updatedMessages, assistantMessage]);
      setCurrentResponse("");
      
      if (options.onResponse) {
        options.onResponse(fullResponse);
      }
      
      return fullResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      console.error("Interview chat error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, options.personality, options.onResponse]);

  const startInterview = useCallback(async () => {
    setMessages([]);
    setError(null);
    
    // Send initial message to start the interview
    return sendMessage("Hello, I'm ready to begin the interview.");
  }, [sendMessage]);

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
