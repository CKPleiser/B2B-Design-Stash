import { NextRequest, NextResponse } from 'next/server';
import { nocoDBService } from '@/lib/nocodb';
import { AssetSubmission } from '@/types/asset';

export async function POST(request: NextRequest) {
  try {
    console.log('Received submission request');
    const contentType = request.headers.get('content-type');
    console.log('Content type:', contentType);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    let submission: AssetSubmission;

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      
      body = {
        title: formData.get('title') as string,
        company: formData.get('company') as string,
        category: formData.get('category') as string,
        tags: formData.get('tags') as string || '',
        industry_tags: formData.get('industry_tags') as string || undefined,
        design_style: formData.get('design_style') ? JSON.parse(formData.get('design_style') as string) : [],
        upload_type: formData.get('upload_type') as string,
        source_url: formData.get('source_url') as string,
        added_by: formData.get('added_by') as string,
        file: formData.get('file') as File,
      };

      submission = {
        title: body.title,
        company: body.company,
        category: body.category,
        tags: body.tags,
        industry_tags: body.industry_tags,
        design_style: body.design_style,
        upload_type: body.upload_type,
        source_url: body.source_url,
        added_by: body.added_by,
        file: body.file,
      };
    } else {
      // Handle URL submission
      body = await request.json();
      
      submission = {
        title: body.title,
        company: body.company,
        category: body.category,
        tags: body.tags || '',
        industry_tags: body.industry_tags || undefined,
        design_style: body.design_style || [],
        upload_type: body.upload_type,
        file_url: body.file_url,
        source_url: body.source_url,
        added_by: body.added_by,
      };
    }
    
    // Validate required fields
    const requiredFields = ['title', 'company', 'category', 'added_by'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate upload type specific fields
    if (body.upload_type === 'url' && !body.file_url) {
      return NextResponse.json(
        { error: 'File URL is required for URL uploads' },
        { status: 400 }
      );
    }

    if (body.upload_type === 'file' && !body.file) {
      return NextResponse.json(
        { error: 'File is required for file uploads' },
        { status: 400 }
      );
    }

    console.log('Submitting asset to NocoDB:', submission);
    const success = await nocoDBService.submitAsset(submission);
    console.log('Submission result:', success);

    if (success) {
      return NextResponse.json({ message: 'Asset submitted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to submit asset' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in /api/submit:', error);
    return NextResponse.json(
      { error: 'Failed to submit asset' },
      { status: 500 }
    );
  }
}