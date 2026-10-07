"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Form } from "@/lib/types";

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();

  const [form, setForm] = useState<Form | null>(null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prevent duplicate submissions
  const submittingRef = useRef(false);

  // Load public form
  useEffect(() => {
    api
      .publicForm(slug)
      .then(setForm)
      .catch((e) => {
        setError(e.message || "Failed to load form.");
      });
  }, [slug]);

  const next = useCallback(async () => {
    if (!form) return;

    const question = form.questions[step];

    if (!question) return;

    const value = values[question.id] || "";

    // -----------------------------
    // Required validation
    // -----------------------------
    if (question.required && !value.trim()) {
      setError("This question is required.");
      return;
    }

    // -----------------------------
    // Email validation
    // -----------------------------
    if (question.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }

    // -----------------------------
    // Number validation
    // -----------------------------
    if (question.type === "number" && value) {
      const numberValue = Number(value);

      if (Number.isNaN(numberValue)) {
        setError("Please enter a valid number.");
        return;
      }
    }

    setError("");

    // -----------------------------
    // Go to next question
    // -----------------------------
    if (step < form.questions.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    // -----------------------------
    // Prevent duplicate submission
    // -----------------------------
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    try {
      // -----------------------------
      // Submit response
      // -----------------------------
      await api.submit(
        slug,
        Object.entries(values).map(([question_id, answer]) => ({
          question_id: Number(question_id),
          value: answer,
        })),
      );

      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong while submitting.");

      // Allow retry if submission failed
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [form, step, values, slug]);

  // -----------------------------
  // Keyboard navigation
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (done) return;

      // Enter → next / submit
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        if (!submittingRef.current) {
          next();
        }
      }

      // Arrow Up → previous question
      if (e.key === "ArrowUp" && step > 0) {
        e.preventDefault();

        if (!submittingRef.current) {
          setStep((current) => current - 1);
          setError("");
        }
      }

      // Arrow Down → next question
      if (e.key === "ArrowDown" && form && step < form.questions.length - 1) {
        e.preventDefault();

        if (!submittingRef.current) {
          next();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [next, step, form, done]);

  // -----------------------------
  // Loading
  // -----------------------------
  if (!form && !error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-black/20 border-t-black" />

          <p className="text-sm text-black/50">Loading form...</p>
        </div>
      </main>
    );
  }

  // -----------------------------
  // Form loading error
  // -----------------------------
  if (error && !form) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>

          <p className="mt-3 text-black/60">{error}</p>
        </div>
      </main>
    );
  }

  if (!form) return null;

  // -----------------------------
  // Thank-you screen
  // -----------------------------
  if (done) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#e5f0de] p-6">
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="max-w-2xl text-center"
        >
          <motion.div
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
            }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 180,
            }}
            className="mx-auto mb-8 grid h-20 w-20 place-items-center rounded-full bg-black text-3xl text-white"
          >
            ✓
          </motion.div>

          <h1 className="text-4xl font-semibold md:text-6xl">
            {form.thank_you_title}
          </h1>

          <p className="mt-5 text-lg text-black/60">{form.thank_you_message}</p>
        </motion.div>
      </main>
    );
  }

  const question = form.questions[step];

  if (!question) return null;

  const value = values[question.id] || "";

  const progress = ((step + 1) / form.questions.length) * 100;

  const isChoiceQuestion =
    question.type === "multiple_choice" || question.type === "yes_no";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f5]">
      {/* -------------------------------- */}
      {/* Progress bar */}
      {/* -------------------------------- */}

      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-black/10">
        <motion.div
          className="h-full bg-black"
          initial={{
            width: 0,
          }}
          animate={{
            width: `${progress}%`,
          }}
          transition={{
            duration: 0.35,
          }}
        />
      </div>

      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}

      <header className="fixed left-0 right-0 top-1 z-40 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="text-sm font-semibold tracking-tight">{form.title}</div>

        <div className="text-sm text-black/50">
          {step + 1} / {form.questions.length}
        </div>
      </header>

      {/* -------------------------------- */}
      {/* Main question area */}
      {/* -------------------------------- */}

      <div className="flex min-h-screen items-center justify-center px-6 py-28 md:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -25,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="w-full max-w-3xl"
          >
            {/* Question number */}
            <div className="mb-7 flex items-center gap-3 text-sm font-medium">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-black text-white">
                {step + 1}
              </span>

              <span className="text-black/45">Question</span>
            </div>

            {/* Question title */}
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
              {question.title}

              {question.required && (
                <span className="ml-2 text-black/40">*</span>
              )}
            </h1>

            {/* Description */}
            {question.description && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/55">
                {question.description}
              </p>
            )}

            {/* -------------------------------- */}
            {/* Answer */}
            {/* -------------------------------- */}

            <div className="mt-12">
              {/* Multiple choice / Yes-No */}
              {isChoiceQuestion ? (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <motion.button
                      key={option.id}
                      type="button"
                      whileHover={{
                        x: 4,
                      }}
                      whileTap={{
                        scale: 0.99,
                      }}
                      onClick={() => {
                        setValues({
                          ...values,
                          [question.id]: option.label,
                        });

                        setError("");
                      }}
                      className={`group flex w-full max-w-2xl items-center rounded-xl border p-4 text-left text-lg transition md:text-xl ${
                        value === option.label
                          ? "border-black bg-black text-white"
                          : "border-black/15 bg-white hover:border-black/40"
                      }`}
                    >
                      <span
                        className={`mr-4 grid h-8 w-8 shrink-0 place-items-center rounded-md border text-sm ${
                          value === option.label
                            ? "border-white/30 bg-white/10"
                            : "border-black/15"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              ) : question.type === "dropdown" ? (
                /* Dropdown */
                <select
                  autoFocus
                  value={value}
                  onChange={(e) => {
                    setValues({
                      ...values,
                      [question.id]: e.target.value,
                    });

                    setError("");
                  }}
                  className="w-full max-w-2xl border-b-2 border-black/25 bg-transparent py-4 text-xl outline-none transition focus:border-black md:text-2xl"
                >
                  <option value="">Choose an answer</option>

                  {question.options.map((option) => (
                    <option key={option.id} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : question.type === "long_text" ? (
                /* Long text */
                <textarea
                  autoFocus
                  rows={4}
                  value={value}
                  onChange={(e) => {
                    setValues({
                      ...values,
                      [question.id]: e.target.value,
                    });

                    setError("");
                  }}
                  placeholder="Type your answer here..."
                  className="w-full max-w-2xl resize-none border-b-2 border-black/25 bg-transparent py-4 text-xl outline-none transition placeholder:text-black/25 focus:border-black md:text-2xl"
                />
              ) : question.type === "rating" ? (
                /* Rating */
                <div className="flex flex-wrap gap-3">
                  {[1, 2, 3, 4, 5].map((number) => (
                    <motion.button
                      key={number}
                      type="button"
                      whileHover={{
                        y: -3,
                      }}
                      whileTap={{
                        scale: 0.95,
                      }}
                      onClick={() => {
                        setValues({
                          ...values,
                          [question.id]: String(number),
                        });

                        setError("");
                      }}
                      className={`grid h-16 w-16 place-items-center rounded-xl border text-xl transition ${
                        value === String(number)
                          ? "border-black bg-black text-white"
                          : "border-black/15 bg-white hover:border-black/40"
                      }`}
                    >
                      {number}
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Short text / Email / Number */
                <input
                  autoFocus
                  type={
                    question.type === "email"
                      ? "email"
                      : question.type === "number"
                        ? "number"
                        : "text"
                  }
                  value={value}
                  onChange={(e) => {
                    setValues({
                      ...values,
                      [question.id]: e.target.value,
                    });

                    setError("");
                  }}
                  placeholder="Type your answer here..."
                  className="w-full max-w-2xl border-b-2 border-black/25 bg-transparent py-4 text-2xl outline-none transition placeholder:text-black/25 focus:border-black md:text-3xl"
                />
              )}
            </div>

            {/* -------------------------------- */}
            {/* Error */}
            {/* -------------------------------- */}

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  className="mt-4 text-sm font-medium text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* -------------------------------- */}
            {/* Navigation */}
            {/* -------------------------------- */}

            <div className="mt-9 flex items-center gap-4">
              <motion.button
                type="button"
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                disabled={submitting}
                onClick={next}
                className="rounded-lg bg-black px-6 py-3 text-base font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : step === form.questions.length - 1
                    ? "Submit"
                    : "OK"}

                {!submitting && <span className="ml-3 text-white/50">↵</span>}
              </motion.button>

              {step > 0 && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setStep((current) => current - 1);
                    setError("");
                  }}
                  className="rounded-lg px-4 py-3 text-sm text-black/50 transition hover:bg-black/5 hover:text-black disabled:opacity-40"
                >
                  ← Back
                </button>
              )}
            </div>

            {/* Keyboard hint */}
            <p className="mt-8 text-xs text-black/35">
              Press <strong>Enter ↵</strong> to continue
              {step > 0 && " · ↑ to go back"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
