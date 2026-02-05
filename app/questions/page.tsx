'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { GeneratedQuestion } from '@/lib/types';
import SourceBadge from '@/components/SourceBadge';
import { useAuthSession } from '@/components/AuthSessionProvider';

export default function QuestionsPage() {
  const { session } = useAuthSession();
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    loadPostCount();
    loadExistingQuestions();
  }, []);

  const loadPostCount = async () => {
    try {
      const response = await fetch('/api/posts?limit=1'); // Just get the count
      const data = await response.json();
      setPostCount(data.total || 0);
    } catch (error) {
      console.error('Error loading post count:', error);
    }
  };

  const loadExistingQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error loading existing questions:', error);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const generateQuestions = async (useMock: boolean = false) => {
    setIsGenerating(true);
    try {
      const endpoint = useMock ? '/api/questions/generate-mock' : '/api/questions/generate';
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        alert(`✅ Generated ${data.questions.length} questions!\n\nSaved to: ${data.filename}`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setQuestions(prev => {
      const next = prev.map(q =>
        q.id === id ? { ...q, selected: !q.selected } : q
      );

      const updated = next.find(q => q.id === id);
      if (updated) {
        // Persist selection to backend (best-effort, async)
        fetch('/api/questions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, selected: updated.selected }),
        }).catch(() => {});
      }

      return next;
    });
  };

  const sendToBackend = async () => {
    const selected = questions.filter(q => q.selected);
    
    if (selected.length === 0) {
      alert('⚠️ Please select at least one question');
      return;
    }

    const accessToken = session?.access_token;

    if (!accessToken) {
      alert('⚠️ Please connect your wallet and complete sign-in before sending questions to the backend.');
      return;
    }

    setIsSending(true);
    try {
      const { sendQuestionsToBackend, formatApiError, BackendApiError, validateApiConfig } = await import('@/lib/backendApi');
      
      const configValidation = validateApiConfig();
      if (!configValidation.isValid) {
        alert(`⚠️ API Configuration Error\n\n${configValidation.errors.join('\n')}`);
        setIsSending(false);
        return;
      }

      const response = await sendQuestionsToBackend(selected, accessToken);
      
      const successMessage = 
        `✅ Successfully sent ${selected.length} question${selected.length > 1 ? 's' : ''} to backend!\n\n` +
        (response.message ? `Message: ${response.message}\n\n` : '') +
        (response.data ? `Response:\n${JSON.stringify(response.data, null, 2)}` : '');
      
      alert(successMessage);
    } catch (error: any) {
      const { BackendApiError, formatApiError } = await import('@/lib/backendApi');
      
      if (error instanceof BackendApiError) {
        alert(formatApiError(error));
      } else {
        alert(`❌ Unexpected Error\n\n${error.message}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const selectedCount = questions.filter(q => q.selected).length;

  return (
    <div className="min-h-screen p-4 bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 p-1.5">
            <Sparkles className="w-full h-full text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Generate Questions</h1>
            <p className="text-xs text-gray-400">AI-powered 24h prediction questions</p>
          </div>
        </div>

        {/* Generation Controls - Compact */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="mb-4">
            <div className="text-gray-400 text-sm mb-2">Available posts: <strong className="text-white">{postCount}</strong></div>
            {postCount === 0 && (
              <div className="text-yellow-400 text-sm">
                ⚠️ No posts available. Please scrape data first from the Dashboard.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => generateQuestions(false)}
              disabled={isGenerating || postCount === 0}
              className="px-5 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </button>

            <button
              onClick={() => generateQuestions(true)}
              disabled={isGenerating || postCount === 0}
              className="px-5 py-3 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              Generate Mock (Testing)
            </button>
          </div>
        </div>

        {/* Questions List - Compact */}
        {questions.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">
                Questions ({selectedCount}/{questions.length} selected)
              </h2>
              <button
                onClick={sendToBackend}
                disabled={isSending || selectedCount === 0}
                className="px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-sm"
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

            {/* Pagination controls */}
            {questions.length > 10 && (
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  <span className="ml-2">
                    Showing {startIndex + 1}-{Math.min(endIndex, questions.length)} of {questions.length}
                  </span>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-gray-400">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {currentQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    q.selected
                      ? 'bg-green-900/30 border-green-600 hover:bg-green-900/40'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      q.selected 
                        ? 'bg-green-600 border-green-600' 
                        : 'border-gray-600'
                    }`}>
                      {q.selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{q.question}</p>
                      <div className="text-xs text-gray-600 mt-1">
                        {q.sourceIds.length} sources
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
