"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, Send, CheckCircle2, Search } from "lucide-react";
import { GeneratedQuestion } from "@/lib/types";
import { useAuthSession } from "@/components/AuthSessionProvider";
import { useToast } from "@/components/ToastProvider";

export default function QuestionsPage() {
  const { session } = useAuthSession();
  const { addToast } = useToast();
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadPostCount();
    loadExistingQuestions();
  }, []);

  const loadPostCount = async () => {
    try {
      const response = await fetch("/api/posts?limit=1");
      const data = await response.json();
      setPostCount(data.total || 0);
    } catch (error) {
      console.error("Error loading post count:", error);
    }
  };

  const loadExistingQuestions = async () => {
    try {
      const res = await fetch("/api/questions");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Error loading existing questions:", error);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return q.question.toLowerCase().includes(query);
  });

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setIsItemsDropdownOpen(false);
  };

  const generateQuestions = async (useMock: boolean = false) => {
    setIsGenerating(true);
    try {
      const endpoint = useMock ? "/api/questions/generate-mock" : "/api/questions/generate";
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        addToast({
          description: `Generated ${data.questions.length} questions.\nSaved to: ${data.filename}`,
          variant: "success",
        });
      } else {
        addToast({ description: `Error: ${data.error}`, variant: "error" });
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      addToast({ description: "Error generating questions. Check console for details.", variant: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const sendToBackend = async () => {
    const selected = questions.filter((q) => q.selected);

    if (selected.length === 0) {
      addToast({ description: "Please select at least one question", variant: "warning" });
      return;
    }

    const accessToken = session?.access_token;

    if (!accessToken) {
      addToast({
        description:
          "Please connect your wallet and complete sign-in before sending questions to the backend.",
        variant: "warning",
      });
      return;
    }

    setIsSending(true);
    try {
      const { sendQuestionsToBackend, validateApiConfig } = await import("@/lib/backendApi");

      const configValidation = validateApiConfig();
      if (!configValidation.isValid) {
        addToast({
          description: `API Configuration Error\n\n${configValidation.errors.join("\n")}`,
          variant: "error",
        });
        setIsSending(false);
        return;
      }

      const response = await sendQuestionsToBackend(selected, accessToken);

      const successMessage =
        `Successfully sent ${selected.length} question${selected.length > 1 ? "s" : ""} to backend.` +
        (response.message ? `\nMessage: ${response.message}` : "");

      addToast({ description: successMessage, variant: "success" });
    } catch (error: unknown) {
      const { BackendApiError, formatApiError } = await import("@/lib/backendApi");

      if (error instanceof BackendApiError) {
        addToast({ description: formatApiError(error), variant: "error" });
      } else {
        const message = error instanceof Error ? error.message : "Unknown error";
        addToast({ description: `Unexpected Error\n\n${message}`, variant: "error" });
      }
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = questions.filter((q) => q.selected).length;
  const allSelected = questions.length > 0 && selectedCount === questions.length;

  const handleSelectAllToggle = () => {
    const nextSelected = !allSelected;
    setQuestions((prev) => prev.map((q) => ({ ...q, selected: nextSelected })));
  };

  return (
    <div className="w-full h-full text-white flex flex-col overflow-hidden">
      <header className="flex items-center justify-between mb-6 mt-1">
        <div>
          <div className="flex items-center gap-1">
            <div className="flex items-center justify-center w-[24.75px] h-[27.5px]">
              <Image src="/vector.svg" alt="Generate icon" width={20} height={20} priority />
            </div>
            <h1 className="text-[26px] font-semibold tracking-[0.04em]">Generate Questions</h1>
          </div>
          <p className="text-[16px] text-[#B0B3E4] text-[var(--app-text-muted)] mt-1">
            AI-powered 24h prediction questions
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--app-text-muted)]">
          <div className="flex flex-col items-end text-right mr-1">
            <span className="text-[23px] text-white">{postCount}</span>
            <span className="text-[16px] font-semibold">Available posts</span>
          </div>
          <button
            onClick={() => generateQuestions(false)}
            disabled={isGenerating || postCount === 0}
            className="btn-primary-glow px-3.5 py-2 mr-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-[15px] leading-[20px] text-[#FFF2B9] text-center align-middle font-[var(--font-ibm-plex-condensed)] [text-shadow:0px_1px_2.3px_rgba(0,0,0,0.25)]">
                  Generate with AI
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      <div className="w-full border-b border-[#333168] opacity-100 mb-5" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-normal text-[21px] leading-[1] text-[#F2F3FF] font-[var(--font-ibm-plex-condensed)]">
          Questions ({selectedCount}/{questions.length} selected)
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSelectAllToggle}
            className="px-3 py-1 rounded-full bg-[#241f57] border border-[#34316b] text-[11px] text-white hover:bg-[#292567]"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>

          <div className="btn-outline-gradient">
            <button
              onClick={sendToBackend}
              disabled={isSending || selectedCount === 0}
              className="btn-outline-inner px-4 py-2 rounded-[11.5px] text-[11px] font-semibold text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send to Backend
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Search pill */}
        <div className="flex items-center gap-2 px-4 h-[46px] w-[624px] max-w-full rounded-[40px] bg-white/9 border border-white/10 text-xs">
          <Search className="w-4 h-4 text-[var(--app-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search questions..."
            className="bg-transparent border-none outline-none text-[11px] text-white placeholder:text-[var(--app-text-muted)] w-full"
          />
        </div>

        {filteredQuestions.length > 0 && (
          <div className="flex items-center gap-3 ml-4 text-xs text-[var(--app-text-muted)] relative">
            {/* Custom Show: N per page pill with dropdown */}
            <button
              type="button"
              onClick={() => setIsItemsDropdownOpen((open) => !open)}
              className="flex items-center justify-between px-4 h-[46px] w-[151px] rounded-[40px] bg-white/9 border border-white/10 text-[11px] text-white hover:bg-white/15 transition-colors whitespace-nowrap"
            >
              <span>Show: {itemsPerPage} per page</span>
              <span className="text-[10px] ml-2">▾</span>
            </button>

            {isItemsDropdownOpen && (
              <div className="absolute left-0 top-[48px] z-20 w-[151px] rounded-[24px] bg-[#17153a] border border-white/10 shadow-lg overflow-hidden text-[11px] text-white">
                {[10, 20, 50, 100].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleItemsPerPageChange(opt)}
                    className={`w-full px-4 py-2 text-left hover:bg-white/10 ${
                      itemsPerPage === opt ? "bg-white/15" : ""
                    }`}
                  >
                    {opt} per page
                  </button>
                ))}
              </div>
            )}

            {/* Range pill: 1-20 of N */}
            <div className="flex items-center justify-center px-3 h-[46px] w-[100px] rounded-[40px] bg-white/9 border border-white/10 text-[11px] text-white">
              <span>
                {filteredQuestions.length === 0
                  ? "0-0 of 0"
                  : `${startIndex + 1}-${Math.min(endIndex, filteredQuestions.length)} of ${filteredQuestions.length}`}
              </span>
            </div>
          </div>
        )}
      </div>

      <section className="bg-[#1e1b52] rounded-2xl px-5 py-4 text-xs text-[var(--app-text-muted)] flex-1 flex flex-col min-h-0">
        {filteredQuestions.length > 10 && (
          <div className="flex items-center justify-between mb-3 text-[11px]">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)} of {filteredQuestions.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-full bg-[#241f57] border border-[#34316b] text-white disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-[11px]">Page {currentPage}/{totalPages}</span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-full bg-[#241f57] border border-[#34316b] text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden mt-2">
          <div className="h-[500px] overflow-y-auto border border-[#34316b] rounded-xl bg-[#221f54]">
            <table className="w-full text-left text-[12px] text-[var(--app-text-muted)] border-separate border-spacing-0">
              <thead className="sticky top-0 bg-[#252264] z-10">
                <tr>
                  <th className="w-10 px-4 py-2"></th>
                  <th className="px-2 py-2 text-white font-medium">Question</th>
                  <th className="w-24 px-2 py-2 text-right font-medium">Sources</th>
                </tr>
              </thead>
              <tbody>
                {currentQuestions.map((q) => (
                  <tr
                    key={q.id}
                    className={
                      q.selected
                        ? "bg-[#1fb077]/10 hover:bg-[#1fb077]/20 cursor-pointer"
                        : "hover:bg-[#292567] cursor-pointer"
                    }
                    onClick={() => toggleQuestion(q.id)}
                  >
                    <td className="px-4 py-2 align-top">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[11px] ${
                          q.selected
                            ? "bg-[#1fb077] border-[#1fb077] text-indigo-950"
                            : "border-[#6366f1] text-transparent"
                        }`}
                      >
                        {q.selected && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <p className="text-[13px] text-white leading-snug">{q.question}</p>
                    </td>
                    <td className="px-2 py-2 align-top text-right">
                      <span className="text-[11px] text-[var(--app-text-muted)]">
                        {q.sourceIds.length} sources
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
