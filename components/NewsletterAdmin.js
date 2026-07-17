'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Users, AlertCircle, CheckCircle, FileText, Shield,
  BarChart2, History, AlertTriangle, Loader2, ArrowRight, XCircle,
  Eye, EyeOff, ImagePlus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '280px',
        width: '100%',
        background: '#F9FAFB',
        borderRadius: '12px',
        border: '1.5px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9C8577',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      Loading Editor...
    </div>
  ),
});

export default function NewsletterAdmin({ isSystemOnline = true }) {
  // Navigation State
  const [subTab, setSubTab] = useState('compose'); // compose | tracking

  // Compose Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [imageModal, setImageModal] = useState({ open: false, url: '' });
  const quillRef = useRef(null);
  const pendingRangeRef = useRef(null);

  // Analytics & Tracking State
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Fetch all email blasts (campaigns)
  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_blasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCampaigns(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
    return [];
  };

  // Fetch failed/bounced logs for selected campaign
  const fetchLogs = async (campaignId) => {
    if (!campaignId) return;
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('blast_id', campaignId)
        .in('status', ['failed', 'bounced'])
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoadingCampaigns(true);
      const data = await fetchCampaigns();
      if (data.length > 0) {
        setSelectedCampaign(data[0]);
      }
      setLoadingCampaigns(false);
    };
    init();
  }, []);

  // Real-time synchronization for selected campaign
  useEffect(() => {
    if (!selectedCampaign?.id) return;

    // Fetch initial logs for selected campaign
    fetchLogs(selectedCampaign.id);

    // 1. Subscribe to updates for the selected campaign record
    const blastChannel = supabase
      .channel(`blast-status-${selectedCampaign.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_blasts',
          filter: `id=eq.${selectedCampaign.id}`,
        },
        (payload) => {
          setSelectedCampaign(payload.new);
          // Sync list
          setCampaigns((prev) =>
            prev.map((c) => (c.id === payload.new.id ? payload.new : c))
          );
        }
      )
      .subscribe();

    // 2. Subscribe to updates for logs (delivered/bounced webhook events)
    const logsChannel = supabase
      .channel(`logs-status-${selectedCampaign.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_logs',
          filter: `blast_id=eq.${selectedCampaign.id}`,
        },
        () => {
          fetchLogs(selectedCampaign.id);
          // Also refetch campaign stats to keep counters synced
          fetchCampaigns().then((fresh) => {
            const match = fresh.find((c) => c.id === selectedCampaign.id);
            if (match) setSelectedCampaign(match);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(blastChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [selectedCampaign?.id]);

  // Handle composing and launching newsletter
  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !content) {
      setMsg('Please fill in both subject and content.');
      setStatus('error');
      return;
    }

    if (!confirm('Are you sure you want to blast this email to all active subscribers?')) {
      return;
    }

    setStatus('loading');
    setMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ subject, htmlContent: content }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send newsletter');

      setStatus('success');
      setMsg(`Successfully sent to ${data.sentCount} subscribers!`);
      setSubject('');
      setContent('');

      // Refresh list, switch to tracking tab and select newly created campaign
      const freshCampaigns = await fetchCampaigns();
      setSubTab('tracking');
      if (data.blastId && freshCampaigns.length > 0) {
        const match = freshCampaigns.find((c) => c.id === data.blastId);
        if (match) {
          setSelectedCampaign(match);
        }
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMsg(error.message);
    }
  };

  // Custom image handler — saves cursor position then opens inline modal
  const imageHandler = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    pendingRangeRef.current = editor.getSelection(true) || { index: editor.getLength() - 1 };
    setImageModal({ open: true, url: '' });
  }, []);

  const insertImage = () => {
    const url = imageModal.url.trim();
    if (!url) return;
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = pendingRangeRef.current || { index: editor.getLength() - 1 };
    editor.insertEmbed(range.index, 'image', url);
    editor.setSelection(range.index + 1);
    setImageModal({ open: false, url: '' });
    pendingRangeRef.current = null;
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        ['blockquote', 'code-block'],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Preview: show sample values for personalization tokens so admins see
  // roughly what a subscriber gets (the API does the real per-recipient swap)
  const previewHtml = content.replace(
    /\{\{\s*(name|first_?name|email)\s*(?:\|[^}]*)?\}\}/gi,
    (_, token) => (token.toLowerCase() === 'email' ? 'maria@example.com' : 'Maria')
  );

  // Helper values for calculations
  const total = selectedCampaign?.total_sent || 0;
  const sent = selectedCampaign?.sent_count || 0;
  const delivered = selectedCampaign?.delivered_count || 0;
  const failed = selectedCampaign?.failed_count || 0;

  const sendProgress = total > 0 ? Math.round((sent / total) * 100) : 0;
  const deliveredPercent = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const failedPercent = total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <div style={{ fontFamily: 'var(--font-montserrat)' }}>
      <style>{`
        .ql-editor { min-height: 420px !important; font-size: 15px; line-height: 1.7; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1.5px solid #E5E7EB !important; padding: 10px 14px !important; background: #F9FAFB; flex-wrap: wrap; }
        .ql-container.ql-snow { border: none !important; }
        .ql-snow .ql-picker { color: #374151; }
        .ql-snow .ql-stroke { stroke: #374151; }
        .ql-snow .ql-fill { fill: #374151; }
        .ql-snow.ql-toolbar button:hover .ql-stroke, .ql-snow .ql-toolbar button:hover .ql-stroke { stroke: #B87333; }
        .ql-snow.ql-toolbar button:hover .ql-fill, .ql-snow .ql-toolbar button:hover .ql-fill { fill: #B87333; }
        .ql-snow.ql-toolbar button.ql-active .ql-stroke { stroke: #B87333; }
        .ql-snow.ql-toolbar button.ql-active .ql-fill { fill: #B87333; }
        .ql-snow .ql-picker-label:hover, .ql-snow .ql-picker-label.ql-active { color: #B87333 !important; }
      `}</style>
      {/* ── Dashboard Sub Navigation ────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          borderBottom: '1.5px solid #E5E7EB',
          paddingBottom: '12px',
        }}
      >
        <button
          onClick={() => setSubTab('compose')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            fontFamily: 'var(--font-montserrat)',
            transition: 'all 0.2s',
            background: subTab === 'compose' ? 'rgba(184,115,51,0.1)' : 'transparent',
            color: subTab === 'compose' ? '#B87333' : '#8C7365',
          }}
        >
          <Send size={16} />
          Compose & Send
        </button>

        <button
          onClick={() => {
            setSubTab('tracking');
            fetchCampaigns();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            fontFamily: 'var(--font-montserrat)',
            transition: 'all 0.2s',
            background: subTab === 'tracking' ? 'rgba(184,115,51,0.1)' : 'transparent',
            color: subTab === 'tracking' ? '#B87333' : '#8C7365',
          }}
        >
          <BarChart2 size={16} />
          Tracking & Analytics
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Sub Tab: COMPOSE ──────────────────────────── */}
        {subTab === 'compose' && (
          <motion.div
            key="compose-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '18px',
                border: '1.5px solid #E5E7EB',
                overflow: 'hidden',
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  padding: '24px 28px',
                  borderBottom: '1.5px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(184,115,51,0.08)',
                    border: '1.5px solid rgba(184,115,51,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B87333',
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#3E2723',
                      textTransform: 'none',
                      textShadow: 'none',
                      fontFamily: 'var(--font-montserrat)',
                    }}
                  >
                    Compose Email
                  </h3>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#9C8577' }}>
                    Send a newsletter blast to all active subscribers
                  </p>
                </div>
              </div>

              {/* Form Body */}
              <div style={{ padding: '28px' }}>
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Subject Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#3E2723' }}>
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., 🎉 Exclusive Secret Menu Item This Weekend!"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1.5px solid #E5E7EB',
                        background: '#F9FAFB',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#3E2723',
                        fontFamily: 'var(--font-montserrat)',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#B87333'; e.target.style.boxShadow = '0 0 0 3px rgba(184,115,51,0.08)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Rich Text Editor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#3E2723' }}>
                      Email Content
                    </label>
                    <div
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1.5px solid #E5E7EB',
                        background: '#fff',
                        position: 'relative',
                      }}
                    >
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        modules={modules}
                        style={{ backgroundColor: 'white', color: '#000000' }}
                      />

                      {/* ── Inline Image URL Modal ── */}
                      {imageModal.open && (
                        <div style={{
                          position: 'absolute', inset: 0, zIndex: 20,
                          background: 'rgba(0,0,0,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '12px',
                        }}>
                          <div style={{
                            background: '#fff', borderRadius: '14px', padding: '24px 28px',
                            width: '90%', maxWidth: '440px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                          }}>
                            <p style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 800, color: '#3E2723', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ImagePlus size={16} style={{ color: '#B87333' }} /> Insert Image
                            </p>
                            <input
                              autoFocus
                              type="url"
                              placeholder="https://example.com/image.jpg"
                              value={imageModal.url}
                              onChange={e => setImageModal(m => ({ ...m, url: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') insertImage(); if (e.key === 'Escape') setImageModal({ open: false, url: '' }); }}
                              style={{
                                width: '100%', padding: '10px 14px', borderRadius: '8px',
                                border: '1.5px solid #E5E7EB', fontSize: '13px', fontWeight: 600,
                                color: '#374151', fontFamily: 'var(--font-montserrat)', outline: 'none',
                                boxSizing: 'border-box', marginBottom: '14px',
                              }}
                            />
                            <p style={{ margin: '0 0 16px', fontSize: '11px', color: '#9C8577', fontWeight: 500 }}>
                              Paste a direct image URL from Imgur, Unsplash, Google Drive, or any CDN.
                            </p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setImageModal({ open: false, url: '' })}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-montserrat)' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={insertImage}
                                disabled={!imageModal.url.trim()}
                                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#B87333', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: imageModal.url.trim() ? 'pointer' : 'not-allowed', opacity: imageModal.url.trim() ? 1 : 0.5, fontFamily: 'var(--font-montserrat)' }}
                              >
                                Insert Image
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ImagePlus size={14} style={{ color: '#B87333', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#9C8577', lineHeight: 1.4 }}>
                            Click the image icon in the toolbar to insert an image by URL.
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} style={{ color: '#B87333', flexShrink: 0 }} />
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#9C8577', lineHeight: 1.4 }}>
                            Personalize with <b>{'{{name}}'}</b> — becomes each subscriber&apos;s name (&quot;amigo&quot; if none). Also: <b>{'{{first_name}}'}</b>, <b>{'{{name|friend}}'}</b> for a custom fallback. Works in the subject too.
                          </span>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowPreview(!showPreview)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '7px',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: '1.5px solid #E5E7EB',
                          background: showPreview ? 'rgba(184,115,51,0.08)' : '#F9FAFB',
                          color: showPreview ? '#B87333' : '#8C7365',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-montserrat)',
                          transition: 'all 0.2s',
                          flexShrink: 0,
                        }}
                      >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPreview ? 'Hide Preview' : 'Email Preview'}
                      </motion.button>
                    </div>
                  </div>

                  {/* ── Branded Email Preview Panel ── */}
                  <AnimatePresence>
                    {showPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          borderRadius: '14px',
                          border: '1.5px solid #E5E7EB',
                          overflow: 'hidden',
                          background: '#F3F4F6',
                        }}>
                          {/* Preview Header */}
                          <div style={{
                            padding: '12px 18px',
                            background: '#F9FAFB',
                            borderBottom: '1.5px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <Eye size={14} style={{ color: '#B87333' }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#3E2723' }}>
                              Email Preview — How recipients will see this email
                            </span>
                          </div>
                          {/* Preview Body — simulated email client */}
                          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                              width: '100%',
                              maxWidth: '560px',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              boxShadow: '0 8px 32px rgba(62,39,35,0.12)',
                            }}>
                              {/* Email Header */}
                              <div style={{
                                background: 'linear-gradient(135deg, #3E2723 0%, #5C2317 50%, #4A2A1F 100%)',
                                padding: '28px 32px 24px',
                                textAlign: 'center',
                              }}>
                                <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, #B87333, #D4AF37, transparent)', borderRadius: '1px', marginBottom: '16px' }}></div>
                                <h3 style={{
                                  margin: '0 0 4px',
                                  fontSize: '20px',
                                  fontWeight: 900,
                                  color: '#FDF6EE',
                                  letterSpacing: '1.5px',
                                  textTransform: 'uppercase',
                                  textShadow: 'none',
                                  fontFamily: 'var(--font-montserrat)',
                                }}>Buenos Mexican</h3>
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#D4AF37', letterSpacing: '3px', textTransform: 'uppercase' }}>
                                  ✦ &nbsp; Authentic Cuisine &nbsp; ✦
                                </p>
                              </div>
                              {/* Email Body Content */}
                              <div style={{
                                background: '#fff',
                                padding: '32px',
                                fontSize: '14px',
                                lineHeight: 1.7,
                                color: '#3E2723',
                                wordWrap: 'break-word',
                              }}>
                                {content ? (
                                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                ) : (
                                  <p style={{ color: '#B09080', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>
                                    Start typing in the editor above to see a live preview...
                                  </p>
                                )}
                              </div>
                              {/* Email Footer */}
                              <div style={{
                                background: '#fff',
                                padding: '0 32px',
                              }}>
                                <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #E5E7EB, transparent)' }}></div>
                              </div>
                              <div style={{
                                background: '#fff',
                                padding: '20px 32px 10px',
                                textAlign: 'center',
                              }}>
                                {/* Social Icons Row */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                                  <a href="https://www.facebook.com/profile.php?id=61571573732880" target="_blank" rel="noreferrer" title="Facebook" style={{ textDecoration: 'none' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="32" height="32" alt="Facebook" style={{ display: 'inline-block', border: 0 }} />
                                  </a>
                                  <a href="https://www.instagram.com/buenosmexican" target="_blank" rel="noreferrer" title="Instagram" style={{ textDecoration: 'none' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" width="32" height="32" alt="Instagram" style={{ display: 'inline-block', border: 0 }} />
                                  </a>
                                  <a href="https://www.tiktok.com/@buenosmexican" target="_blank" rel="noreferrer" title="TikTok" style={{ textDecoration: 'none' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="32" height="32" alt="TikTok" style={{ display: 'inline-block', border: 0 }} />
                                  </a>
                                </div>
                                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#8C7365', fontWeight: 600 }}>Buenos Mexican Cuisine</p>
                                <p style={{ margin: '0 0 0', fontSize: '10px', color: '#B09080', lineHeight: 1.5 }}>
                                  Jomtien Complex, 413/9-10 Thappraya Rd, Pattaya City
                                </p>
                              </div>
                              <div style={{
                                background: '#F9FAFB',
                                padding: '14px 32px',
                                textAlign: 'center',
                                borderTop: '1px solid #E5E7EB',
                              }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#9C8577' }}>
                                  <span style={{ textDecoration: 'underline', color: '#B87333', fontWeight: 600 }}>Unsubscribe here</span>
                                  &nbsp;·&nbsp;
                                  © {new Date().getFullYear()} Buenos Mexican Cuisine
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Status Messages */}
                  {status === 'error' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: 'rgba(202,91,67,0.06)',
                        border: '1.5px solid rgba(202,91,67,0.15)',
                        color: '#A0432E',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      {msg}
                    </div>
                  )}

                  {status === 'success' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: 'rgba(45,90,39,0.06)',
                        border: '1.5px solid rgba(45,90,39,0.15)',
                        color: '#2D5A27',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle size={18} style={{ flexShrink: 0 }} />
                      {msg}
                    </div>
                  )}

                  {/* Submit Area */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '20px',
                      borderTop: '1.5px solid #E5E7EB',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={14} style={{ color: '#2D5A27', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B5A4E' }}>
                          Unsubscribe link auto-appended · Sent via verified Resend domain
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={isSystemOnline ? { scale: 1.02 } : {}}
                      whileTap={isSystemOnline ? { scale: 0.98 } : {}}
                      type="submit"
                      disabled={status === 'loading' || !isSystemOnline}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 28px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: !isSystemOnline ? 'not-allowed' : (status === 'loading' ? 'wait' : 'pointer'),
                        background: 'linear-gradient(135deg, #3E2723, #5D3A2E)',
                        color: '#FDF6EE',
                        fontSize: '14px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-montserrat)',
                        boxShadow: isSystemOnline ? '0 4px 16px rgba(62,39,35,0.2)' : 'none',
                        opacity: !isSystemOnline ? 0.45 : (status === 'loading' ? 0.7 : 1),
                        transition: 'all 0.25s ease',
                        flexShrink: 0,
                      }}
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Blast
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Sub Tab: TRACKING & ANALYTICS ──────────────── */}
        {subTab === 'tracking' && (
          <motion.div
            key="tracking-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Dropdown & Campaign Select */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                padding: '20px 24px',
                background: '#fff',
                borderRadius: '16px',
                border: '1.5px solid #E5E7EB',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(62,39,35,0.06)',
                    color: '#3E2723',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <History size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#9C8577', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                    Select Campaign Blast
                  </label>
                  {loadingCampaigns ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={14} className="animate-spin" style={{ color: '#B87333' }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#9C8577' }}>Loading...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedCampaign?.id || ''}
                      onChange={(e) => {
                        const match = campaigns.find((c) => c.id === e.target.value);
                        if (match) setSelectedCampaign(match);
                      }}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#3E2723',
                        outline: 'none',
                        cursor: 'pointer',
                        paddingRight: '20px',
                      }}
                    >
                      {campaigns.length === 0 ? (
                        <option value="">No campaigns found</option>
                      ) : (
                        campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.subject} ({formatDate(c.created_at)})
                          </option>
                        ))
                      )}
                    </select>
                  )}
                </div>
              </div>

              {selectedCampaign && (
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    ...(selectedCampaign.status === 'completed'
                      ? { background: 'rgba(45,90,39,0.08)', color: '#2D5A27' }
                      : selectedCampaign.status === 'sending'
                        ? { background: 'rgba(184,115,51,0.08)', color: '#B87333' }
                        : { background: 'rgba(202,91,67,0.08)', color: '#A0432E' }),
                  }}
                >
                  {selectedCampaign.status}
                </div>
              )}
            </div>

            {selectedCampaign ? (
              <>
                {/* ── Real-time Progress Bar ────────────────────── */}
                {selectedCampaign.status === 'sending' && (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      border: '1.5px solid #E5E7EB',
                      padding: '24px',
                      marginBottom: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: '#B87333' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#3E2723' }}>
                          Sending Newsletter Blast...
                        </span>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#B87333' }}>
                        {sendProgress}% [{sent} / {total}]
                      </span>
                    </div>

                    <div
                      style={{
                        height: '10px',
                        width: '100%',
                        background: '#F9FAFB',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${sendProgress}%` }}
                        transition={{ duration: 0.3 }}
                        style={{
                          height: '100%',
                          background: 'linear-gradient(90deg, #B87333, #D4AF37)',
                          borderRadius: '5px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ── Analytics Summary Cards ────────────────────── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '28px',
                  }}
                >
                  {/* Card 1: Total Sent */}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      border: '1.5px solid #E5E7EB',
                      boxShadow: 'none',
                    }}
                  >
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9C8577', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Total Sent
                    </p>
                    <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#3E2723', margin: 0 }}>
                      {total}
                    </h3>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#8C7365', marginTop: '4px', marginBottom: 0 }}>
                      Recipients in this blast
                    </p>
                  </div>

                  {/* Card 2: Delivered */}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      border: '1.5px solid #E5E7EB',
                      borderColor: delivered > 0 ? '#E2EDDE' : '#E5E7EB',
                    }}
                  >
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9C8577', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Delivered
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#2D5A27', margin: 0 }}>
                        {delivered}
                      </h3>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#54874E' }}>
                        ({deliveredPercent}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <div style={{ height: '6px', width: '100px', background: '#F9FAFB', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${deliveredPercent}%`, background: '#2D5A27' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#8C7365' }}>success rate</span>
                    </div>
                  </div>

                  {/* Card 3: Failed/Bounced */}
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      border: '1.5px solid #E5E7EB',
                      borderColor: failed > 0 ? '#FCEBE8' : '#E5E7EB',
                    }}
                  >
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9C8577', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Failed / Bounced
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#A0432E', margin: 0 }}>
                        {failed}
                      </h3>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#CA5B43' }}>
                        ({failedPercent}%)
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: failed > 0 ? '#CA5B43' : '#8C7365', marginTop: '4px', marginBottom: 0 }}>
                      {failed > 0 ? 'Bounced emails marked inactive' : 'No bounces detected'}
                    </p>
                  </div>
                </div>

                {/* ── Failed/Bounced Logs Table ─────────────────── */}
                <div
                  style={{
                    background: '#fff',
                    borderRadius: '18px',
                    border: '1.5px solid #E5E7EB',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '20px 24px',
                      borderBottom: '1.5px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertTriangle size={18} style={{ color: '#B87333' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#3E2723', margin: 0 }}>
                        Failed & Bounced Recipients Audit Log
                      </h4>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#9C8577' }}>
                      Showing {logs.length} failed deliveries
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    {logs.length === 0 ? (
                      <div
                        style={{
                          padding: '48px 24px',
                          textAlign: 'center',
                          color: '#9C8577',
                          background: '#F9FAFB',
                        }}
                      >
                        <CheckCircle size={32} style={{ color: '#2D5A27', marginBottom: '12px', opacity: 0.7 }} />
                        <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#3E2723', margin: '0 0 4px 0' }}>
                          Perfect Delivery Score!
                        </h5>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#8C7365', margin: 0 }}>
                          No failures or bounced emails recorded for this campaign.
                        </p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB', color: '#3E2723', fontWeight: 700 }}>
                            <th style={{ padding: '12px 18px' }}>Recipient Email</th>
                            <th style={{ padding: '12px 18px' }}>Event</th>
                            <th style={{ padding: '12px 18px' }}>Error Reason</th>
                            <th style={{ padding: '12px 18px' }}>Logged At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr
                              key={log.id}
                              style={{
                                borderBottom: '1px solid #FAF0E6',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF9F6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td style={{ padding: '14px 18px', fontWeight: 600, color: '#3E2723' }}>
                                {log.recipient_email}
                              </td>
                              <td style={{ padding: '14px 18px' }}>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    ...(log.status === 'bounced'
                                      ? { background: 'rgba(184,115,51,0.08)', color: '#B87333' }
                                      : { background: 'rgba(202,91,67,0.08)', color: '#A0432E' }),
                                  }}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 18px', color: '#A0432E', fontWeight: 500 }}>
                                {log.error_message || 'Unknown Failure'}
                              </td>
                              <td style={{ padding: '14px 18px', color: '#9C8577' }}>
                                {formatDate(log.updated_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1.5px solid #E5E7EB',
                  padding: '64px 32px',
                  textAlign: 'center',
                  color: '#9C8577',
                }}
              >
                <History size={36} style={{ color: '#E5E7EB', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#3E2723', margin: '0 0 6px 0' }}>
                  No Campaigns Sent Yet
                </h4>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#9C8577', margin: '0 0 20px 0', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Once you send your first newsletter blast, delivery tracking and statistics will appear here.
                </p>
                <button
                  onClick={() => setSubTab('compose')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: '#3E2723',
                    color: '#FDF6EE',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'var(--font-montserrat)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Compose Now <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
