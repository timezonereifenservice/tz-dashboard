"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";

const BlogBodyEditor = dynamic(
  () => import("@/components/blogs/shared/blog-body-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[280px] rounded-lg border border-[#d3dce6] px-3 py-3 text-sm text-[#5b7185]">
        Loading editor...
      </div>
    ),
  },
);

type BlogImageAsset = {
  id: string;
  publicUrl: string;
  altText: string | null;
  createdAt: string;
};

type AdminBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string | null;
  seoDescription: string | null;
  coverImageAssetId: string | null;
  contentJson: unknown;
  imageUsages?: Array<{ imageAssetId?: string }>;
};

type CreateNewBlogPanelProps = {
  backHref: string;
  blogId?: string;
};

export function CreateNewBlogPanel({ backHref, blogId }: CreateNewBlogPanelProps) {
  const router = useRouter();
  const isEditMode = Boolean(blogId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);
  const [images, setImages] = useState<BlogImageAsset[]>([]);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSlug, setBlogSlug] = useState("");
  const [blogExcerpt, setBlogExcerpt] = useState("");
  const [blogCategory, setBlogCategory] = useState("");
  const [blogDate, setBlogDate] = useState("");
  const [blogStatus, setBlogStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [coverImageAssetId, setCoverImageAssetId] = useState<string | null>(null);

  async function loadInitialData() {
    setIsLoading(true);
    try {
      const imagesRes = await fetch("/api/admin/blog-images");
      const imagesData = (await imagesRes.json()) as {
        images?: BlogImageAsset[];
        message?: string;
      };

      if (!imagesRes.ok) throw new Error(imagesData.message ?? "Unable to load images.");
      setImages(imagesData.images ?? []);

      if (blogId) {
        const blogRes = await fetch(`/api/admin/blogs/${blogId}`);
        const blogData = (await blogRes.json()) as {
          blog?: AdminBlog;
          message?: string;
        };
        if (!blogRes.ok || !blogData.blog) {
          throw new Error(blogData.message ?? "Unable to load blog.");
        }

        const blog = blogData.blog;
        const content =
          blog.contentJson && typeof blog.contentJson === "object"
            ? (blog.contentJson as Record<string, unknown>)
            : {};

        setBlogTitle(blog.title);
        setBlogSlug(blog.slug);
        setBlogExcerpt(blog.excerpt ?? "");
        setBlogStatus(blog.status);
        setSeoTitle(blog.seoTitle ?? "");
        setSeoDescription(blog.seoDescription ?? "");
        setCoverImageAssetId(blog.coverImageAssetId ?? null);
        const firstImageId =
          blog.imageUsages?.[0]?.imageAssetId ?? blog.coverImageAssetId;
        setSelectedImageIds(firstImageId ? [firstImageId] : []);
        setBlogCategory(typeof content.category === "string" ? content.category : "");
        setBlogDate(typeof content.date === "string" ? content.date : "");
        setBodyHtml(typeof content.bodyHtml === "string" ? content.bodyHtml : "");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load blog editor data.",
      );
      if (blogId) router.replace(backHref);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when switching create vs edit
  }, [blogId]);

  async function handleUploadImage(file: File) {
    const form = new FormData();
    form.append("file", file);

    const response = await fetch("/api/admin/blog-images", {
      method: "POST",
      body: form,
    });
    const data = (await response.json()) as {
      image?: BlogImageAsset;
      message?: string;
    };
    if (!response.ok || !data.image) {
      throw new Error(data.message ?? "Unable to upload image.");
    }

    setImages((prev) => [data.image as BlogImageAsset, ...prev]);
    toast.success("Image uploaded and converted to WebP.");
  }

  async function handleSaveBlog() {
    if (!blogTitle.trim()) {
      toast.error("Blog title is required.");
      return;
    }
    if (!selectedImageIds.length) {
      toast.error("One image is required.");
      return;
    }

    setIsSubmittingBlog(true);
    try {
      const imageId = selectedImageIds[0];
      const endpoint = isEditMode ? `/api/admin/blogs/${blogId}` : "/api/admin/blogs";
      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blogTitle,
          slug: blogSlug,
          excerpt: blogExcerpt,
          status: blogStatus,
          seoTitle,
          seoDescription,
          selectedImageIds: [imageId],
          coverImageAssetId: coverImageAssetId ?? imageId,
          contentJson: {
            category: blogCategory,
            date: blogDate,
            bodyHtml,
          },
        }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(
          data.message ?? `Unable to ${isEditMode ? "update" : "create"} blog.`,
        );
      }

      toast.success(isEditMode ? "Blog updated." : "Blog created.");
      router.push(backHref);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to ${isEditMode ? "update" : "create"} blog.`,
      );
    } finally {
      setIsSubmittingBlog(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <p className="text-sm text-[#4a6278]">Loading blog editor...</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white p-5 shadow-lg md:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f4f84]">
          {isEditMode ? "Edit Blog" : "Create New Blog"}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#102738] md:text-3xl">Blog Editor</h1>
        <p className="mt-3 text-sm text-[#4a6278] md:text-base">
          {isEditMode
            ? "Update this blog post. All fields are prefilled with the current content."
            : "Create blogs in the same structure/style currently shown on frontend blog pages."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="rounded-2xl bg-white p-5 shadow-lg lg:col-span-8">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="Blog title"
              className="rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            />
            <input
              value={blogSlug}
              onChange={(e) => setBlogSlug(e.target.value)}
              placeholder="Slug (optional)"
              className="rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            />
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO title (optional)"
              className="rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            />
            <select
              value={blogStatus}
              onChange={(e) => setBlogStatus(e.target.value as "DRAFT" | "PUBLISHED")}
              className="rounded-lg border border-[#d3dce6] px-3 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
            <input
              value={blogCategory}
              onChange={(e) => setBlogCategory(e.target.value)}
              placeholder="Category (e.g. Cargo Expedition)"
              className="rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            />
            <input
              value={blogDate}
              onChange={(e) => setBlogDate(e.target.value)}
              placeholder="Date label (e.g. 24 Apr 2026)"
              className="rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            />
          </div>

          <textarea
            value={blogExcerpt}
            onChange={(e) => setBlogExcerpt(e.target.value)}
            placeholder="Excerpt for blog cards"
            className="mt-3 w-full rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            rows={3}
          />
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="SEO description"
            className="mt-3 w-full rounded-lg border border-[#d3dce6] px-4 py-2 text-sm text-[#102738] outline-none focus:border-[#3fb7e3]"
            rows={2}
          />

          <div className="mt-4 rounded-xl border border-[#e2ebf5] p-4">
            <p className="text-sm font-semibold text-[#102738]">Blog Body (WYSIWYG)</p>
            <div className="mt-3">
              <BlogBodyEditor
                editorKey={blogId ?? "create"}
                value={bodyHtml}
                onChange={setBodyHtml}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-lg lg:col-span-4">
          <p className="text-sm font-semibold text-[#102738]">Images Bucket</p>
          <p className="mt-1 text-xs text-[#5b7185]">
            Select one image for this blog. Images are converted to WebP on upload.
          </p>

          <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#a9bfd6] px-3 py-2 text-sm font-semibold text-[#183650]">
            <ImagePlus size={15} />
            Upload Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
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
              const isSelected = selectedImageIds.includes(image.id);
              return (
                <div key={image.id} className="rounded-lg border border-[#e2ebf5] p-2">
                  <div className="relative h-32 w-full overflow-hidden rounded-md">
                    <Image
                      src={image.publicUrl}
                      alt={image.altText ?? "Blog image"}
                      fill
                      className="object-cover"
                      unoptimized={image.publicUrl.startsWith("/api/")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageIds([image.id]);
                      setCoverImageAssetId(image.id);
                    }}
                    className={`mt-2 w-full rounded-md px-2 py-1 text-xs font-semibold ${
                      isSelected
                        ? "bg-[#183650] text-white"
                        : "border border-[#d3dce6] text-[#102738]"
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
            onClick={handleSaveBlog}
            disabled={isSubmittingBlog}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#183650] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            <Save size={16} />
            {isSubmittingBlog
              ? isEditMode
                ? "Updating Blog..."
                : "Saving Blog..."
              : isEditMode
                ? "Update Blog"
                : "Save Blog"}
          </button>
        </div>
      </div>
    </>
  );
}
