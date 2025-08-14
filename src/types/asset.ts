export type AssetCategory = 'brand identity' | 'social media' | 'web design' | 'events & conferences' | 'sales enablement' | 'content marketing' | 'email marketing';
export type FileType = 'image' | 'pdf';
export type UploadType = 'url' | 'file';
export type IndustryTag = 'saas' | 'fintech' | 'healthcare' | 'ecommerce' | 'education' | 'manufacturing' | 'consulting' | 'professional services' | 'cyber security' | 'ai' | 'other';
export type DesignStyle = 'minimal' | 'bold' | 'corporate' | 'playful' | 'modern' | 'classic' | 'colorful' | 'monochrome';

export interface Asset {
  id: string;
  title: string;
  company: string;
  category: AssetCategory;
  tags: string[];
  industry_tags?: IndustryTag;
  design_style: DesignStyle[];
  file_url: string;
  source_url?: string;
  made_by_db: boolean;
  created_at: string;
  added_by: string;
  approved: boolean;
  slug?: string; // Generated slug for SEO URLs
  // Additional fields for enhanced functionality
  brandName?: string; // Alias for company
  brandLogoUrl?: string;
  industry?: string; // Derived from industry_tags
  dateAdded?: string; // Alias for created_at
  imageUrl?: string; // Alias for file_url
  notes?: string; // Optional curator notes
  view_count?: number; // Number of views
}

// Enhanced types for navigation and recommendations
export interface SwipeTag {
  id: string;
  name: string;
  slug: string;
}

export interface SwipeNeighbor {
  id: string;
  slug: string;
  title: string;
}

export interface SwipePageProps {
  swipe: Asset;
  prevSwipe: SwipeNeighbor | null;
  nextSwipe: SwipeNeighbor | null;
  recommendations: Asset[];
}

export interface AssetSubmission {
  title: string;
  company: string;
  category: AssetCategory;
  tags: string;
  industry_tags?: IndustryTag;
  design_style: DesignStyle[];
  upload_type: UploadType;
  file_url?: string; // For URL uploads
  file?: File; // For direct file uploads
  source_url?: string;
  added_by: string;
  notes?: string; // Optional curator notes
}