"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function Results() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    api
      .results(id)
      .then(setData)
      .catch((err) => {
        setError(err.message || "Failed to load results");
      });
  }, [id]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Unable to load results</h1>

          <p className="mt-3 text-black/50">{error}</p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
          >
            Back to forms
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-black/50">Loading results…</p>
      </main>
    );
  }

  const { form, responses = [], stats = {} } = data;

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-6 md:p-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-black">
          formly
          <span className="text-green-600">.</span>
        </Link>

        <Link
          className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm hover:bg-black/[.03]"
          href={`/builder/${id}`}
        >
          ← Back to builder
        </Link>
      </header>

      <section className="mx-auto mt-14 max-w-6xl">
        <p className="text-sm text-black/50">Results</p>

        <h1 className="mt-1 text-4xl font-semibold">{form.title}</h1>

        <p className="mt-2 text-black/55">{responses.length} total responses</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Responses */}
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white lg:col-span-2">
            {responses.length > 0 ? (
              <div className="w-full overflow-x-auto rounded-xl">
                <table className="min-w-max w-full text-left text-sm">
                  <thead className="border-b bg-black/[.03]">
                    <tr>
                      <th className="sticky left-0 z-10 whitespace-nowrap border-r border-black/10 bg-[#f7f7f5] p-4">
                        Submitted
                      </th>

                      {form.questions.map((q: any) => (
                        <th key={q.id} className="min-w-48 max-w-64 p-4">
                          {q.title}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {responses.map((response: any) => {
                      const answers = response.answers || {};

                      return (
                        <tr
                          key={response.id}
                          className="cursor-pointer border-b last:border-0 hover:bg-black/[.025]"
                          onClick={() => setSelected(response)}
                        >
                          <td className="sticky left-0 z-10 whitespace-nowrap border-r border-black/10 bg-white p-4">
                            {new Date(
                              `${response.submitted_at}Z`,
                            ).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            })}
                          </td>

                          {form.questions.map((q: any) => (
                            <td
                              key={q.id}
                              className="max-w-64 truncate p-4"
                              title={answers[q.id] || "—"}
                            >
                              {answers[q.id] || "—"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-lg font-medium">No responses yet</p>

                <p className="mt-2 text-sm text-black/50">
                  Responses will appear here after someone submits your form.
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside>
            <h2 className="mb-4 text-lg font-semibold">Summary</h2>

            <div className="space-y-4">
              {form.questions.map((q: any) => {
                const questionStats = stats[q.id];

                if (!questionStats) {
                  return null;
                }

                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-black/10 bg-white p-5"
                  >
                    <p className="font-medium">{q.title}</p>

                    <div className="mt-4 space-y-2 text-sm">
                      {Object.entries(questionStats).map(([label, count]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="truncate text-black/60">
                            {label}
                          </span>

                          <b>{count as number}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>

        {/* Selected response */}
        {selected && (
          <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-black/45">Response</p>

                <h2 className="text-xl font-semibold">Individual response</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-2 text-sm text-black/50 hover:bg-black/5 hover:text-black"
              >
                Close ×
              </button>
            </div>

            <div className="mt-6 divide-y">
              {form.questions.map((q: any) => {
                const answers = selected.answers || {};

                return (
                  <div key={q.id} className="py-4">
                    <p className="text-sm text-black/50">{q.title}</p>

                    <p className="mt-1 font-medium">
                      {answers[q.id] || "No answer"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
