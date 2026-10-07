"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { api } from "@/lib/api";
import { Form, Question } from "@/lib/types";
import { QuestionEditor } from "@/components/QuestionEditor";
import { SortableQuestion } from "@/components/SortableQuestion";
import { Toast } from "@/components/Toast";
const blank = {
  title: "What would you like to ask?",
  description: null,
  type: "short_text",
  required: false,
  options: [],
};
export default function Builder() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null),
    [selected, setSelected] = useState<number | null>(null),
    [toast, setToast] = useState(""),
    [tab, setTab] = useState("create");
  const load = () =>
    api
      .form(id)
      .then((f) => {
        setForm(f);
        setSelected((s) => s ?? f.questions[0]?.id ?? null);
      })
      .catch((e) => setToast(e.message));
  useEffect(() => {
    load();
  }, [id]);
  if (!form) return <main className="p-10">Loading builder…</main>;
  const question = form.questions.find((q) => q.id === selected);
  const add = async () => {
    try {
      const q = await api.addQuestion(form.id, blank);
      await load();
      setSelected(q.id);
    } catch (e: any) {
      setToast(e.message);
    }
  };
  const reorder = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const old = form.questions.findIndex((q) => q.id === e.active.id),
      next = form.questions.findIndex((q) => q.id === e.over?.id),
      qs = arrayMove(form.questions, old, next).map((q, i) => ({
        ...q,
        position: i,
      }));
    setForm({ ...form, questions: qs });
    try {
      await api.reorder(
        form.id,
        qs.map((q) => q.id),
      );
    } catch (err: any) {
      setToast(err.message);
      load();
    }
  };
  const publish = async () => {
    try {
      const updated = await api.publish(
        form.id,
        form.status === "published" ? "unpublish" : "publish",
      );
      setForm(updated);
      setToast(
        updated.status === "published"
          ? "Published! Share link copied below."
          : "Unpublished",
      );
    } catch (e: any) {
      setToast(e.message);
    }
  };
  return (
    <main className="flex h-screen min-w-[960px] flex-col bg-cream">
      <header className="flex h-16 items-center justify-between border-b border-black/10 bg-white px-6">
        <Link href="/" className="text-xl font-black">
          formly<span className="text-green-600">.</span>
        </Link>
        <nav className="flex h-full items-center gap-7 text-sm font-medium">
          <button
            className={tab === "create" ? "h-full border-b-2 border-ink" : ""}
            onClick={() => setTab("create")}
          >
            Create
          </button>
          <button
            className={tab === "settings" ? "h-full border-b-2 border-ink" : ""}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
          <Link href={`/results/${form.id}`}>Results</Link>
        </nav>
        <div className="flex gap-2">
          <button
            className="btn-light"
            onClick={() =>
              navigator.clipboard
                .writeText(`${location.origin}/form/${form.slug}`)
                .then(() => setToast("Public link copied"))
            }
          >
            Share
          </button>
          <button className="btn" onClick={publish}>
            {form.status === "published" ? "Unpublish" : "Publish"}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-black/10 bg-white p-4">
          <button className="btn mb-5 w-full" onClick={add}>
            + Add question
          </button>
          <DndContext collisionDetection={closestCenter} onDragEnd={reorder}>
            <SortableContext
              items={form.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {form.questions.map((q) => (
                <SortableQuestion
                  key={q.id}
                  q={q}
                  active={q.id === selected}
                  onClick={() => setSelected(q.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {form.questions.length === 0 && (
            <p className="p-3 text-sm text-black/45">
              Add your first question.
            </p>
          )}
        </aside>
        <section className="min-w-0 flex-1 overflow-y-auto p-12">
          {tab === "settings" ? (
            <div className="mx-auto max-w-xl space-y-6">
              <h1 className="text-3xl font-semibold">Form settings</h1>
              <label className="block">
                Form title
                <input
                  className="field mt-2"
                  defaultValue={form.title}
                  onBlur={async (e) => {
                    const f = await api.update(form.id, {
                      title: e.target.value,
                    });
                    setForm(f);
                  }}
                />
              </label>
              <label className="block">
                Thank-you heading
                <input
                  className="field mt-2"
                  defaultValue={form.thank_you_title}
                  onBlur={async (e) => {
                    const f = await api.update(form.id, {
                      thank_you_title: e.target.value,
                    });
                    setForm(f);
                  }}
                />
              </label>
              <label className="block">
                Thank-you message
                <textarea
                  className="field mt-2"
                  defaultValue={form.thank_you_message}
                  onBlur={async (e) => {
                    const f = await api.update(form.id, {
                      thank_you_message: e.target.value,
                    });
                    setForm(f);
                  }}
                />
              </label>
              <div className="card p-5">
                <h2 className="font-semibold">Coming soon</h2>
                <p className="mt-2 text-sm text-black/55">
                  Logic jumps, integrations, team sharing, payments, file
                  upload, themes and dark mode.
                </p>
              </div>
            </div>
          ) : question ? (
            <QuestionEditor
              question={question}
              onSave={async (data) => {
                await api.updateQuestion(question.id, data);
                setToast("Question saved");
                load();
              }}
              onDelete={async () => {
                if (confirm("Delete this question?")) {
                  await api.deleteQuestion(question.id);
                  setSelected(null);
                  setToast("Question deleted");
                  load();
                }
              }}
            />
          ) : (
            <div className="text-center">
              <h1 className="text-3xl font-semibold">
                Build something people want to answer.
              </h1>
              <button className="btn mt-6" onClick={add}>
                Add your first question
              </button>
            </div>
          )}
        </section>
        <aside className="w-72 shrink-0 border-l border-black/10 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-black/40">
            Live preview
          </p>

          <div className="mt-4 rounded-xl bg-[#e5f0de] p-5">
            {/* Question number */}
            <p className="text-sm text-black/55">
              {question ? `${question.position + 1} →` : "Your form"}
            </p>

            {/* Question title */}
            <h2 className="mt-5 text-xl font-semibold">
              {question?.title || form.title}
            </h2>

            {/* Question description */}
            {question?.description && (
              <p className="mt-2 text-sm text-black/60">
                {question.description}
              </p>
            )}

            {/* -------------------------------- */}
            {/* Dynamic answer preview */}
            {/* -------------------------------- */}

            <div className="mt-6">
              {/* Short Text */}
              {question?.type === "short_text" && (
                <div className="rounded-lg border border-black/20 bg-white p-3 text-sm text-black/40">
                  Your answer
                </div>
              )}

              {/* Long Text */}
              {question?.type === "long_text" && (
                <div className="min-h-20 rounded-lg border border-black/20 bg-white p-3 text-sm text-black/40">
                  Your answer
                </div>
              )}

              {/* Email */}
              {question?.type === "email" && (
                <div className="rounded-lg border border-black/20 bg-white p-3 text-sm text-black/40">
                  name@example.com
                </div>
              )}

              {/* Number */}
              {question?.type === "number" && (
                <div className="rounded-lg border border-black/20 bg-white p-3 text-sm text-black/40">
                  123
                </div>
              )}

              {/* Multiple Choice */}
              {question?.type === "multiple_choice" && (
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-2 rounded-lg border border-black/20 bg-white p-2 text-sm"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-black/20 text-xs">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Yes / No */}
              {question?.type === "yes_no" && (
                <div className="space-y-2">
                  {question.options?.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-2 rounded-lg border border-black/20 bg-white p-2 text-sm"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-black/20 text-xs">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dropdown */}
              {question?.type === "dropdown" && (
                <div className="flex items-center justify-between rounded-lg border border-black/20 bg-white p-3 text-sm text-black/40">
                  <span>Choose an answer</span>
                  <span>⌄</span>
                </div>
              )}

              {/* Rating */}
              {question?.type === "rating" && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <div
                      key={number}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-black/20 bg-white text-sm"
                    >
                      {number}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Continue button */}
            <button
              type="button"
              className="mt-4 rounded bg-ink px-3 py-2 text-sm text-white"
            >
              OK ↵
            </button>
          </div>

          {/* Published form link */}
          {form.status === "published" && (
            <a
              className="mt-4 block break-all text-sm text-blue-700 underline"
              href={`/form/${form.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              {location.origin}/form/{form.slug}
            </a>
          )}
        </aside>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </main>
  );
}
