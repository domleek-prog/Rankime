import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../api/client';

// Gold / silver / bronze / then a purple→blue gradient for the rest
const MEDAL = {
  1: { label: '🥇', border: 'border-yellow-400/60', badge: 'bg-yellow-400/15 text-yellow-300', glow: 'shadow-yellow-500/10' },
  2: { label: '🥈', border: 'border-slate-400/50', badge: 'bg-slate-400/15 text-slate-300', glow: 'shadow-slate-400/10' },
  3: { label: '🥉', border: 'border-orange-400/50', badge: 'bg-orange-400/15 text-orange-300', glow: 'shadow-orange-400/10' },
};

function rankAccent(pos) {
  // Interpolate: violet (#8b5cf6) at 1 → indigo (#6366f1) at 50
  const t = Math.min((pos - 1) / 49, 1);
  const r = Math.round(139 + (99 - 139) * t);
  const g = Math.round(92 + (102 - 92) * t);
  const b = Math.round(246 + (241 - 246) * t);
  return `rgb(${r},${g},${b})`;
}

function SortableItem({ entry, onRemove, confirmingId, setConfirmingId }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: entry.anilistId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const pos = entry.rankPosition;
  const medal = MEDAL[pos];
  const title = entry.titleEnglish || entry.titleRomaji;
  const accentColor = rankAccent(pos);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-0 rounded-xl overflow-hidden border ${
        medal ? `${medal.border} shadow-lg ${medal.glow}` : 'border-white/8'
      } bg-[var(--card)] group select-none`}
    >
      {/* Left colour accent bar */}
      <div className="shrink-0 w-1 self-stretch" style={{ background: accentColor }} />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-white/15 hover:text-white/40 touch-none px-2.5 self-stretch flex items-center"
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="3.5" r="1.3"/><circle cx="10" cy="3.5" r="1.3"/>
          <circle cx="4" cy="7" r="1.3"/><circle cx="10" cy="7" r="1.3"/>
          <circle cx="4" cy="10.5" r="1.3"/><circle cx="10" cy="10.5" r="1.3"/>
        </svg>
      </div>

      {/* Rank badge */}
      <div className="shrink-0 w-9 flex flex-col items-center justify-center py-4 gap-0.5">
        {medal ? (
          <>
            <span className="text-lg leading-none">{medal.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.3)' }}>#{pos}</span>
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.05em', color: accentColor }}>
            {pos}
          </span>
        )}
      </div>

      {/* Cover image — larger */}
      <div className="shrink-0 w-14 h-20 overflow-hidden bg-white/5 rounded-lg my-3">
        {entry.coverImageUrl
          ? <img src={entry.coverImageUrl} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" />}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0 px-3 py-3">
        <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{title}</p>
        {entry.titleEnglish && entry.titleRomaji !== entry.titleEnglish && (
          <p className="text-white/30 text-xs mt-0.5 truncate">{entry.titleRomaji}</p>
        )}
        {entry.studio && (
          <p className="text-white/25 text-xs mt-1">{entry.studio}</p>
        )}
      </div>

      {/* Remove */}
      <div className="shrink-0 pr-3">
        {confirmingId === entry.anilistId ? (
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[11px] text-white/40">Remove?</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onRemove(entry.anilistId)}
                className="text-[11px] bg-red-500/20 text-red-400 border border-red-400/25 px-2 py-1 rounded-lg hover:bg-red-500/30 transition-colors"
              >Yes</button>
              <button
                onClick={() => setConfirmingId(null)}
                className="text-[11px] text-white/30 hover:text-white px-2 py-1"
              >No</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingId(entry.anilistId)}
            className="text-white/20 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10"
            aria-label="Remove from list"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function DragPreview({ entry }) {
  if (!entry) return null;
  const title = entry.titleEnglish || entry.titleRomaji;
  return (
    <div className="flex items-center gap-3 bg-[var(--card-hover)] border border-violet-500/50 rounded-xl px-4 py-3 shadow-2xl shadow-violet-900/30 w-full">
      <span className="text-sm font-bold text-violet-400">#{entry.rankPosition}</span>
      <div className="w-9 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
        {entry.coverImageUrl && <img src={entry.coverImageUrl} alt={title} className="w-full h-full object-cover" />}
      </div>
      <p className="text-white text-sm font-medium line-clamp-1 flex-1">{title}</p>
    </div>
  );
}

export default function RankedList({ list, setList, onRemove, reorderEndpoint = '/list/reorder' }) {
  const [confirmingId, setConfirmingId] = useState(null);
  const [activeEntry, setActiveEntry] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event) {
    setActiveEntry(list.find(e => e.anilistId === event.active.id) || null);
    setConfirmingId(null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveEntry(null);
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex(e => e.anilistId === active.id);
    const newIndex = list.findIndex(e => e.anilistId === over.id);
    const newList = arrayMove(list, oldIndex, newIndex).map((e, i) => ({ ...e, rankPosition: i + 1 }));
    setList(newList);

    api.patch(reorderEndpoint, { order: newList.map(e => e.anilistId) })
      .catch(() => window.location.reload());
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-20 text-white/20">
        <p className="text-5xl mb-4">🎌</p>
        <p className="text-base text-white/40 font-medium">Your list is empty</p>
        <p className="text-sm mt-2">Search for anime and add them to start ranking</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={list.map(e => e.anilistId)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {list.map(entry => (
            <SortableItem
              key={entry.anilistId}
              entry={entry}
              onRemove={onRemove}
              confirmingId={confirmingId}
              setConfirmingId={setConfirmingId}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        <DragPreview entry={activeEntry} />
      </DragOverlay>
    </DndContext>
  );
}
