"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  blogSlugHint,
  isValidBlogSlug,
  slugifyBlogTitle,
} from "@/lib/dashboard-blogs/helpers";
import type { BlogImageAsset, BlogStatus } from "@/lib/dashboard-blogs/types";

const BlogBodyEditor = dynamic(
  () => import("@/components/blogs/shared/blog-body-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[280px] rounded-lg border border-black/15 px-3 py-3 text-sm text-foreground/55">
        Loading editor...
      </div>
    ),
  },
);

const inputClassName =
  "rounded-lg border border-black/15 px-4 py-2 text-sm text-logo-bg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

type BlogEditorPanelProps = {
  backHref: string;
};

export function BlogEditorPanel({ backHref }: BlogEditorPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [images, setImages] = useState<BlogImageAsset[]>([]);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [blogDate, setBlogDate] = useState("");
  const [blogStatus, setBlogStatus] = useState<BlogStatus>("DRAFT");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const slugIsValid = isValidBlogSlug(blogSlug);
  const slugHint = blogSlugHint(blogSlug);
  const previewSlug = blogSlug.trim() || slugifyBlogTitle(blogTitle);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setIsLoading(true);
      try {
        const imagesRes = await fetch("/api/dashboard/blog-images");
        const imagesData = (await imagesRes.json()) as {
          ok?: boolean;
          error?: string;
          images?: BlogImageAsset[];
        };
        if (!imagesRes.ok || !imagesData.ok) {
          throw new Error(imagesData.error || "Unable to load images.");
        }
        if (!cancelled) setImages(imagesData.images ?? []);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Unable to load editor.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUploadImage(file: File) {
    if (isUploadingImage) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", file.name);

      const response = await fetch("/api/dashboard/blog-images", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        image?: BlogImageAsset;
      };
      if (!response.ok || !data.ok || !data.image) {
        throw new Error(data.error || "Upload failed.");
      }

      setImages((prev) => [data.image!, ...prev]);
      setSelectedImageUrl(data.image.publicUrl);
      setSelectedImageId(data.image.id);
      toast.success("Image uploaded (WebP).");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSaveBlog() {
    if (isSubmittingBlog) return;
    if (!blogTitle.trim()) {
      toast.error("Blog title is required.");
      return;
    }
    if (!slugIsValid) {
      toast.error("Fix the slug format before saving.");
      return;
    }
    if (!selectedImageUrl) {
      toast.error("One image is required.");
      return;
    }

    setIsSubmittingBlog(true);
    try {
      const response = await fetch("/api/dashboard/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blogTitle,
          slug: blogSlug,
          excerpt: blogExcerpt,
          status: blogStatus,
          seoTitle,
          seoDescription,
          category: blogCategory,
          dateLabel: blogDate,
          bodyHtml,
          coverImageUrl: selectedImageUrl,
          coverImageAssetId: selectedImageId,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        toast.error(data.error || "Unable to save blog.");
        return;
      }

      toast.success("Blog created.");
      router.push(backHref);
      router.refresh();
    } catch {
      toast.error("Unable to save blog.");
    } finally {
      setIsSubmittingBlog(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="inline-flex items-center gap-2 text-sm text-foreground/55">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading blog editor...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm md:p-6">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mb-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-logo-bg/70 transition-colors hover:text-logo-bg"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-dark">
          Create New Blog
        </p>
        <h1 className="mt-2 text-2xl font-bold text-logo-bg md:text-3xl">Blog Editor</h1>
        <p className="mt-3 text-sm text-foreground/55 md:text-base">
          Create blogs in the same structure/style currently shown on frontend blog pages.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm lg:col-span-8">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={blogTitle}
              onChange={(e) => {
                const nextTitle = e.target.value;
                setBlogTitle(nextTitle);
                if (!slugTouched) {
                  setBlogSlug(slugifyBlogTitle(nextTitle));
                }
              }}
              placeholder="Blog title"
              className={inputClassName}
            />
            <div>
              <input
                value={blogSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setBlogSlug(e.target.value);
                }}
                placeholder="Slug (optional)"
                aria-invalid={!slugIsValid}
                className={`${inputClassName} w-full ${!slugIsValid ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""}`}
              />
              <p
                className={`mt-1 text-xs ${slugIsValid ? "text-foreground/50" : "text-red-600"}`}
              >
                {slugHint}
              </p>
            </div>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO title (optional)"
              className={inputClassName}
            />
            <select
              value={blogStatus}
              onChange={(e) => setBlogStatus(e.target.value as BlogStatus)}
              className={inputClassName}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
            <input
              value={blogCategory}
              onChange={(e) => setBlogCategory(e.target.value)}
              placeholder="Category (e.g. Cargo Expedition)"
              className={inputClassName}
            />
            <input
              value={blogDate}
              onChange={(e) => setBlogDate(e.target.value)}
              placeholder="Date label (e.g. 24 Apr 2026)"
              className={inputClassName}
            />
          </div>

          <textarea
            value={blogExcerpt}
            onChange={(e) => setBlogExcerpt(e.target.value)}
            placeholder="Excerpt for blog cards"
            className={`mt-3 w-full ${inputClassName}`}
            rows={3}
          />
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="SEO description"
            className={`mt-3 w-full ${inputClassName}`}
            rows={2}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              disabled
              title="Preview will open the public /blog page after integration"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-foreground/40"
            >
              <ExternalLink size={15} />
              Preview on site
            </button>
            {previewSlug ? (
              <p className="text-xs text-foreground/45">Future URL: /blog/{previewSlug}</p>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-black/10 p-4">
            <p className="text-sm font-semibold text-logo-bg">Blog Body (WYSIWYG)</p>
            <div className="mt-3">
              <BlogBodyEditor editorKey="create" value={bodyHtml} onChange={setBodyHtml} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm lg:col-span-4">
          <p className="text-sm font-semibold text-logo-bg">Images Bucket</p>
          <p className="mt-1 text-xs text-foreground/55">
            Uploads are converted to WebP and served from /api/images (no Next image
            optimizer). Select one cover image.
          </p>

          <label
            className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 px-3 py-2 text-sm font-semibold text-logo-bg hover:bg-primary/10 ${
              isUploadingImage ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            {isUploadingImage ? (
              <Loader2 size={15} className="animate-spin" aria-hidden />
            ) : (
              <ImagePlus size={15} />
            )}
            {isUploadingImage ? "Uploading..." : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploadingImage || isSubmittingBlog}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await handleUploadImage(file);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Upload failed.");
                }
                e.currentTarget.value = "";
              }}
            />
          </label>

          <div className="mt-3 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {images.map((image) => {
              const isSelected =
                selectedImageId === image.id || selectedImageUrl === image.publicUrl;
              return (
                <div key={image.id} className="rounded-lg border border-black/10 p-2">
                  <div className="relative h-32 w-full overflow-hidden rounded-md">
                    <Image
                      src={image.publicUrl}
                      alt={image.altText ?? "Blog image"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSubmittingBlog}
                    onClick={() => {
                      setSelectedImageUrl(image.publicUrl);
                      setSelectedImageId(image.id);
                    }}
                    className={`mt-2 w-full cursor-pointer rounded-md px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? "bg-logo-bg text-white"
                        : "border border-black/15 text-logo-bg"
                    }`}
                  >
                    {isSelected ? "Selected Cover" : "Use as Cover"}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void handleSaveBlog()}
            disabled={isSubmittingBlog || isUploadingImage}
            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-logo-bg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmittingBlog ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Save size={16} />
            )}
            {isSubmittingBlog ? "Saving Blog..." : "Save Blog"}
          </button>
        </div>
      </div>
    </div>
  );
}
