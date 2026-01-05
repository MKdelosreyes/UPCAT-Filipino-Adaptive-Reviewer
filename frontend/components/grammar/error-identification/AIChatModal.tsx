"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendChatMessage, ChatRequest } from "@/lib/api/ai-service";

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sentence: string;
  correctAnswer: string;
  explanation: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatModal({
  isOpen,
  onClose,
  sentence,
  correctAnswer,
  explanation,
}: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when modal opens/closes or sentence changes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInputMessage("");
      setError(null);
    } else {
      // Add welcome message when modal opens
      setMessages([
        {
          role: "assistant",
          content: `Kumusta! Magtanong ako tungkol sa grammar error sa pangungusap na ito. Ano ang gusto mong malaman?`,
        },
      ]);
    }
  }, [isOpen, sentence]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setError(null);

    // Add user message to chat
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare chat request
      const chatRequest: ChatRequest = {
        conversation_history: newMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        word: correctAnswer,
        correct_answer: correctAnswer,
        definition: explanation,
        example: sentence,
        context_type: "grammar",
      };

      // Call AI service
      const response = await sendChatMessage(chatRequest);

      // Add AI response to chat
      setMessages([
        ...newMessages,
        { role: "assistant", content: response.response },
      ]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(
        "Hindi makuha ang sagot mula sa AI. Subukan ulit sa ilang sandali."
      );

      // Add error message to chat
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Paumanhin, may problema sa koneksyon. Subukan ulit ang tanong mo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 h-full"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b text-red-950 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">AI Assistant</h3>
                  <p className="text-xs text-gray-600">
                    Tungkol sa:{" "}
                    <span className="font-semibold">Grammar Error</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-gray-100">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex justify-center">
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Magtanong tungkol sa grammar error..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-2 text-red-950 border-2 border-red-950/50 rounded-lg hover:border-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send • Conversation resets after exercise
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
