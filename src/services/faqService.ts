import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FAQItem, ActivityLog, UserProfile } from '../types';

const FAQS_COLLECTION = 'faqs';
const LOGS_COLLECTION = 'activity_logs';

export const subscribeToFAQs = (
  callback: (faqs: FAQItem[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  try {
    const q = query(
      collection(db, FAQS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items: FAQItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            question: data.question || '',
            answer: data.answer || '',
            category: data.category || 'General',
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || 'Anonymous',
            createdByEmail: data.createdByEmail || '',
            helpfulCount: data.helpfulCount || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        callback(items);
      },
      (error) => {
        console.warn('Firestore onSnapshot orderBy error, falling back to simple query:', error);
        // Fallback without orderBy in case composite index is not required
        const simpleQ = query(collection(db, FAQS_COLLECTION), limit(100));
        return onSnapshot(
          simpleQ,
          (snapshot) => {
            const items: FAQItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              items.push({
                id: docSnap.id,
                question: data.question || '',
                answer: data.answer || '',
                category: data.category || 'General',
                createdBy: data.createdBy || '',
                createdByName: data.createdByName || 'Anonymous',
                createdByEmail: data.createdByEmail || '',
                helpfulCount: data.helpfulCount || 0,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
              });
            });
            callback(items);
          },
          (fallbackErr) => {
            console.error('Firestore subscription error:', fallbackErr);
            if (onError) onError(fallbackErr);
          }
        );
      }
    );
  } catch (err: any) {
    console.error('Error setting up FAQ listener:', err);
    if (onError) onError(err);
    return () => {};
  }
};

export const subscribeToActivityLogs = (
  callback: (logs: ActivityLog[]) => void,
  maxItems: number = 20
): (() => void) => {
  try {
    const q = query(
      collection(db, LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(maxItems)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const logs: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          logs.push({
            id: docSnap.id,
            action: data.action || 'create_faq',
            title: data.title || '',
            details: data.details || '',
            userId: data.userId || '',
            userName: data.userName || 'System',
            userEmail: data.userEmail || '',
            timestamp: data.timestamp,
          });
        });
        callback(logs);
      },
      (err) => {
        console.warn('Activity logs subscription error (possibly missing index or empty):', err);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to logs:', err);
    return () => {};
  }
};

export const logActivity = async (
  action: ActivityLog['action'],
  title: string,
  details: string,
  user: { uid: string; name: string; email: string }
) => {
  try {
    await addDoc(collection(db, LOGS_COLLECTION), {
      action,
      title,
      details,
      userId: user.uid,
      userName: user.name || user.email.split('@')[0],
      userEmail: user.email,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Failed to log activity:', e);
  }
};

export const createFAQ = async (
  faq: { question: string; answer: string; category: string },
  user: UserProfile
) => {
  const docRef = await addDoc(collection(db, FAQS_COLLECTION), {
    question: faq.question.trim(),
    answer: faq.answer.trim(),
    category: faq.category.trim() || 'General',
    createdBy: user.uid,
    createdByName: user.name,
    createdByEmail: user.email,
    helpfulCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logActivity(
    'create_faq',
    'Created FAQ Entry',
    `Added FAQ: "${faq.question.slice(0, 50)}..." in [${faq.category}]`,
    user
  );

  return docRef.id;
};

export const updateFAQ = async (
  faqId: string,
  updates: { question?: string; answer?: string; category?: string },
  user: UserProfile
) => {
  const docRef = doc(db, FAQS_COLLECTION, faqId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  await logActivity(
    'update_faq',
    'Updated FAQ Entry',
    `Modified FAQ (${faqId.slice(0, 6)}...): "${(updates.question || '').slice(0, 45)}"`,
    user
  );
};

export const deleteFAQ = async (
  faqId: string,
  faqQuestion: string,
  user: UserProfile
) => {
  const docRef = doc(db, FAQS_COLLECTION, faqId);
  await deleteDoc(docRef);

  await logActivity(
    'delete_faq',
    'Deleted FAQ Entry',
    `Removed FAQ: "${faqQuestion.slice(0, 50)}..."`,
    user
  );
};

export const voteHelpfulFAQ = async (faqId: string, user?: UserProfile) => {
  const docRef = doc(db, FAQS_COLLECTION, faqId);
  await updateDoc(docRef, {
    helpfulCount: increment(1),
  });

  if (user) {
    await logActivity(
      'vote_helpful',
      'Voted Helpful',
      `Marked FAQ ${faqId.slice(0, 6)} as helpful and resolved`,
      user
    );
  }
};

export const seedInitialDatabaseData = async (user: UserProfile) => {
  const existingDocs = await getDocs(collection(db, FAQS_COLLECTION));
  if (!existingDocs.empty) {
    return false; // already populated
  }

  const seedData = [
    {
      question: 'How does Firebase Realtime Synchronization differ from traditional REST polling?',
      answer: 'Firebase uses persistent WebSocket listeners and Cloud Firestore snapshots (onSnapshot). Rather than repeatedly polling an HTTP REST endpoint at intervals, the client receives instant push notifications within milliseconds whenever a document is added, modified, or deleted.',
      category: 'Database Architecture',
      helpfulCount: 24,
    },
    {
      question: 'How do I configure custom category tags in the AI FAQ Assistant?',
      answer: 'Navigate to the FAQ Creation panel or AI Generator, enter or select custom keyword tags, and save the schema. The document is persisted with the category and categorized automatically across views.',
      category: 'Configuration',
      helpfulCount: 18,
    },
    {
      question: 'What security model protects private documentation from public adjustments?',
      answer: 'Role-Based Access Control (RBAC) enforced through Firestore Security Rules. Authenticated Content Creators can modify their own authored documents, Admins possess full CRUD capability across the system, while Public Users are strictly limited to read-only queries.',
      category: 'Security & Auth',
      helpfulCount: 31,
    },
    {
      question: 'How is JWT stateless authentication integrated with Firebase Auth tokens?',
      answer: 'Firebase Auth issues digitally signed JSON Web Tokens (JWT) containing standard claims (uid, email, role, exp). The client attaches this token in requests to verify user credentials and prevent unauthorized tamperings without needing server session state.',
      category: 'Security & Auth',
      helpfulCount: 15,
    },
    {
      question: 'How does Google Gemini AI automate FAQ drafting from customer inquiries?',
      answer: 'The system inputs recurring client inquiries or raw technical topics into Gemini 2.5 Flash. The model analyzes semantic intent and outputs structured JSON with an optimized title, concise answer, and recommended classification tag.',
      category: 'AI Automation',
      helpfulCount: 42,
    },
  ];

  for (const item of seedData) {
    await addDoc(collection(db, FAQS_COLLECTION), {
      ...item,
      createdBy: user.uid,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await logActivity(
    'create_faq',
    'Database Seed Initialized',
    'Populated starter college project FAQs with real-time Firestore synchronization',
    user
  );

  return true;
};
