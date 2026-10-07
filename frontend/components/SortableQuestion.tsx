"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Question } from "@/lib/types";

export function SortableQuestion({
  q,
  active,
  onClick,
}: {
  q: Question;
  active: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: q.id,
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`mb-1 flex w-full items-center rounded-lg text-sm ${
        active ? "bg-lime font-semibold" : "hover:bg-black/5"
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab px-2 py-3 text-black/35 hover:text-black/70 active:cursor-grabbing"
        aria-label="Drag question"
      >
        ⋮⋮
      </button>

      {/* Clickable question */}
      <button
        type="button"
        onClick={onClick}
        className="flex-1 py-3 pr-3 text-left"
      >
        <span className="mr-2 text-black/45">{q.position + 1}</span>

        {q.title || "Untitled question"}
      </button>
    </div>
  );
}
