"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Form } from "@/lib/types";
import { Toast } from "@/components/Toast";
export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([]),
    [toast, setToast] = useState(""),
    [loading, setLoading] = useState(true);
  const router = useRouter();
  const load = () =>
    api
      .forms()
      .then(setForms)
      .catch((e) => setToast(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const create = async () => {
    try {
      const f = await api.create("Untitled form");
      router.push(`/builder/${f.id}`);
    } catch (e: any) {
      setToast(e.message);
    }
  };
  const action = async (fn: () => Promise<any>, message: string) => {
    try {
      await fn();
      setToast(message);
      load();
    } catch (e: any) {
      setToast(e.message);
    }
  };
  return (
    <main className="min-h-screen p-6 md:p-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight">
          formly<span className="text-green-600">.</span>
        </Link>
        <button className="btn" onClick={create}>
          + Create a form
        </button>
      </header>
      <section className="mx-auto mt-16 max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-black/45">
          Workspace
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Your forms</h1>
        {loading ? (
          <p className="mt-12">Loading forms…</p>
        ) : forms.length === 0 ? (
          <div className="card mt-8 p-12 text-center">
            <h2 className="text-2xl font-semibold">Your workspace is empty</h2>
            <p className="mt-2 text-black/55">
              Create a form to start collecting answers.
            </p>
            <button className="btn mt-6" onClick={create}>
              Create a form
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {forms.map((f) => (
              <article
                key={f.id}
                className="card flex flex-col gap-4 p-5 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/builder/${f.id}`}
                    className="text-xl font-semibold hover:underline"
                  >
                    {f.title}
                  </Link>
                  <p className="mt-1 text-sm text-black/50">
                    {f.response_count} responses ·{" "}
                    <span
                      className={
                        f.status === "published" ? "text-green-700" : ""
                      }
                    >
                      {f.status}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-light" href={`/builder/${f.id}`}>
                    Edit
                  </Link>
                  <Link className="btn-light" href={`/results/${f.id}`}>
                    Results
                  </Link>
                  <button
                    className="btn-light"
                    onClick={() => {
                      const n = prompt("New form name", f.title);
                      if (n)
                        action(
                          () => api.update(f.id, { title: n }),
                          "Form renamed",
                        );
                    }}
                  >
                    Rename
                  </button>
                  <button
                    className="btn-light"
                    onClick={() =>
                      action(() => api.duplicate(f.id), "Form duplicated")
                    }
                  >
                    Duplicate
                  </button>
                  <button
                    className="btn-light"
                    onClick={() =>
                      action(
                        () =>
                          api.publish(
                            f.id,
                            f.status === "published" ? "unpublish" : "publish",
                          ),
                        f.status === "published" ? "Unpublished" : "Published",
                      )
                    }
                  >
                    {f.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="btn-light text-red-600"
                    onClick={() =>
                      confirm(`Delete ${f.title}?`) &&
                      action(() => api.remove(f.id), "Form deleted")
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </main>
  );
}
