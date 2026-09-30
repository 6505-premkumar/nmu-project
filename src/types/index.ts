export type UserRole = 'admin' | 'creator' | 'user' | 'public';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  avatarUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdBy: string;
  createdByName: string;
  createdByEmail: string;
  helpfulCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface ActivityLog {
  id: string;
  action: 'create_faq' | 'update_faq' | 'delete_faq' | 'generate_ai_faq' | 'user_login' | 'vote_helpful';
  title: string;
  details: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: any;
}

export interface CategorySummary {
  name: string;
  count: number;
  description: string;
}

export interface AIGeneratedFAQResult {
  topic: string;
  generatedQuestion: string;
  generatedAnswer: string;
  generatedCategory: string;
  generatedAt: string;
}
