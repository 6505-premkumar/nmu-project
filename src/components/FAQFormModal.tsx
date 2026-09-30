import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createFAQ, updateFAQ } from '../services/faqService';
import { FAQItem } from '../types';
import { X, Save, AlertCircle, FileText } from 'lucide-react';

interface FAQFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  faqToEdit?: FAQItem | null;
  initialTopic?: { question: string; answer: string; category: string } | null;
  onSuccess?: () => void;
}

const COMMON_CATEGORIES = [
  'General',
  'Architecture & Design',
  'Database Architecture',
  'Security & Auth',
  'AI Automation',
  'Configuration',
  'Performance & Scaling',
];

export const FAQFormModal: React.FC<FAQFormModalProps> = ({
  isOpen,
  onClose,
  faqToEdit,
  initialTopic,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (faqToEdit) {
      setQuestion(faqToEdit.question);
      setAnswer(faqToEdit.answer);
      if (COMMON_CATEGORIES.includes(faqToEdit.category)) {
        setCategory(faqToEdit.category);
        setIsCustomCat(false);
      } else {
        setIsCustomCat(true);
        setCustomCategory(faqToEdit.category);
      }
    } else if (initialTopic) {
      setQuestion(initialTopic.question);
      setAnswer(initialTopic.answer);
      if (COMMON_CATEGORIES.includes(initialTopic.category)) {
        setCategory(initialTopic.category);
        setIsCustomCat(false);
      } else {
        setIsCustomCat(true);
        setCustomCategory(initialTopic.category);
      }
    } else {
      setQuestion('');
      setAnswer('');
      setCategory('General');
      setCustomCategory('');
      setIsCustomCat(false);
    }
  }, [faqToEdit, initialTopic, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      setError('You must be signed in to create or edit FAQs.');
      return;
    }
    if (!question.trim() || !answer.trim()) {
      setError('Both Question and Answer fields are required.');
      return;
    }

    const finalCategory = isCustomCat ? (customCategory.trim() || 'General') : category;
    setLoading(true);
    setError(null);

    try {
      if (faqToEdit) {
        await updateFAQ(faqToEdit.id, {
          question: question.trim(),
          answer: answer.trim(),
          category: finalCategory,
        }, userProfile);
      } else {
        await createFAQ({
          question: question.trim(),
          answer: answer.trim(),
          category: finalCategory,
        }, userProfile);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save FAQ to Firestore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Devpost-style Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#003E54] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#00EAA6]" />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {faqToEdit ? 'Edit FAQ Article' : 'Create FAQ Article'}
              </h3>
              <p className="text-xs text-teal-200/90">
                Synchronizes in real time to Cloud Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white rounded hover:bg-[#002C3D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Question Title
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How do I configure custom category tags?"
              className="w-full px-3.5 py-2.5 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <div className="flex gap-2">
              <select
                value={isCustomCat ? 'custom' : category}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomCat(true);
                  } else {
                    setIsCustomCat(false);
                    setCategory(e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Custom Category...</option>
              </select>

              {isCustomCat && (
                <input
                  type="text"
                  placeholder="Category Name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded border border-[#008272] bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54]"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Answer / Solution Details
            </label>
            <textarea
              required
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a clear, helpful resolution..."
              className="w-full px-3.5 py-2.5 text-sm rounded border border-zinc-300 bg-white text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-[#003E54] resize-y"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-[#003E54] bg-[#00EAA6] hover:bg-[#00c78d] disabled:opacity-50 rounded shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : faqToEdit ? 'Save Changes' : 'Publish FAQ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
