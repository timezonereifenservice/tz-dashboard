"use client";

import { useEffect, useRef, useState } from "react";
import { FilePlus2, ImagePlus, X } from "lucide-react";
import type { BlogStatus } from "@/lib/blogs/types";
import type { ProjectId } from "@/lib/projects/config";
import styles from "./blogs.module.css";

type CreateBlogModalProps = {
  open: boolean;
  pending: boolean;
  projectId: ProjectId;
  projectName: string;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    bodyHtml: string;
    status: BlogStatus;
    seoTitle: string;
    seoDescription: string;
    coverFile: File;
  }) => Promise<void>;
};

export function CreateBlogModal({
  open,
  pending,
  projectId,
  projectName,
  onClose,
  onSubmit,
}: CreateBlogModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [status, setStatus] = useState<BlogStatus>("DRAFT");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setCategory("");
      setBodyHtml("");
      setStatus("DRAFT");
      setSeoTitle("");
      setSeoDescription("");
      setCoverFile(null);
      setCoverPreview(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!coverFile) {
      setError("Cover image is required.");
      return;
    }

    try {
      await onSubmit({
        title,
        slug,
        excerpt,
        category,
        bodyHtml,
        status,
        seoTitle,
        seoDescription,
        coverFile,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create blog.",
      );
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <form className={styles.modalCard} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div className={styles.modalIcon}>
              <FilePlus2 size={20} aria-hidden />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Create blog post</h2>
              <p className={styles.modalSubtitle}>
                Publish to the <strong>{projectName}</strong> database (
                {projectId === "tz-transport" ? "TZ Transport" : "Take & Bring"}).
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.modalClose}
            aria-label="Close"
            disabled={pending}
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="blog-title">
                Title <span className={styles.required}>*</span>
              </label>
              <input
                id="blog-title"
                required
                value={title}
                disabled={pending}
                className={styles.input}
                placeholder="Blog post title"
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="blog-slug">
                Slug
              </label>
              <input
                id="blog-slug"
                value={slug}
                disabled={pending}
                className={styles.input}
                placeholder="auto-generated-from-title"
                onChange={(event) => setSlug(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="blog-category">
                Category
              </label>
              <input
                id="blog-category"
                value={category}
                disabled={pending}
                className={styles.input}
                placeholder="General"
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="blog-status">
                Status
              </label>
              <select
                id="blog-status"
                value={status}
                disabled={pending}
                className={styles.select}
                onChange={(event) =>
                  setStatus(event.target.value as BlogStatus)
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="blog-excerpt">
              Excerpt
            </label>
            <textarea
              id="blog-excerpt"
              rows={2}
              value={excerpt}
              disabled={pending}
              className={styles.textarea}
              placeholder="Short summary for cards and SEO"
              onChange={(event) => setExcerpt(event.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="blog-body">
              Body (HTML) <span className={styles.required}>*</span>
            </label>
            <textarea
              id="blog-body"
              required
              rows={8}
              value={bodyHtml}
              disabled={pending}
              className={styles.textarea}
              placeholder="<p>Write your blog content as HTML...</p>"
              onChange={(event) => setBodyHtml(event.target.value)}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="blog-seo-title">
                SEO title
              </label>
              <input
                id="blog-seo-title"
                value={seoTitle}
                disabled={pending}
                className={styles.input}
                onChange={(event) => setSeoTitle(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="blog-seo-description">
                SEO description
              </label>
              <input
                id="blog-seo-description"
                value={seoDescription}
                disabled={pending}
                className={styles.input}
                onChange={(event) => setSeoDescription(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              Cover image <span className={styles.required}>*</span>
            </span>
            <div className={styles.uploadRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={pending}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} aria-hidden />
                {coverFile ? "Change image" : "Upload cover"}
              </button>
              {coverFile ? (
                <span className={styles.uploadMeta}>{coverFile.name}</span>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setCoverFile(file);
              }}
            />
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt=""
                className={styles.coverPreview}
              />
            ) : null}
          </div>

          {error ? <p className={styles.formError}>{error}</p> : null}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className={styles.primaryButton} disabled={pending}>
            {pending ? "Creating…" : "Create blog"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
