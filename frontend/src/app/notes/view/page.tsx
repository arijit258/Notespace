'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Note, Collaborator, ActivityLog, User } from '@/types';

function NoteViewContent() {
  const [note, setNote] = useState<Note | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = Number(searchParams.get('id'));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && noteId) {
      fetchNote();
      fetchCollaborators();
    }
  }, [user, noteId]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const data = await api.getNote(noteId);
      setNote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch note');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const data = await api.getCollaborators(noteId);
      setCollaborators(data);
    } catch {
      // Ignore error for non-owners
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const data = await api.getNoteActivityLogs(noteId);
      setActivityLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.filter(u => u.id !== user?.id && !collaborators.some(c => c.user_id === u.id)));
    } catch {
      // Ignore
    }
  };

  const handleShare = async () => {
    if (!selectedUserEmail) return;
    
    try {
      await api.shareNote(noteId, { email: selectedUserEmail, role: selectedRole });
      setShowShareModal(false);
      fetchCollaborators();
      setSelectedUserEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share note');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: number) => {
    if (!confirm('Remove this collaborator?')) return;
    
    try {
      await api.removeCollaborator(noteId, collaboratorId);
      fetchCollaborators();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.deleteNote(noteId);
      router.push('/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const openShareModal = () => {
    fetchUsers();
    setShowShareModal(true);
  };

  const openActivityModal = () => {
    fetchActivityLogs();
    setShowActivityModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Note not found</h3>
        <p className="text-slate-500 mb-6">The note you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/notes" className="text-indigo-600 hover:text-indigo-700 font-medium">
          &larr; Back to notes
        </Link>
      </div>
    );
  }

  const isOwner = note.owner_id === user?.id;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/notes" 
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <span className="text-slate-300">|</span>
        <span className="text-sm text-slate-500">
          Updated {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {note.version !== undefined && (
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
            v{note.version}
          </span>
        )}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Title & Actions */}
        <div className="p-6 md:p-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-slate-800">{note.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/notes/edit?id=${note.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-all btn-transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
              {isOwner && (
                <button
                  onClick={openShareModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-all btn-transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              )}
              <button
                onClick={openActivityModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-100 transition-all btn-transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity
              </button>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all btn-transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed bg-transparent p-0 m-0 border-0">
              {note.content}
            </pre>
          </div>
        </div>

        {/* Collaborators Section */}
        {isOwner && collaborators.length > 0 && (
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <div className="pt-6 border-t border-slate-100">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Collaborators
              </h3>
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                        U
                      </div>
                      <span className="text-slate-700 font-medium">User #{collab.user_id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        collab.role === 'editor' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {collab.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>
                      <button
                        onClick={() => handleRemoveCollaborator(collab.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Share Note</h2>
                  <p className="text-sm text-slate-500">Invite others to collaborate</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select User</label>
                <select
                  value={selectedUserEmail}
                  onChange={(e) => setSelectedUserEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="">Choose a user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Permission Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('viewer')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === 'viewer' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-800">Viewer</div>
                    <div className="text-xs text-slate-500 mt-1">Can only read</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('editor')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === 'editor' 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-800">Editor</div>
                    <div className="text-xs text-slate-500 mt-1">Can read & edit</div>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-white transition-all btn-transition"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={!selectedUserEmail}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-transition"
              >
                Share Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Activity Log</h2>
                  <p className="text-sm text-slate-500">Recent changes to this note</p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {activityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log, index) => (
                    <div 
                      key={log.id} 
                      className="bg-slate-50 p-4 rounded-xl animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards', opacity: 0 }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-sm text-slate-600 ml-4">{log.details}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2 ml-4">User #{log.user_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
              <button
                onClick={() => setShowActivityModal(false)}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all btn-transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NoteViewPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    }>
      <NoteViewContent />
    </Suspense>
  );
}
