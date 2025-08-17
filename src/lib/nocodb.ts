import { Asset, AssetSubmission } from '@/types/asset';
import { generateSlug } from './utils';

const NOCODB_API_URL = process.env.NOCODB_API_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;

if (!NOCODB_API_URL || !NOCODB_API_TOKEN) {
  console.warn('NocoDB configuration missing. Please add NOCODB_API_URL and NOCODB_API_TOKEN to your environment variables.');
}

class NocoDBService {
  private baseURL: string;
  private headers: HeadersInit;

  constructor() {
    this.baseURL = NOCODB_API_URL || '';
    this.headers = {
      'Content-Type': 'application/json',
      'xc-token': NOCODB_API_TOKEN || '',
    };
  }

  async getAssets(filters?: {
    category?: string;
    search?: string;
    made_by_db?: boolean;
    industry?: string;
    design_styles?: string[];
  }): Promise<Asset[]> {
    try {
      // Use the existing URL but modify parameters if needed
      const urlObj = new URL(this.baseURL);
      
      // Build filter conditions
      const whereConditions: string[] = [];
      
      // In development mode, show all assets including unapproved ones
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Only filter for approved assets in production
      if (!isDevelopment) {
        whereConditions.push('(approved,eq,1)');
      }
      
      if (filters?.category && filters.category !== 'all') {
        whereConditions.push(`(category,eq,${filters.category})`);
      }
      
      if (filters?.made_by_db) {
        whereConditions.push('(made_by_db,eq,1)');
      }
      
      if (filters?.search) {
        whereConditions.push(`(title,like,${filters.search})`);
      }
      
      if (filters?.industry) {
        whereConditions.push(`(industry_tags,eq,${filters.industry})`);
      }
      
      if (filters?.design_styles && filters.design_styles.length > 0) {
        // For multi-select fields, we need to check if any of the selected styles are present
        const styleConditions = filters.design_styles.map(style => `(design_style,like,%${style}%)`);
        whereConditions.push(`(${styleConditions.join('~or')})`);
      }
      
      // Combine conditions with AND
      if (whereConditions.length > 0) {
        urlObj.searchParams.set('where', whereConditions.join('~and'));
      }
      
      // Set a higher limit to get more assets
      urlObj.searchParams.set('limit', '1000');
      
      const url = urlObj.toString();

      const response = await fetch(url, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the data to match our Asset interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.list?.map((item: any) => this.transformAssetData(item)) || [];
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  }

  async submitAsset(submission: AssetSubmission): Promise<boolean> {
    try {
      // Extract the base URL and construct the submission endpoint
      // Your URL: https://nocodb.designbuffs.com/api/v2/tables/ml1s3e6w8vz94qg/records?offset=0&limit=25&where=&viewId=vws4j485p20ystgs
      // We need: https://nocodb.designbuffs.com/api/v2/tables/ml1s3e6w8vz94qg/records
      const urlParts = this.baseURL.split('?')[0]; // Remove query parameters
      const submitUrl = urlParts;
      
      console.log('Submit URL:', submitUrl);
      
      let response: Response;

      if (submission.upload_type === 'file' && submission.file) {
        console.log('Processing file upload:', {
          fileName: submission.file.name,
          fileType: submission.file.type,
          fileSize: submission.file.size
        });
        
        // For now, let's create the record with JSON first, then handle file upload separately
        // This approach is more reliable with NocoDB
        
        const recordData = {
          title: submission.title,
          company: submission.company,
          category: submission.category,
          tags: submission.tags,
          industry_tags: submission.industry_tags || null,
          design_style: submission.design_style.join(',') || null,
          source_url: submission.source_url || null,
          made_by_db: 0,
          approved: 0,
          added_by: submission.added_by,
          notes: submission.notes || null,
          // We'll set file_url after uploading the file
        };

        console.log('Creating record first with data:', recordData);

        // Create the record first
        const recordResponse = await fetch(submitUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(recordData),
        });

        if (!recordResponse.ok) {
          console.error('Failed to create record:', await recordResponse.text());
          return false;
        }

        const recordResult = await recordResponse.json();
        console.log('Record created:', recordResult);

        // Step 1: Upload file to NocoDB storage first
        console.log('Step 1: Uploading file to NocoDB storage...');
        const uploadedFileData = await this.uploadFileToStorage(submission.file);
        
        if (!uploadedFileData) {
          console.error('File upload failed, but record was created');
          return true; // Record was still created successfully
        } else {
          console.log('Step 2: Updating record with uploaded file...');
          
          // Step 2: Update the record with the uploaded file data
          const recordId = recordResult.Id || recordResult.id;
          const updateSuccess = await this.updateRecordWithFile(recordId, uploadedFileData);
          
          if (updateSuccess) {
            console.log('File attached to record successfully');
          } else {
            console.warn('Failed to attach file to record, but file was uploaded and record created');
          }
          
          // File upload completed, return success
          return true;
        }
      } else {
        // Handle URL submission
        const submissionData = {
          title: submission.title,
          company: submission.company,
          category: submission.category,
          tags: submission.tags,
          industry_tags: submission.industry_tags || null,
          design_style: submission.design_style.join(',') || null,
          file_url: submission.file_url,
          source_url: submission.source_url || null,
          made_by_db: 0, // Use 0 instead of false
          approved: 0,   // Use 0 instead of false
          added_by: submission.added_by,
          notes: submission.notes || null,
        };

        console.log('Sending URL submission data:', submissionData);

        response = await fetch(submitUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(submissionData),
        });

        const responseText = await response.text();
        console.log('NocoDB response body:', responseText);

        if (!response.ok) {
          console.error('NocoDB submission failed:', response.status, responseText);
          return false;
        }

        console.log('NocoDB submission successful');
        return true;
      }
    } catch (error) {
      console.error('Error submitting asset:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async uploadFileToStorage(file: File): Promise<any> {
    try {
      const uploadUrl = `https://nocodb.designbuffs.com/api/v2/storage/upload`;
      
      console.log('Uploading file to storage:', uploadUrl);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'xc-token': (this.headers as Record<string, string>)['xc-token']
        },
        body: formData,
      });

      console.log('Storage upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Storage upload failed:', errorText);
        return null;
      }

