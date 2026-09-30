import React, { useEffect, useState } from 'react';
import { ActivityLog } from '../types';
import { subscribeToActivityLogs } from '../services/faqService';
import {
  Activity,
  PlusCircle,
  Edit,
  Trash2,
  Sparkles,
  LogIn,
  ThumbsUp,
  Clock,
  User,
  Radio
} from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToActivityLogs((newLogs) => {
      setLogs(newLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getActionIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create_faq':
        return <div className="p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"><PlusCircle className="w-4 h-4" /></div>;
      case 'update_faq':
        return <div className="p-2 rounded bg-blue-50 text-blue-700 border border-blue-200"><Edit className="w-4 h-4" /></div>;
      case 'delete_faq':
        return <div className="p-2 rounded bg-rose-50 text-rose-700 border border-rose-200"><Trash2 className="w-4 h-4" /></div>;
      case 'generate_ai_faq':
        return <div className="p-2 rounded bg-teal-50 text-teal-800 border border-teal-200"><Sparkles className="w-4 h-4" /></div>;
      case 'vote_helpful':
        return <div className="p-2 rounded bg-amber-50 text-amber-800 border border-amber-200"><ThumbsUp className="w-4 h-4" /></div>;
      case 'user_login':
        return <div className="p-2 rounded bg-[#003E54]/10 text-[#003E54] border border-[#003E54]/20"><LogIn className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded bg-zinc-100 text-zinc-700"><Activity className="w-4 h-4" /></div>;
    }
  };

  const sanitizeText = (text?: string) => {
    if (!text) return '';
    return text.replace(/Priya Sharma/gi, 'Priya').replace(/\bSharma\b/gi, '').replace(/\s+/g, ' ').trim();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Devpost-style Header Banner */}
      <div className="bg-[#003E54] text-white rounded-lg p-6 sm:p-8 shadow-sm border border-[#002838] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-[#00EAA6]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Cloud Firestore Live Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Real-Time Audit & Mutation Feed
          </h1>
          <p className="mt-1 text-sm text-teal-100/90 max-w-xl">
            Live database events streamed directly to all connected browser sessions through WebSocket listeners.
          </p>
        </div>

        <div className="bg-[#002838] px-3.5 py-2 rounded border border-teal-500/20 text-right shrink-0">
          <span className="text-[10px] text-teal-200/70 uppercase font-bold tracking-wider block">
            Listener Status
          </span>
          <span className="text-xs font-mono font-bold text-[#00EAA6]">
            ● onSnapshot Active
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-md border border-[#DDE2E5] shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-600">
          <span>Recent Activity Stream ({logs.length})</span>
          <span className="text-[11px] text-zinc-400 font-normal">
            Multi-tab synchronized
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-zinc-400">
            Connecting to Firestore stream...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs text-zinc-600 font-bold">No activity recorded yet</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Add an FAQ or click Helpful to generate real-time audit records.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex items-start gap-4 hover:bg-[#F4F6F8] transition"
              >
                {getActionIcon(log.action)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-sm font-bold text-zinc-900 truncate">
                      {log.title}
                    </h2>

                    {log.timestamp?.seconds && (
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 shrink-0 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(log.timestamp.seconds * 1000).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed mb-2">
                    {sanitizeText(log.details)}
                  </p>

                  {/* Zero-Pill Unboxed Metadata */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="font-semibold text-zinc-800">{sanitizeText(log.userName)}</span>
                    <span aria-hidden="true" className="text-zinc-300">·</span>
                    <span className="font-mono text-zinc-500 truncate">{log.userEmail?.replace(/priya/i, 'admin')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
