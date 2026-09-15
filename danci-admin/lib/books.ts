"use client";

import { useMemo, useSyncExternalStore } from "react";

export type BookStatus = "published" | "draft" | "archived";

export type WordBook = {
  id: string;
  name: string;
  description: string;
  wordCount: number;
  level: string;
  status: BookStatus;
  createdAt: string;
};

export const BOOK_LEVELS = ["入门", "初级", "中级", "高级"] as const;

export const BOOK_STATUSES: BookStatus[] = ["published", "draft", "archived"];

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  published: "已发布",
  draft: "草稿",
  archived: "已归档",
};

export type WordBookInput = Omit<WordBook, "id" | "createdAt">;

const BOOKS_STORAGE_KEY = "danci.admin.books";

const SEED_BOOKS: WordBook[] = [
  {
    id: "book-cet4",
    name: "四级核心词汇",
    description: "大学英语四级高频核心词汇，覆盖听力与阅读常见词。",
    wordCount: 4500,
    level: "中级",
    status: "published",
    createdAt: "2026-02-11T02:20:00.000Z",
  },
  {
    id: "book-ielts",
    name: "雅思高频词汇",
    description: "雅思听说读写四项高频词汇，适合 6.5 分以上目标。",
    wordCount: 6000,
    level: "高级",
    status: "published",
    createdAt: "2026-02-18T06:05:00.000Z",
  },
  {
    id: "book-highschool",
    name: "高中英语必修词汇",
    description: "高中必修一到必修三全部课后单词，按单元整理。",
    wordCount: 3500,
    level: "初级",
    status: "draft",
    createdAt: "2026-03-02T09:40:00.000Z",
  },
  {
    id: "book-postgrad",
    name: "考研英语核心词汇",
    description: "考研英语一大纲词汇，含真题例句与词频标注。",
    wordCount: 5500,
    level: "高级",
    status: "archived",
    createdAt: "2026-03-09T12:15:00.000Z",
  },
];

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(BOOKS_STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

function parseBooks(raw: string): WordBook[] {
  if (!raw) return SEED_BOOKS;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WordBook[]) : SEED_BOOKS;
  } catch {
    return SEED_BOOKS;
  }
}

function writeBooks(books: WordBook[]) {
  window.localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(books));
  listeners.forEach((listener) => listener());
}

export function useBooks() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const books = useMemo(() => parseBooks(raw), [raw]);

  function createBook(input: WordBookInput) {
    const created: WordBook = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    writeBooks([created, ...books]);
  }

  function updateBook(id: string, input: WordBookInput) {
    writeBooks(
      books.map((book) => (book.id === id ? { ...book, ...input } : book)),
    );
  }

  function removeBook(id: string) {
    writeBooks(books.filter((book) => book.id !== id));
  }

  return { books, createBook, updateBook, removeBook };
}
