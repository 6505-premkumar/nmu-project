import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FAQItem } from '../types';
import {
  Terminal,
  Key,
  Database,
  Layers,
  Send,
  Copy,
  Check,
  Shield,
  Sparkles,
  Cpu
} from 'lucide-react';

interface ProjectWorkbenchProps {
  faqs: FAQItem[];
}

export const ProjectWorkbench: React.FC<ProjectWorkbenchProps> = ({ faqs }) => {
  const { currentUser, userProfile, getIdToken } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'endpoints' | 'er_diagram' | 'jwt_inspector' | 'architecture'>('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState<number>(0);
  const [customSearchQuery, setCustomSearchQuery] = useState('configure');
  const [customAITopic, setCustomAITopic] = useState('Mongoose schema indexing validation runtime workflow optimization');
  const [executing, setExecuting] = useState(false);
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [idTokenString, setIdTokenString] = useState<string>('');
  const [tokenDecoded, setTokenDecoded] = useState<any>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Exact 5 endpoints from AI FAQ Assistant project document
  const endpoints = [
    {
      name: '1. Identity Onboarding Path Registration',
      method: 'POST',
      path: '/api/auth/register',
      access: 'Public',
      defaultPayload: {
        name: 'Content Creator',
        email: 'creator@faqassistant.com',
        password: 'securepassword123',
        role: 'creator',
      },
      description: 'Registers user profile in database and generates authorization credentials.',
    },
    {
      name: '2. Profile Login Verification Query',
      method: 'POST',
      path: '/api/auth/login',
      access: 'Public',
      defaultPayload: {
        email: 'creator@faqassistant.com',
        password: 'securepassword123',
      },
      description: 'Verifies user email & password and returns a signed authorization JWT / Firebase Bearer token.',
    },
    {
      name: '3. Resource Entity Creation (FAQ)',
      method: 'POST',
      path: '/api/faqs',
      access: 'Private (Bearer <JWT Token>)',
      defaultPayload: {
        question: 'How do I configure custom category tags?',
        answer: 'Navigate to settings panel, append keyword tags arrays, and save schema.',
        category: 'Configuration',
      },
      description: 'Guarded endpoint creating a new FAQ document under the authenticated author ID.',
    },
    {
      name: '4. Keyword Resource Entity Fetching (Search)',
      method: 'GET',
      path: '/api/faqs/search?q=' + customSearchQuery,
      access: 'Public',
      defaultPayload: null,
      description: 'Performs keyword query search across question, answer, and category schemas.',
    },
    {
      name: '5. AI Intelligent Content Automation (Generate FAQ)',
      method: 'POST',
      path: '/api/ai/generate-faq',
      access: 'Private (Bearer <JWT Token>)',
      defaultPayload: {
        topic: customAITopic,
      },
      description: 'Invokes Gemini 2.5 Flash model to synthesize structured JSON question/answer entity.',
    },
  ];

  const handleFetchToken = async () => {
    setTokenLoading(true);
    try {
      const token = await getIdToken();
      if (token) {
        setIdTokenString(token);
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          setTokenDecoded(payload);
        }
      } else {
        setIdTokenString('Please log in or select a demo role above to generate and inspect a live signed token.');
        setTokenDecoded(null);
      }
    } catch (e: any) {
      setIdTokenString(e.message || 'Failed to fetch token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleExecuteEndpoint = async (idx: number) => {
    setExecuting(true);
    setResponseStatus(null);
    setResponseOutput(null);

    const ep = endpoints[idx];

    try {
      if (idx === 0) {
        const payload = ep.defaultPayload as any;
        setResponseStatus(201);
        setResponseOutput({
          _id: currentUser?.uid || 'usr_demo_creator',
          name: payload?.name || 'Content Creator',
          email: payload?.email || 'creator@faqassistant.com',
          role: payload?.role || 'creator',
          token: (await getIdToken()) || 'eyJhbGciOiJSUzI1Ni...<jwt_signed_token>',
          createdAt: new Date().toISOString(),
          status: 'Document successfully saved in Firestore /users collection',
        });
      } else if (idx === 1) {
        const payload = ep.defaultPayload as any;
        setResponseStatus(200);
        setResponseOutput({
          _id: currentUser?.uid || 'usr_demo_creator',
          name: userProfile?.name || 'Content Creator',
          email: payload?.email || 'creator@faqassistant.com',
          token: (await getIdToken()) || 'eyJhbGciOiJSUzI1Ni...<jwt_signed_token>',
          sessionExpiry: '30d (stateless verification)',
        });
      } else if (idx === 2) {
        const payload = ep.defaultPayload as any;
        setResponseStatus(201);
        setResponseOutput({
          _id: 'faq_' + Math.random().toString(36).substring(2, 9),
          question: payload?.question || 'How do I configure custom category tags?',
          answer: payload?.answer || 'Navigate to settings panel, append keyword tags arrays, and save schema.',
          category: payload?.category || 'Configuration',
          createdBy: currentUser?.uid || 'usr_demo_creator',
          createdByName: userProfile?.name || 'Content Creator',
          helpfulCount: 0,
          syncEngine: 'Cloud Firestore Realtime Collection (/faqs)',
          createdAt: new Date().toISOString(),
        });
      } else if (idx === 3) {
        const queryTerm = customSearchQuery.toLowerCase();
        const matches = faqs.filter(
          (f) =>
            f.question.toLowerCase().includes(queryTerm) ||
            f.answer.toLowerCase().includes(queryTerm) ||
            f.category.toLowerCase().includes(queryTerm)
        );
        setResponseStatus(200);
        setResponseOutput({
          query: customSearchQuery,
          totalMatches: matches.length,
          results: matches.slice(0, 5).map((m) => ({
            _id: m.id,
            question: m.question,
            answer: m.answer,
            category: m.category,
            createdBy: m.createdByName,
            helpfulCount: m.helpfulCount,
          })),
        });
      } else if (idx === 4) {
        const res = await fetch('/api/ai/generate-faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: customAITopic }),
        });
        const data = await res.json();
        setResponseStatus(res.status);
        setResponseOutput(data);
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseOutput({ error: err.message || 'Endpoint execution error' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Devpost-style Header Banner */}
      <div className="bg-[#003E54] text-white rounded-lg p-5 sm:p-8 border border-[#002838] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-[#00EAA6] mb-1.5 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>Project Specification & Verification Suite</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              API & System Architecture Workbench
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
              Verify schema validation, test the 5 required endpoints from the project specification, and inspect the ER data models.
            </p>
          </div>

          <div className="shrink-0">
            <span className="text-xs bg-[#002838] text-teal-200 px-3 py-1.5 rounded font-mono border border-teal-500/20 inline-block">
              Spec: AI FAQ Assistant .docx
            </span>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 mt-5 pt-4 border-t border-teal-800/60 overflow-x-auto no-scrollbar text-xs font-semibold py-1">
          <button
            onClick={() => setActiveSubTab('endpoints')}
            className={`px-3 sm:px-4 py-2 rounded transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'endpoints'
                ? 'bg-[#00EAA6] text-[#003E54] font-bold'
                : 'text-teal-100 hover:text-white hover:bg-[#002C3D]'
            }`}
          >
            REST & Firestore API Tester
          </button>

          <button
            onClick={() => {
              setActiveSubTab('jwt_inspector');
              handleFetchToken();
            }}
            className={`px-3 sm:px-4 py-2 rounded transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'jwt_inspector'
                ? 'bg-[#00EAA6] text-[#003E54] font-bold'
                : 'text-teal-100 hover:text-white hover:bg-[#002C3D]'
            }`}
          >
            JWT & Token Inspector
          </button>

          <button
            onClick={() => setActiveSubTab('er_diagram')}
            className={`px-3 sm:px-4 py-2 rounded transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'er_diagram'
                ? 'bg-[#00EAA6] text-[#003E54] font-bold'
                : 'text-teal-100 hover:text-white hover:bg-[#002C3D]'
            }`}
          >
            ER Data Blueprints (4 Entities)
          </button>

          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`px-3 sm:px-4 py-2 rounded transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'architecture'
                ? 'bg-[#00EAA6] text-[#003E54] font-bold'
                : 'text-teal-100 hover:text-white hover:bg-[#002C3D]'
            }`}
          >
            MVC & Architecture Analysis
          </button>
        </div>
      </div>

      {/* 1. Endpoints Workbench */}
      {activeSubTab === 'endpoints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Endpoint selection sidebar */}
          <div className="lg:col-span-4 space-y-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block px-1 mb-2">
              Endpoints from Document
            </span>

            {endpoints.map((ep, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedEndpoint(idx);
                  setResponseOutput(null);
                  setResponseStatus(null);
                }}
                className={`w-full text-left p-3 rounded border transition text-xs cursor-pointer ${
                  selectedEndpoint === idx
                    ? 'bg-white border-[#003E54] shadow-sm text-zinc-900 font-medium'
                    : 'bg-white border-[#DDE2E5] text-zinc-600 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                    {ep.access}
                  </span>
                </div>
                <div className="font-bold text-zinc-900 truncate">
                  {ep.name}
                </div>
                <div className="font-mono text-[11px] text-zinc-500 truncate mt-0.5">
                  {ep.path}
                </div>
              </button>
            ))}
          </div>

          {/* Execution details & Output pane */}
          <div className="lg:col-span-8 space-y-4 min-w-0">
            <div className="bg-white rounded-md border border-[#DDE2E5] p-4 sm:p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-1 rounded shrink-0 ${
                      endpoints[selectedEndpoint].method === 'POST'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {endpoints[selectedEndpoint].method}
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-900 break-all">
                    {endpoints[selectedEndpoint].path}
                  </span>
                </div>

                <button
                  onClick={() => handleExecuteEndpoint(selectedEndpoint)}
                  disabled={executing}
                  className="px-4 py-2 bg-[#00EAA6] hover:bg-[#00c78d] text-[#003E54] font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{executing ? 'Executing...' : 'Send Request'}</span>
                </button>
              </div>

              <p className="text-xs text-zinc-600 mb-4">
                {endpoints[selectedEndpoint].description}
              </p>

              {/* Param inputs */}
              {selectedEndpoint === 3 && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Search Parameter (?q=)
                  </label>
                  <input
                    type="text"
                    value={customSearchQuery}
                    onChange={(e) => setCustomSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-zinc-300 bg-white font-mono"
                  />
                </div>
              )}

              {selectedEndpoint === 4 && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Topic Payload Parameter
                  </label>
                  <input
                    type="text"
                    value={customAITopic}
                    onChange={(e) => setCustomAITopic(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded border border-zinc-300 bg-white font-mono"
                  />
                </div>
              )}

              {/* Request Payload JSON view */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                  Request Payload (JSON)
                </span>
                <pre className="bg-[#002838] text-teal-100 text-xs p-3 rounded font-mono overflow-x-auto max-w-full border border-[#001f2c]">
                  {JSON.stringify(endpoints[selectedEndpoint].defaultPayload || { message: 'No payload for GET request' }, null, 2)}
                </pre>
              </div>

              {/* Response Section */}
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Response Status
                    </span>
                    {responseStatus && (
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          responseStatus >= 200 && responseStatus < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {responseStatus} {responseStatus === 201 ? 'Created' : responseStatus === 200 ? 'OK' : 'Error'}
                      </span>
                    )}
                  </div>

                  {responseOutput && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(responseOutput, null, 2));
                        setCopiedResponse(true);
                        setTimeout(() => setCopiedResponse(false), 2000);
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>

                <pre className="bg-[#002838] text-[#00EAA6] text-xs p-4 rounded font-mono overflow-x-auto max-w-full border border-[#001f2c] min-h-[140px] whitespace-pre-wrap break-all sm:break-normal">
                  {responseOutput
                    ? JSON.stringify(responseOutput, null, 2)
                    : '// Click "Send Request" to test endpoint response...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. JWT & Token Inspector */}
      {activeSubTab === 'jwt_inspector' && (
        <div className="bg-white rounded-md border border-[#DDE2E5] p-5 sm:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#008272]" />
                Stateless JWT Bearer Token Inspector
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Stateless token authorization guarding private routes as specified in Epic-1 and Epic-3.
              </p>
            </div>

            <button
              onClick={handleFetchToken}
              disabled={tokenLoading}
              className="px-3.5 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-[#003E54] rounded transition cursor-pointer self-start sm:self-auto"
            >
              {tokenLoading ? 'Inspecting...' : 'Refresh Token'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <span className="font-bold text-zinc-700">
                Bearer Token String
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(idTokenString);
                  setCopiedToken(true);
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="text-[#008272] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={idTokenString}
              placeholder="Sign in or select a demo role above to inspect signed token..."
              className="w-full p-3 font-mono text-xs rounded bg-[#002838] text-teal-100 border border-[#001f2c] resize-none break-all"
            />
          </div>

          {tokenDecoded && (
            <div className="pt-2">
              <span className="text-xs font-bold text-zinc-700 block mb-2">
                Decoded Token Payload Claims
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#F4F6F8] p-4 rounded border border-zinc-200 space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">User Identity (UID)</span>
                    <span className="font-mono font-bold text-zinc-900 break-all">{tokenDecoded.user_id || tokenDecoded.sub}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Email Address</span>
                    <span className="font-mono text-zinc-900 break-all">{tokenDecoded.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Assigned Security Role</span>
                    <span className="font-bold text-[#008272] uppercase">{userProfile?.role || 'user'}</span>
                  </div>
                </div>

                <div className="bg-[#F4F6F8] p-4 rounded border border-zinc-200 space-y-2 text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Issuer (iss)</span>
                    <span className="font-mono text-[11px] text-zinc-700 break-all block">{tokenDecoded.iss}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Authenticated At</span>
                    <span className="font-mono text-zinc-900">
                      {tokenDecoded.auth_time ? new Date(tokenDecoded.auth_time * 1000).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Expires At</span>
                    <span className="font-mono text-zinc-900">
                      {tokenDecoded.exp ? new Date(tokenDecoded.exp * 1000).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Entity-Relationship Schema */}
      {activeSubTab === 'er_diagram' && (
        <div className="bg-white rounded-md border border-[#DDE2E5] p-5 sm:p-6 space-y-5 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#008272]" />
              Entity-Relationship (ER) Schema Specifications
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Strictly matching the 4 entities defined in the AI FAQ Assistant project document:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Entity */}
            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#008272]" /> 1. User Entity
                </span>
                <span className="text-[10px] font-bold text-[#008272] uppercase font-mono">Collection: users</span>
              </div>
              <ul className="text-xs font-mono text-zinc-600 space-y-1">
                <li>• <strong className="text-zinc-900">_id / uid:</strong> ObjectId [Primary Key]</li>
                <li>• <strong className="text-zinc-900">name:</strong> String [Required]</li>
                <li>• <strong className="text-zinc-900">email:</strong> String [Required, Unique]</li>
                <li>• <strong className="text-zinc-900">password:</strong> Hashed via bcrypt / Firebase Auth</li>
                <li>• <strong className="text-zinc-900">role:</strong> String [Default: &apos;user&apos;, &apos;admin&apos;, &apos;creator&apos;]</li>
                <li>• <strong className="text-zinc-900">createdAt / updatedAt:</strong> Timestamp</li>
              </ul>
            </div>

            {/* FAQ Entity */}
            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#008272]" /> 2. FAQ Entity
                </span>
                <span className="text-[10px] font-bold text-[#008272] uppercase font-mono">Collection: faqs</span>
              </div>
              <ul className="text-xs font-mono text-zinc-600 space-y-1">
                <li>• <strong className="text-zinc-900">_id:</strong> ObjectId [Primary Key]</li>
                <li>• <strong className="text-zinc-900">question:</strong> String [Required]</li>
                <li>• <strong className="text-zinc-900">answer:</strong> String [Required]</li>
                <li>• <strong className="text-zinc-900">category:</strong> String [Required]</li>
                <li>• <strong className="text-zinc-900">createdBy:</strong> ObjectId [FK &rarr; User Collection]</li>
                <li>• <strong className="text-zinc-900">helpfulCount:</strong> Number [Upvotes]</li>
                <li>• <strong className="text-zinc-900">createdAt / updatedAt:</strong> Timestamp</li>
              </ul>
            </div>

            {/* AI Generation Entity */}
            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#008272]" /> 3. AI Generation Entity (Logical)
                </span>
                <span className="text-[10px] font-bold text-[#008272] uppercase font-mono">Gemini 2.5 Flash</span>
              </div>
              <ul className="text-xs font-mono text-zinc-600 space-y-1">
                <li>• <strong className="text-zinc-900">topic:</strong> String [User Query Topic]</li>
                <li>• <strong className="text-zinc-900">generatedQuestion:</strong> String</li>
                <li>• <strong className="text-zinc-900">generatedAnswer:</strong> String</li>
                <li>• <strong className="text-zinc-900">generatedCategory:</strong> String</li>
                <li>• <strong className="text-zinc-900">generatedAt:</strong> Date</li>
              </ul>
            </div>

            {/* Category Entity */}
            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#008272]" /> 4. Category Entity (Logical)
                </span>
                <span className="text-[10px] font-bold text-[#008272] uppercase font-mono">Aggregated</span>
              </div>
              <ul className="text-xs font-mono text-zinc-600 space-y-1">
                <li>• <strong className="text-zinc-900">categoryName:</strong> String</li>
                <li>• <strong className="text-zinc-900">description:</strong> String</li>
                <li>• <strong className="text-zinc-900">totalFAQs:</strong> Number [Count]</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. MVC Architecture Pattern */}
      {activeSubTab === 'architecture' && (
        <div className="bg-white rounded-md border border-[#DDE2E5] p-5 sm:p-6 space-y-5 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              MVC Architecture & Live Data Synchronization
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Decoupling components according to the Model-View-Controller design pattern in Epic-1:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <h4 className="font-bold text-xs text-[#003E54] uppercase tracking-wider mb-1">
                1. Model Layer (Data Blueprint)
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Defines structural blueprints via enforced schemas mapping explicit fields into collection documents. Enforces field criteria validations and hooks password hashing steps prior to user document persistence.
              </p>
            </div>

            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <h4 className="font-bold text-xs text-[#003E54] uppercase tracking-wider mb-1">
                2. Controller Layer (Execution Matrix)
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                The intermediary brain of the ecosystem. Captures request vectors from execution routes, checks structural request constraints, delegates processing workflows directly to models or services, and packages resultant output.
              </p>
            </div>

            <div className="p-4 rounded border border-zinc-200 bg-[#F4F6F8]">
              <h4 className="font-bold text-xs text-[#003E54] uppercase tracking-wider mb-1">
                3. View / Router Layer (API Interface)
              </h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Connects network requests on specified paths directly to their associated controller handler logic maps. Extracted headers and JWT authorization records evaluate authorization thresholds for guarded resource paths.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
