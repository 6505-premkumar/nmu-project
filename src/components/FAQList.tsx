import React, { useState, useMemo } from 'react';
import { FAQItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { deleteFAQ, voteHelpfulFAQ, seedInitialDatabaseData } from '../services/faqService';
import {
  Search,
  Plus,
  ThumbsUp,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';

interface FAQListProps {
  faqs: FAQItem[];
  onOpenCreateModal: () => void;
  onEditFAQ: (faq: FAQItem) => void;
  onOpenAIModal: () => void;
}

export const FAQList: React.FC<FAQListProps> = ({
  faqs,
  onOpenCreateModal,
  onEditFAQ,
  onOpenAIModal,
}) => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'helpful' | 'newest' | 'alpha'>('helpful');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Record<string, boolean>>({});
  const [seeding, setSeeding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Compute categories and counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: faqs.length };
    faqs.forEach((item) => {
      const cat = item.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [faqs]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).filter((c) => c !== 'all');
  }, [categoryCounts]);

  // Filter & Sort
  const filteredFaqs = useMemo(() => {
    return faqs
      .filter((faq) => {
        const matchesCategory =
          selectedCategory === 'all' || faq.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.category.toLowerCase().includes(q) ||
          faq.createdByName.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'helpful') {
          return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        }
        if (sortBy === 'alpha') {
          return a.question.localeCompare(b.question);
        }
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
  }, [faqs, searchQuery, selectedCategory, sortBy]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVote = async (id: string) => {
    if (votedIds[id]) return;
    setVotedIds((prev) => ({ ...prev, [id]: true }));
    try {
      await voteHelpfulFAQ(id, userProfile || undefined);
    } catch (e) {
      console.error('Failed to vote:', e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (faq: FAQItem) => {
    if (!userProfile) return;
    try {
      await deleteFAQ(faq.id, faq.question, userProfile);
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete FAQ:', e);
    }
  };

  const handleSeedData = async () => {
    if (!userProfile) {
      alert('Please sign in or select a demo role first to seed starter data.');
      return;
    }
    setSeeding(true);
    try {
      await seedInitialDatabaseData(userProfile);
    } catch (e) {
      console.error('Failed to seed:', e);
    } finally {
      setSeeding(false);
    }
  };

  const canEditOrDelete = (faq: FAQItem) => {
    if (!userProfile) return false;
    if (userProfile.role === 'admin') return true;
    if (userProfile.role === 'creator' && faq.createdBy === userProfile.uid) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Devpost Hero Banner */}
      <div className="bg-[#003E54] text-white rounded-lg p-5 sm:p-8 shadow-sm border border-[#002838] relative overflow-hidden">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#00EAA6] mb-1.5 flex items-center gap-2">
            <span>Customer Support Automation & Knowledge Base</span>
          </p>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Find answers, automate support queries, and synchronize live.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-teal-100/90 leading-relaxed">
            Stateless authentication, Role-Based Access Control, and real-time database synchronization powered by Cloud Firestore.
          </p>
        </div>

        {/* Large Search Input */}
        <div className="mt-5 max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by question, answer, category keywords, or author..."
                className="w-full pl-10 sm:pl-11 pr-14 py-2.5 sm:py-3 bg-white text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm rounded-md shadow-inner border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-[#00EAA6] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 sm:top-3 text-xs text-zinc-500 hover:text-zinc-800 font-semibold px-1 py-0.5 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={onOpenCreateModal}
              className="bg-[#00EAA6] hover:bg-[#00c78d] text-[#003E54] font-bold text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-md transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create FAQ</span>
            </button>
          </div>
        </div>

        {/* Hero Metadata Sub-Bar */}
        <div className="mt-4 pt-3.5 border-t border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-teal-200">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-white">Knowledge Hub:</span>
            <span className="truncate">Customer Support Operations · Real-Time Sync</span>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-[11px] sm:text-xs">
            <span className="font-mono text-teal-300">
              Total FAQs: <strong className="text-white">{faqs.length}</strong>
            </span>
            <span className="text-teal-600">|</span>
            <span className="font-mono text-teal-300">
              Categories: <strong className="text-white">{categories.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Category Scroll Bar (Shown on screens < 1024px to prevent sidebar bloat) */}
      <div className="lg:hidden bg-white p-3 rounded-md border border-[#DDE2E5] shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#008272]" /> Categories
          </span>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-zinc-700"
            >
              <option value="helpful">Most Helpful</option>
              <option value="newest">Newest First</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer transition ${
              selectedCategory === 'all'
                ? 'bg-[#003E54] text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            All ({categoryCounts['all'] || 0})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                selectedCategory === cat
                  ? 'bg-[#003E54] text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {cat} ({categoryCounts[cat]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout (Desktop: 4 cols sidebar + 8 cols feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-5">
          {/* Categories Filter Box */}
          <div className="bg-white rounded-md border border-[#DDE2E5] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
              <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#008272]" />
                Filter by Category
              </h2>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] text-[#008272] hover:underline font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#003E54] text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span>All Categories</span>
                <span className={`text-[11px] font-mono ${selectedCategory === 'all' ? 'text-teal-200' : 'text-zinc-400'}`}>
                  {categoryCounts['all'] || 0}
                </span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#003E54] text-white'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span className="truncate pr-2">{cat}</span>
                  <span className={`text-[11px] font-mono ${selectedCategory === cat ? 'text-teal-200' : 'text-zinc-400'}`}>
                    {categoryCounts[cat]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort By Box */}
          <div className="bg-white rounded-md border border-[#DDE2E5] p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 pb-2 border-b border-zinc-100 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#008272]" />
              Sort Order
            </h2>

            <div className="space-y-2 text-xs text-zinc-700 font-medium">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sortOrderDesktop"
                  checked={sortBy === 'helpful'}
                  onChange={() => setSortBy('helpful')}
                  className="text-[#003E54] focus:ring-[#00EAA6]"
                />
                <span>Most Helpful Upvotes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sortOrderDesktop"
                  checked={sortBy === 'newest'}
                  onChange={() => setSortBy('newest')}
                  className="text-[#003E54] focus:ring-[#00EAA6]"
                />
                <span>Newest Entries</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sortOrderDesktop"
                  checked={sortBy === 'alpha'}
                  onChange={() => setSortBy('alpha')}
                  className="text-[#003E54] focus:ring-[#00EAA6]"
                />
                <span>Alphabetical (A - Z)</span>
              </label>
            </div>
          </div>

          {/* Project Architecture & Spec Box */}
          <div className="bg-white rounded-md border border-[#DDE2E5] p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#008272]" />
              Project Document Specs
            </h2>
            <p className="text-xs text-zinc-600 leading-relaxed mb-3">
              Standardized Mongoose/Firestore schemas, JWT identity tokens, and automated Gemini AI question/answer pair synthesis.
            </p>

            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <button
                onClick={onOpenAIModal}
                className="w-full text-center py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-[#003E54] font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#008272]" />
                <span>AI Content Generator</span>
              </button>

              {faqs.length === 0 && (
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="w-full text-center py-2 px-3 bg-[#008272] hover:bg-[#006e60] text-white font-bold text-xs rounded transition cursor-pointer"
                >
                  {seeding ? 'Populating...' : 'Seed Starter FAQs'}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right Main Section: FAQ Project Cards */}
        <main className="lg:col-span-8 space-y-4 min-w-0">
          {/* Result Count and Active Filters Bar */}
          <div className="flex items-center justify-between text-xs text-zinc-600 pb-1">
            <div className="truncate pr-2">
              Showing <strong className="text-zinc-900">{filteredFaqs.length}</strong> of{' '}
              <strong className="text-zinc-900">{faqs.length}</strong> FAQs
              {searchQuery && (
                <span> for &ldquo;<strong className="text-zinc-900">{searchQuery}</strong>&rdquo;</span>
              )}
            </div>

            <div className="hidden sm:block text-[11px] text-zinc-400 shrink-0 font-mono">
              WebSocket Active
            </div>
          </div>

          {/* Cards List */}
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-md border border-[#DDE2E5] p-8 sm:p-10 text-center shadow-2xs">
              <Layers className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-zinc-800">
                {searchQuery ? 'No matching FAQs' : 'No FAQ articles yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery
                  ? `No FAQs matched "${searchQuery}". Try broader keywords or reset the category filter.`
                  : 'Start by populating the initial starter entries or drafting an FAQ with Gemini AI.'}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-4 py-2 bg-[#003E54] hover:bg-[#002b3a] text-white text-xs font-bold rounded cursor-pointer transition"
                >
                  {seeding ? 'Seeding...' : 'Seed College Project FAQs'}
                </button>
                <button
                  onClick={onOpenAIModal}
                  className="px-4 py-2 bg-[#00EAA6] hover:bg-[#00c78d] text-[#003E54] text-xs font-bold rounded cursor-pointer transition"
                >
                  AI Generate FAQ
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedIds[faq.id] ?? true;
                const hasVoted = votedIds[faq.id];
                const hasPermissions = canEditOrDelete(faq);

                return (
                  <article
                    key={faq.id}
                    className="bg-white rounded-md border border-[#DDE2E5] shadow-2xs hover:border-[#003E54]/30 hover:shadow-md transition overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      {/* Zero-Pill Unboxed Metadata Line */}
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2 flex-wrap">
                        <span className="font-bold text-[#008272] uppercase tracking-wider text-[11px]">
                          {faq.category}
                        </span>
                        <span aria-hidden="true" className="text-zinc-300">·</span>
                        <span>by {faq.createdByName}</span>
                        {faq.createdAt?.seconds && (
                          <>
                            <span aria-hidden="true" className="text-zinc-300">·</span>
                            <span>{new Date(faq.createdAt.seconds * 1000).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>

                      {/* Question Headline */}
                      <div
                        onClick={() => toggleExpand(faq.id)}
                        className="cursor-pointer group select-none"
                      >
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 group-hover:text-[#008272] transition leading-snug break-words">
                          {faq.question}
                        </h2>
                      </div>

                      {/* Expandable Answer Section */}
                      {isExpanded && (
                        <div className="mt-3.5 pt-3.5 border-t border-zinc-100 animate-in fade-in duration-100">
                          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line break-words">
                            {faq.answer}
                          </p>

                          {/* Card Action Row - designed for zero overlapping at any width */}
                          <div className="mt-4 pt-3.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                            {/* Upvote & Copy Box */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleVote(faq.id)}
                                disabled={hasVoted}
                                className={`px-2.5 sm:px-3 py-1.5 rounded border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                                  hasVoted
                                    ? 'bg-[#00EAA6]/20 border-[#00EAA6] text-[#003E54]'
                                    : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-[#00EAA6]/10 hover:border-[#008272] hover:text-[#008272]'
                                }`}
                                title="Vote helpful"
                              >
                                <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-[#003E54]' : ''}`} />
                                <span>Helpful</span>
                                <span className="ml-1 pl-1.5 border-l border-zinc-300 font-mono">
                                  {faq.helpfulCount || 0}
                                </span>
                              </button>

                              <button
                                onClick={() => handleCopy(faq.id, `${faq.question}\n\n${faq.answer}`)}
                                className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded transition flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                {copiedId === faq.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-medium">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Author / Permissions Controls */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              {hasPermissions ? (
                                <>
                                  <button
                                    onClick={() => onEditFAQ(faq)}
                                    className="px-2 py-1 text-zinc-600 hover:text-[#008272] hover:bg-zinc-100 rounded transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>

                                  {deleteConfirmId === faq.id ? (
                                    <div className="flex items-center gap-1 bg-rose-50 p-1 rounded border border-rose-200">
                                      <span className="text-[10px] text-rose-700 font-bold px-1">Delete?</span>
                                      <button
                                        onClick={() => handleDelete(faq)}
                                        className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded hover:bg-rose-700 cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirmId(null)}
                                        className="text-[10px] text-zinc-500 hover:text-zinc-800 px-1 cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setDeleteConfirmId(faq.id)}
                                      className="px-2 py-1 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px] text-zinc-400">
                                  {userProfile?.role === 'user' ? 'Upvote authorized' : 'Sign in to edit'}
                                </span>
                              )}

                              <button
                                onClick={() => toggleExpand(faq.id)}
                                className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition cursor-pointer ml-1"
                                title="Toggle Collapse"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
