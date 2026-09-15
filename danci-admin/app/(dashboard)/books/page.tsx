"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BOOK_LEVELS,
  BOOK_STATUSES,
  BOOK_STATUS_LABELS,
  useBooks,
  type BookStatus,
  type WordBook,
  type WordBookInput,
} from "@/lib/books";

type BookFormState = {
  name: string;
  description: string;
  wordCount: string;
  level: string;
  status: BookStatus;
};

const EMPTY_FORM: BookFormState = {
  name: "",
  description: "",
  wordCount: "0",
  level: BOOK_LEVELS[0],
  status: "draft",
};

const STATUS_BADGE_VARIANT: Record<
  BookStatus,
  "default" | "secondary" | "outline"
> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
});

export default function BooksPage() {
  const { books, createBook, updateBook, removeBook } = useBooks();
  const [keyword, setKeyword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WordBook | null>(null);
  const [form, setForm] = useState<BookFormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<WordBook | null>(null);

  const filteredBooks = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return books;
    return books.filter(
      (book) =>
        book.name.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term),
    );
  }, [books, keyword]);

  function openCreateDialog() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(book: WordBook) {
    setEditing(book);
    setForm({
      name: book.name,
      description: book.description,
      wordCount: String(book.wordCount),
      level: book.level,
      status: book.status,
    });
    setDialogOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      toast.error("请输入单词书名称");
      return;
    }

    const wordCount = Number(form.wordCount);
    if (!Number.isFinite(wordCount) || wordCount < 0) {
      toast.error("词汇量必须是不小于 0 的数字");
      return;
    }

    const input: WordBookInput = {
      name,
      description: form.description.trim(),
      wordCount: Math.floor(wordCount),
      level: form.level,
      status: form.status,
    };

    if (editing) {
      updateBook(editing.id, input);
      toast.success("单词书已更新");
    } else {
      createBook(input);
      toast.success("单词书已创建");
    }

    setDialogOpen(false);
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    removeBook(pendingDelete.id);
    toast.success(`已删除《${pendingDelete.name}》`);
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">单词书管理</h1>
          <p className="text-muted-foreground text-sm">
            维护单词书的创建、更新、删除与查询。
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusIcon />
          新建单词书
        </Button>
      </div>

      <div className="relative max-w-xs">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          className="pl-8"
          placeholder="搜索名称或简介"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>难度</TableHead>
              <TableHead className="text-right">词汇量</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  暂无单词书
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <div className="font-medium">{book.name}</div>
                    <div className="text-muted-foreground max-w-md truncate text-xs">
                      {book.description || "—"}
                    </div>
                  </TableCell>
                  <TableCell>{book.level}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {book.wordCount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[book.status]}>
                      {BOOK_STATUS_LABELS[book.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dateFormatter.format(new Date(book.createdAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`编辑 ${book.name}`}
                        onClick={() => openEditDialog(book)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`删除 ${book.name}`}
                        onClick={() => setPendingDelete(book)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? "编辑单词书" : "新建单词书"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "修改单词书的基础信息。"
                  : "填写单词书的基础信息以创建新的单词书。"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="book-name">名称</Label>
                <Input
                  id="book-name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="例如：四级核心词汇"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="book-description">简介</Label>
                <Input
                  id="book-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="一句话描述这本单词书"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="book-word-count">词汇量</Label>
                  <Input
                    id="book-word-count"
                    type="number"
                    min={0}
                    value={form.wordCount}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        wordCount: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>难度</Label>
                  <Select
                    value={form.level}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择难度" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOK_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>状态</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        status: value as BookStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOOK_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {BOOK_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">{editing ? "保存" : "创建"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除单词书</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除《{pendingDelete?.name}》吗？该操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
