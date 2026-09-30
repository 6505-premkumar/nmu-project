import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FAQList } from './components/FAQList';
import { AIFaqGenerator } from './components/AIFaqGenerator';
import { GeminiChatbot } from './components/GeminiChatbot';
import { ActivityFeed } from './components/ActivityFeed';
import { ProjectWorkbench } from './components/ProjectWorkbench';
import { AuthModal } from './components/AuthModal';
import { FAQFormModal } from './components/FAQFormModal';
import { subscribeToFAQs } from './services/faqService';
import { FAQItem } from './types';

const MainContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'faqs' | 'ai' | 'chat' | 'activity' | 'architecture'>('faqs');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState<FAQItem | null>(null);
  const [aiDraftToEdit, setAiDraftToEdit] = useState<{ question: string; answer: string; category: string } | null>(null);

  // Subscribe to real-time Cloud Firestore FAQs
  useEffect(() => {
    const unsubscribe = subscribeToFAQs((incomingFaqs) => {
      setFaqs(incomingFaqs);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenCreate = () => {
    setFaqToEdit(null);
    setAiDraftToEdit(null);
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsFAQModalOpen(true);
  };

  const handleEditFAQ = (faq: FAQItem) => {
    setFaqToEdit(faq);
    setAiDraftToEdit(null);
    setIsFAQModalOpen(true);
  };

  const handleEditFromAIDraft = (draft: { question: string; answer: string; category: string }) => {
    setFaqToEdit(null);
    setAiDraftToEdit(draft);
    setIsFAQModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] flex flex-col font-sans selection:bg-[#00EAA6] selection:text-[#003E54]">
      {/* Devpost-style Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openCreateModal={handleOpenCreate}
        liveFaqCount={faqs.length}
      />

      {/* Main Content Area (Responsive width & paddings) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'faqs' && (
          <FAQList
            faqs={faqs}
            onOpenCreateModal={handleOpenCreate}
            onEditFAQ={handleEditFAQ}
            onOpenAIModal={() => setActiveTab('ai')}
          />
        )}

        {activeTab === 'chat' && <GeminiChatbot />}

        {activeTab === 'ai' && (
          <AIFaqGenerator
            onSavedSuccessfully={() => setActiveTab('faqs')}
            onEditBeforeSave={handleEditFromAIDraft}
          />
        )}

        {activeTab === 'activity' && <ActivityFeed />}

        {activeTab === 'architecture' && <ProjectWorkbench faqs={faqs} />}
      </div>

      {/* Devpost-style Footer */}
      <footer className="border-t border-[#DDE2E5] bg-white py-6 text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#003E54]">
              AI FAQ Assistant
            </span>
            <span>·</span>
            <span>Customer Support Automation</span>
            <span>·</span>
            <span>College Project Specifications</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[#008272]">
              <span className="w-2 h-2 rounded-full bg-[#00EAA6] inline-block"></span>
              Cloud Firestore Real-Time Database Connected
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-500">Google Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <FAQFormModal
        isOpen={isFAQModalOpen}
        onClose={() => {
          setIsFAQModalOpen(false);
          setFaqToEdit(null);
          setAiDraftToEdit(null);
        }}
        faqToEdit={faqToEdit}
        initialTopic={aiDraftToEdit}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
