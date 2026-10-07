import { Form, Question } from "./types";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!r.ok)
    throw new Error(
      (await r.json().catch(() => ({ detail: "Request failed" }))).detail,
    );
  return r.status === 204 ? (undefined as T) : r.json();
}
export const api = {
  forms: () => request<Form[]>("/forms", { cache: "no-store" }),
  form: (id: string) => request<Form>(`/forms/${id}`, { cache: "no-store" }),
  create: (title: string) =>
    request<Form>("/forms", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  update: (id: number, data: object) =>
    request<Form>(`/forms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: number) => request<void>(`/forms/${id}`, { method: "DELETE" }),
  duplicate: (id: number) =>
    request<Form>(`/forms/${id}/duplicate`, { method: "POST" }),
  publish: (id: number, action: "publish" | "unpublish") =>
    request<Form>(`/forms/${id}/${action}`, { method: "POST" }),
  addQuestion: (id: number, data: object) =>
    request<Question>(`/forms/${id}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateQuestion: (id: number, data: object) =>
    request<Question>(`/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteQuestion: (id: number) =>
    request<void>(`/questions/${id}`, { method: "DELETE" }),
  reorder: (id: number, ids: number[]) =>
    request(`/forms/${id}/questions/reorder`, {
      method: "PUT",
      body: JSON.stringify(ids),
    }),
  publicForm: (slug: string) =>
    request<Form>(`/public/forms/${slug}`, { cache: "no-store" }),
  submit: (slug: string, answers: object[]) =>
    request(`/public/forms/${slug}/responses`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  results: (id: string) =>
    request<any>(`/forms/${id}/results`, { cache: "no-store" }),
};
