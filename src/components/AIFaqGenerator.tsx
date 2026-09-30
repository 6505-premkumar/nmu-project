import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createFAQ } from '../services/faqService';
import { AIGeneratedFAQResult } from '../types';
import {
  Sparkles,
  Send,
  Save,
  Edit3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface AIFaqGeneratorProps {
  onSavedSuccessfully?: () => void;
  onEditBeforeSave?: (data: { question: string; answer: string; category: string }) => void;
}

const SAMPLE_TOPICS = [
  'Mongoose schema indexing validation runtime workflow optimization',
  'How do I configure custom category tags in settings?',
  'JWT stateless token authorization header verification lifecycle',
  'Role-Based Access Control matrix for Admin vs Creator vs User',
  'Centralized error handling and response status sanitization in Express',
  'Database permission layers protecting private documentation from public adjustments',
];

export const AIFaqGenerator: React.FC<AIFaqGeneratorProps> = ({
  onSavedSuccessfully,
  onEditBeforeSave,
}) => {
  const { userProfile, currentUser } = useAuth();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIGeneratedFAQResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleGenerate = async (selectedTopic?: string) => {
    const finalTopic = (selectedTopic || topic).trim();
    if (!finalTopic) {
      setError('Please provide a topic or prompt for AI generation.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/ai/generate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: finalTopic }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error ${response.status}`);
      }

      const data: AIGeneratedFAQResult = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message || 'Failed to generate FAQ with AI');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToFirestore = async () => {
    if (!result) return;
    if (!userProfile) {
      setError('Please sign in or choose a demo role to save FAQs to Firestore.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createFAQ({
        question: result.generatedQuestion,
        answer: result.generatedAnswer,
        category: result.generatedCategory,
      }, userProfile);

      setSavedSuccess(true);
      if (onSavedSuccessfully) onSavedSuccessfully();
    } catch (err: any) {
      setError(err.message || 'Failed to save to Firestore');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Devpost-style Header Banner */}
      <div className="bg-[#003E54] text-white rounded-lg p-6 sm:p-8 shadow-sm border border-[#002838]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00EAA6] mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Gemini 2.5 Flash Inference Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AI-Powered FAQ Generation
        </h1>
        <p className="mt-2 text-sm text-teal-100/90 leading-relaxed max-w-2xl">
          Automates the drafting of technical support answers and schema categorization directly into Cloud Firestore as described in the AI FAQ Assistant project documentation.
        </p>

        {/* Suggested Topic Chips */}
        <div className="mt-5 pt-4 border-t border-teal-800/60">
          <p className="text-xs font-bold text-teal-200 mb-2.5 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#00EAA6]" />
            Suggested Topics from Syllabus:
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TOPICS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(sample);
                  handleGenerate(sample);
                }}
                className="text-left text-xs bg-[#002C3D] hover:bg-[#00222F] text-teal-100 hover:text-white px-3 py-1.5 rounded border border-teal-500/20 transition cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-md border border-[#DDE2E5] p-5 sm:p-6 shadow-2xs">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
          Topic / User Inquiry Query
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerate();
            }}
            placeholder="e.g. Mongoose schema indexing validation runtime workflow optimization..."
            className="flex-1 px-4 py-2.5 text-sm rounded border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#003E54] transition"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={loading || !topic.trim()}
            className="px-6 py-2.5 bg-[#00EAA6] hover:bg-[#00c78d] disabled:opacity-50 text-[#003E54] font-bold text-xs uppercase tracking-wider rounded transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate FAQ</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Generated Result Preview Card */}
      {result && (
        <div className="bg-white rounded-md border border-[#008272]/40 shadow-md p-6 space-y-5 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 text-xs">
            {/* Zero-Pill Unboxed Metadata */}
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="font-bold text-[#008272] uppercase tracking-wider">
                {result.generatedCategory}
              </span>
              <span aria-hidden="true" className="text-zinc-300">·</span>
              <span>Generated by Gemini 2.5 Flash</span>
              <span aria-hidden="true" className="text-zinc-300">·</span>
              <span>Ready for Review</span>
            </div>

            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validated JSON Schema
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Synthesized Question
            </span>
            <h3 className="text-lg font-bold text-zinc-900">
              {result.generatedQuestion}
            </h3>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Technical Answer
            </span>
            <div className="text-sm text-zinc-700 leading-relaxed bg-[#F4F6F8] p-4 rounded border border-zinc-200 whitespace-pre-line">
              {result.generatedAnswer}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              {savedSuccess ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Successfully persisted to Cloud Firestore collection (/faqs)!
                </span>
              ) : (
                <span>Review and commit to real-time database</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onEditBeforeSave && (
                <button
                  type="button"
                  onClick={() =>
                    onEditBeforeSave({
                      question: result.generatedQuestion,
                      answer: result.generatedAnswer,
                      category: result.generatedCategory,
                    })
                  }
                  className="px-4 py-2 text-xs font-bold rounded border border-zinc-300 hover:bg-zinc-100 text-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit in Modal</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePublishToFirestore}
                disabled={saving || savedSuccess}
                className="px-5 py-2 text-xs font-bold text-white bg-[#008272] hover:bg-[#006e60] disabled:opacity-50 rounded shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : savedSuccess ? 'Published' : 'Publish to Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
