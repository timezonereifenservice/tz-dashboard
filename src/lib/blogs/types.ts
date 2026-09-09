export type BlogStatus = "DRAFT" | "PUBLISHED";

export type CreateBlogInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  status?: BlogStatus;
  seoTitle?: string;
  seoDescription?: string;
  category?: string;
  dateLabel?: string;
  bodyHtml: string;
  coverImageAssetId: string;
  coverImageUrl: string;
};

export type UploadedBlogImage = {
  id: string;
  publicUrl: string;
  altText: string | null;
};

export type CreatedBlog = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  publishedAt: string | null;
  updatedAt: string;
};
