"use client";
import { useEffect, useState } from "react";
import { Question } from "@/lib/types";
const TYPES = [
  ["short_text", "Short text"],
  ["long_text", "Long text"],
  ["multiple_choice", "Multiple choice"],
  ["dropdown", "Dropdown"],
  ["email", "Email"],
  ["number", "Number"],
  ["yes_no", "Yes / No"],
  ["rating", "Rating"],
];
export function QuestionEditor({
  question,
  onSave,
  onDelete,
}: {
  question: Question;
  onSave: (data: object) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState(question.title),
    [description, setDescription] = useState(question.description || ""),
    [type, setType] = useState(question.type),
    [required, setRequired] = useState(question.required),
    [options, setOptions] = useState(question.options.map((o) => o.label));
  useEffect(() => {
    setTitle(question.title);
    setDescription(question.description || "");
    setType(question.type);
    setRequired(question.required);
    setOptions(question.options.map((o) => o.label));
  }, [question]);
  const needsOptions = ["multiple_choice", "dropdown", "yes_no"].includes(type);
  useEffect(() => {
    if (type === "yes_no" && options.join("|") !== "Yes|No")
      setOptions(["Yes", "No"]);
  }, [type]);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <label className="text-sm font-medium">Question</label>
        <textarea
          className="field mt-2 text-2xl font-medium"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">
          Description <span className="text-black/40">optional</span>
        </label>
        <input
          className="field mt-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Answer type</label>
        <select
          className="field mt-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {needsOptions && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Choices</label>
          {options.map((o, i) => (
            <div className="flex gap-2" key={i}>
              <input
                className="field"
                value={o}
                onChange={(e) =>
                  setOptions(
                    options.map((x, n) => (n === i ? e.target.value : x)),
                  )
                }
              />
              {type !== "yes_no" && (
                <button
                  className="btn-light"
                  onClick={() => setOptions(options.filter((_, n) => n !== i))}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {type !== "yes_no" && (
            <button
              className="text-sm underline"
              onClick={() => setOptions([...options, "New choice"])}
            >
              + Add choice
            </button>
          )}
        </div>
      )}
      <label className="flex items-center gap-3 font-medium">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />{" "}
        Required
      </label>
      <div className="flex justify-between border-t pt-5">
        <button className="text-red-600" onClick={onDelete}>
          Delete question
        </button>
        <button
          className="btn"
          disabled={!title.trim()}
          onClick={() =>
            onSave({
              title,
              description: description || null,
              type,
              required,
              options: needsOptions
                ? options.filter(Boolean).map((label) => ({ label }))
                : [],
            })
          }
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
