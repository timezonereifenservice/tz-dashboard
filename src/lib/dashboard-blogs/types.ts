export type BlogStatus = "DRAFT" | "PUBLISHED";

export type BlogImageAsset = {
  id: string;
  publicUrl: string;
  altText: string | null;
  createdAt: string;
};

export type DashboardBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: BlogStatus;
  seoTitle: string;
  seoDescription: string;
  category: string;
  dateLabel: string;
  bodyHtml: string;
  coverImageUrl: string;
  coverImageAssetId?: string | null;
  viewsCount: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogEditorInput = {
  title: string;
  slug: string;
  excerpt: string;
  status: BlogStatus;
  seoTitle: string;
  seoDescription: string;
  category: string;
  dateLabel: string;
  bodyHtml: string;
  coverImageUrl: string;
  coverImageAssetId?: string | null;
};
