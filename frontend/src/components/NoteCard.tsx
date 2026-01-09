'use client';

import Link from 'next/link';
import type { Note } from '@/types';

interface NoteCardProps {
  note: Note & { role?: string };
  onDelete?: (id: number) => void;
  isShared?: boolean;
  index?: number;
}

export default function NoteCard({ note, onDelete, isShared, index = 0 }: NoteCardProps) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const timeAgo = getTimeAgo(new Date(note.updated_at));
  const canEdit = !isShared || note.role === 'editor';
  
  // Stagger class based on index
  const staggerClass = `stagger-${Math.min(index + 1, 6)}`;

  return (
    <div 
      className={`group bg-white rounded-2xl border border-slate-200/60 p-5 card-hover animate-fade-in-up opacity-0 ${staggerClass}`}
      style={{ animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link href={`/notes/view?id=${note.id}`} className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
            {note.title}
          </h3>
        </Link>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isShared && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              note.role === 'editor' 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {note.role === 'editor' ? 'Editor' : 'Viewer'}
            </span>
          )}
          {note.version !== undefined && (
            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
              v{note.version}
            </span>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4">
        {note.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span title={formattedDate}>{timeAgo}</span>
        </div>

        {/* Actions - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {canEdit && (
            <Link
              href={`/notes/edit?id=${note.id}`}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all btn-transition"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          )}
          <Link
            href={`/notes/view?id=${note.id}`}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all btn-transition"
            title="View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          {!isShared && onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all btn-transition"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