      const result = await response.json();
      console.log('Storage upload result:', result);
      return result;
    } catch (error) {
      console.error('Error uploading to storage:', error);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async updateRecordWithFile(recordId: string, fileData: any): Promise<boolean> {
    try {
      const tableId = 'ml1s3e6w8vz94qg';
      const updateUrl = `https://nocodb.designbuffs.com/api/v2/tables/${tableId}/records`;
      
      console.log('Updating record with file data:', updateUrl);

      // Format the file data for the attachment field - use the correct format
      const updateData = {
        Id: recordId,
        file_url: fileData // Just pass the file data directly, not wrapped in array
      };

      console.log('Update data:', updateData);

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': (this.headers as Record<string, string>)['xc-token']
        },
        body: JSON.stringify(updateData),
      });

      console.log('Record update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Record update failed:', errorText);
        return false;
      }

      const result = await response.json();
      console.log('Record update result:', result);
      return true;
    } catch (error) {
      console.error('Error updating record with file:', error);
      return false;
    }
  }

  // Get a single asset by ID
  async getAssetById(id: string): Promise<Asset | null> {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const urlObj = new URL(this.baseURL);
      
      // In development, show all assets; in production, only approved ones
      if (isDevelopment) {
        urlObj.searchParams.set('where', `(Id,eq,${id})`);
      } else {
        urlObj.searchParams.set('where', `(Id,eq,${id})~and(approved,eq,1)`);
      }
      
      const response = await fetch(urlObj.toString(), {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.list && data.list.length > 0) {
        return this.transformAssetData(data.list[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching asset by ID:', error);
      return null;
    }
  }

  // Get a single asset by slug
  async getAssetBySlug(slug: string): Promise<Asset | null> {
    try {
      // First, fetch all assets with a high limit to ensure we get all of them
      const urlObj = new URL(this.baseURL);
      
      // Set a high limit to get all assets (adjust if you have more than 1000)
      urlObj.searchParams.set('limit', '1000');
      
      // Remove any offset to start from the beginning
      urlObj.searchParams.delete('offset');
      
      // In development mode, show all assets including unapproved ones
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      const response = await fetch(urlObj.toString(), {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.list) {
        // Transform all assets and find the one with matching slug
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const assets = data.list.map((item: any) => this.transformAssetData(item));
        const asset = assets.find((asset: Asset) => asset.slug === slug) || null;
        
        // If we found an asset, check if it should be shown based on approval status
        if (asset) {
          // In production, only show approved assets
          if (!isDevelopment && !asset.approved) {
            console.log(`Asset found but not approved: ${asset.title} (ID: ${asset.id}, approved: ${asset.approved})`);
            return null;
          }
          
          // Log if we found an unapproved asset in development
          if (!asset.approved && isDevelopment) {
            console.log(`[DEV] Showing unapproved asset: ${asset.title} (ID: ${asset.id}, approved: ${asset.approved})`);
          }
          
          console.log(`Asset found: ${asset.title} (ID: ${asset.id}, approved: ${asset.approved}, slug: ${asset.slug})`);
          return asset;
        } else {
          console.log(`No asset found with slug: ${slug}`);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching asset by slug:', error);
      return null;
    }
  }

  // Increment view count for an asset
  async incrementViewCount(assetId: string): Promise<boolean> {
    try {
      console.log('Attempting to increment view count for asset:', assetId);
      
      // First, get the current asset to get its current view count
      const getUrl = `${this.baseURL.split('?')[0]}/${assetId}`;
      console.log('Fetching current asset from:', getUrl);
      
      const getResponse = await fetch(getUrl, {
        headers: this.headers,
      });

      if (!getResponse.ok) {
        const errorText = await getResponse.text();
        console.error('Failed to fetch asset for view count update. Status:', getResponse.status, 'Error:', errorText);
        return false;
      }

      const currentAsset = await getResponse.json();
      const currentViewCount = currentAsset.view_count || 0;
      console.log('Current view count:', currentViewCount);

      // Update with incremented view count using the same pattern as updateRecordWithFile
      const updateUrl = this.baseURL.split('?')[0]; // Use base records endpoint
      const newViewCount = currentViewCount + 1;
      console.log('Updating view count to:', newViewCount, 'at URL:', updateUrl);
      
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          Id: assetId, // Include the ID in the body
          view_count: newViewCount
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update view count. Status:', updateResponse.status, 'Error:', errorText);
        return false;
      }

      console.log('Successfully updated view count to:', newViewCount);
      return true;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      return false;
    }
  }

  // Get assets for static generation (most popular/recent)
  async getAssetsForStaticGeneration(limit: number = 50): Promise<Asset[]> {
    try {
      // Check if we have the required configuration
      const headers = this.headers as Record<string, string>;
      if (!this.baseURL || !headers['xc-token']) {
        console.warn('NocoDB configuration missing, skipping static generation');
        return [];
      }

      const urlObj = new URL(this.baseURL);
      urlObj.searchParams.set('where', '(approved,eq,1)');
      urlObj.searchParams.set('limit', limit.toString());
      urlObj.searchParams.set('sort', '-created_at'); // Sort by newest first
      
      const response = await fetch(urlObj.toString(), {
        headers: this.headers,
        // Add timeout for build-time requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        console.warn(`NocoDB not accessible during build (${response.status}), skipping pre-generation`);
        return [];
      }

      const data = await response.json();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.list?.map((item: any) => this.transformAssetData(item)) || [];
    } catch {
      // This is expected during build when database isn't accessible
      console.warn('Database not accessible during build, will use ISR on-demand generation');
      return [];
    }
  }

  // Transform raw NocoDB data to Asset interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformAssetData(item: any): Asset {
    const id = item.Id || item.id;
    const title = item.title || '';
    const company = item.company || '';
    const category = item.category || '';
    const tags = item.tags ? item.tags.split(',').map((tag: string) => tag.trim()) : [];
    const primaryTag = tags.length > 0 ? tags[0] : undefined;
    
    return {
      id: id,
      title: title,
      company: company,
      category: category,
      tags: tags,
      industry_tags: item.industry_tags || undefined,
      design_style: item.design_style ? (Array.isArray(item.design_style) ? item.design_style : item.design_style.split(',').map((style: string) => style.trim())) : [],
      file_url: this.extractFileUrl(item.file_url),
      source_url: item.source_url,
      made_by_db: Boolean(item.made_by_db),
      created_at: item.created_at || new Date().toISOString(),
      added_by: item.added_by,
      approved: Boolean(item.approved),
      // Use slug from database if available, otherwise generate SEO-friendly slug
      slug: item.slug || generateSlug(title, company, id, category, primaryTag),
      notes: item.notes || item.Notes || undefined, // Handle both lowercase and capitalized field names
      view_count: item.view_count || item.views || 0, // Handle view count field
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractFileUrl(fileData: any): string {
    if (!fileData) return '';
    
    // If it's already a string URL, return it
    if (typeof fileData === 'string') {
      // If it's already a full URL, return as-is
      if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
        return fileData;
      }
      // If it's a path, construct the full URL with proper endpoint
      // Check if it looks like a storage path
      if (fileData.startsWith('download/') || fileData.startsWith('dltemp/')) {
        return `https://nocodb.designbuffs.com/${fileData}`;
      }
      // Otherwise use the storage endpoint
      return `https://nocodb.designbuffs.com/storage/${fileData}`;
    }
    
    // If it's an array (NocoDB attachment format)
    if (Array.isArray(fileData) && fileData.length > 0) {
      const file = fileData[0];
      
      // Try different possible URL fields in order of preference
      // signedUrl is the most recent field name for temporary signed URLs
      if (file.signedUrl) {
        return file.signedUrl;
      }
      
      if (file.url) {
        return file.url;
      }
      
      if (file.signedPath) {
        // signedPath is always relative, needs the domain prepended
        if (file.signedPath.startsWith('http://') || file.signedPath.startsWith('https://')) {
          return file.signedPath;
        }
        // NocoDB signed paths start with dltemp/ or similar
        return `https://nocodb.designbuffs.com/${file.signedPath}`;
      }
      
      if (file.path) {
        // Regular path (not signed) - use download endpoint
        if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
          return file.path;
        }
        // For regular paths that start with 'download/', keep as is
        if (file.path.startsWith('download/')) {
          return `https://nocodb.designbuffs.com/${file.path}`;
        }
        // Otherwise use storage endpoint
        return `https://nocodb.designbuffs.com/storage/${file.path}`;
      }
    }
    
    // If it's an object with URL properties
    if (fileData.signedUrl) {
      return fileData.signedUrl;
    }
    
    if (fileData.url) {
      return fileData.url;
    }
    
    if (fileData.signedPath) {
      if (fileData.signedPath.startsWith('http://') || fileData.signedPath.startsWith('https://')) {
        return fileData.signedPath;
      }
      return `https://nocodb.designbuffs.com/${fileData.signedPath}`;
    }
    
    if (fileData.path) {
      if (fileData.path.startsWith('http://') || fileData.path.startsWith('https://')) {
        return fileData.path;
      }
      return `https://nocodb.designbuffs.com/storage/${fileData.path}`;
    }
    
    console.warn('Could not extract file URL from:', fileData);
    return '';
  }
}

export const nocoDBService = new NocoDBService();