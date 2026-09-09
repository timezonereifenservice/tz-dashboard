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

type CreateNewBlogPanelProps = {
  backHref: string;
};

export function CreateNewBlogPanel({ backHref }: CreateNewBlogPanelProps) {
  const router = useRouter();
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load blog editor data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

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

  async function handleCreateBlog() {
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
      const response = await fetch("/api/admin/blogs", {
        method: "POST",
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
        throw new Error(data.message ?? "Unable to create blog.");
      }

      toast.success("Blog created.");
      router.push(backHref);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create blog.");
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
          Create New Blog
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#102738] md:text-3xl">Blog Editor</h1>
        <p className="mt-3 text-sm text-[#4a6278] md:text-base">
          Create blogs in the same structure/style currently shown on frontend blog pages.
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
              <BlogBodyEditor editorKey="create" value={bodyHtml} onChange={setBodyHtml} />
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
            onClick={handleCreateBlog}
            disabled={isSubmittingBlog}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#183650] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            <Save size={16} />
            {isSubmittingBlog ? "Saving Blog..." : "Save Blog"}
          </button>
        </div>
      </div>
    </>
  );
}
