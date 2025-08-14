'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AssetCategory, AssetSubmission, UploadType, IndustryTag, DesignStyle } from '@/types/asset';
import { Loader2, CheckCircle, AlertCircle, Upload, Link2, X, Eye, Building2, Palette } from 'lucide-react';

const categories: Array<{ value: AssetCategory; label: string }> = [
  { value: 'brand identity', label: 'Brand Identity' },
  { value: 'social media', label: 'Social Media' },
  { value: 'web design', label: 'Web Design' },
  { value: 'events & conferences', label: 'Events & Conferences' },
  { value: 'sales enablement', label: 'Sales Enablement' },
  { value: 'content marketing', label: 'Content Marketing' },
  { value: 'email marketing', label: 'Email Marketing' },
];

const industries: Array<{ value: IndustryTag; label: string }> = [
  { value: 'saas', label: 'SaaS' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'education', label: 'Education' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'professional services', label: 'Professional Services' },
  { value: 'cyber security', label: 'Cyber Security' },
  { value: 'ai', label: 'AI/ML' },
  { value: 'other', label: 'Other' }
];

const designStyles: Array<{ value: DesignStyle; label: string }> = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'playful', label: 'Playful' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'colorful', label: 'Colorful' },
  { value: 'monochrome', label: 'Monochrome' }
];

export function SubmissionForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<UploadType>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    category: '' as AssetCategory,
    tags: '',
    industry_tags: undefined as IndustryTag | undefined,
    design_style: [] as DesignStyle[],
    file_url: '',
    source_url: '',
    added_by: '',
    notes: '', // Curator's notes
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      setErrorMessage('Please select an image or PDF file.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');

    // Create preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadTypeChange = (type: UploadType) => {
    setUploadType(type);
    clearFile();
    setFormData(prev => ({ ...prev, file_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Validate required fields
      if (uploadType === 'file') {
        if (!selectedFile) {
          setErrorMessage('Please select a file to upload.');
          setIsSubmitting(false);
          return;
        }
      } else {
        // URL upload validation
        if (!formData.file_url) {
          setErrorMessage('Please provide a file URL.');
          setIsSubmitting(false);
          return;
        }
      }

      const submission: AssetSubmission = {
        title: formData.title,
        company: formData.company,
        category: formData.category,
        tags: formData.tags,
        industry_tags: formData.industry_tags,
        design_style: formData.design_style,
        upload_type: uploadType,
        source_url: formData.source_url,
        added_by: formData.added_by,
        notes: formData.notes || undefined, // Only include notes if provided
      };

      if (uploadType === 'url') {
        submission.file_url = formData.file_url;
      } else {
        submission.file = selectedFile!;
      }

      // Create FormData for file uploads
      const requestData = uploadType === 'file' ? new FormData() : null;
      
      if (requestData) {
        Object.entries(submission).forEach(([key, value]) => {
          if (value !== undefined) {
            if (value instanceof File) {
              requestData.append(key, value);
            } else if (Array.isArray(value)) {
              requestData.append(key, JSON.stringify(value));
            } else {
              requestData.append(key, String(value));
            }
          }
        });
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        ...(uploadType === 'url' 
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submission)
            }
          : { body: requestData }
        ),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          title: '',
          company: '',
          category: '' as AssetCategory,
          tags: '',
          industry_tags: undefined as IndustryTag | undefined,
          design_style: [] as DesignStyle[],
          file_url: '',
          source_url: '',
          added_by: '',
          notes: '',
        });
        clearFile();
      } else {
        const error = await response.json();
        console.error('Submission failed:', error);
        setSubmitStatus('error');
        setErrorMessage(error.error || 'Failed to submit asset');
      }
    } catch (err) {
      console.error('Network error during submission:', err);
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.title && formData.company && formData.category && 
                 formData.added_by && 
                 (uploadType === 'url' ? formData.file_url : selectedFile);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Your Design</CardTitle>
        <p className="text-sm text-gray-600">
          Share your B2B design work with the community. All submissions are reviewed before being published.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., SaaS Landing Page Redesign"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-1">
              Company *
            </label>
            <Input
              id="company"
              type="text"
              placeholder="e.g., Stripe, Notion, etc."
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category *
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as AssetCategory }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Industry Select */}
          <div>
            <label className="block text-sm font-medium mb-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                Industry (Optional)
              </div>
            </label>
            <Select
              value={formData.industry_tags || 'none'}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                industry_tags: value === 'none' ? undefined : value as IndustryTag 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Design Style */}
          <div>
            <label className="block text-sm font-medium mb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-gray-500" />
                Design Style (Optional)
              </div>
            </label>
            <div className="flex flex-wrap gap-2">
              {designStyles.map((style) => (
                <Toggle
                  key={style.value}
                  pressed={formData.design_style.includes(style.value)}
                  onPressedChange={(pressed) => {
                    if (pressed) {
                      setFormData(prev => ({
                        ...prev,
                        design_style: [...prev.design_style, style.value]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        design_style: prev.design_style.filter(s => s !== style.value)
                      }));
                    }
                  }}
                  className="data-[state=on]:bg-gray-100 data-[state=on]:border-gray-300 data-[state=on]:text-gray-700"
                  variant="outline"
                  size="sm"
                >
                  {style.label}
                </Toggle>
              ))}
            </div>
          </div>

          {/* Upload Type Toggle */}
          <div>
            <label className="block text-sm font-medium mb-3">Upload Method *</label>
            <div className="flex gap-2 mb-4">
              <Toggle
                pressed={uploadType === 'url'}
                onPressedChange={() => handleUploadTypeChange('url')}
                className="flex items-center gap-2"
              >
                <Link2 className="h-4 w-4" />
                From URL
              </Toggle>
              <Toggle
                pressed={uploadType === 'file'}
                onPressedChange={() => handleUploadTypeChange('file')}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Toggle>
            </div>
          </div>

          {/* File URL Input */}
          {uploadType === 'url' && (
            <div>
              <label htmlFor="file_url" className="block text-sm font-medium mb-1">
                File URL *
              </label>
              <Input
                id="file_url"
                type="url"
                placeholder="https://example.com/image.jpg or https://example.com/document.pdf"
                value={formData.file_url}
                onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Direct link to the image or PDF file
              </p>
            </div>
          )}

          {/* File Upload */}
          {uploadType === 'file' && (
            <div>
              <label htmlFor="file_upload" className="block text-sm font-medium mb-1">
                Upload File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={clearFile}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {previewUrl && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-32 mx-auto rounded border"
                        />
                      </div>
                    )}
                    
                    {selectedFile.type === 'application/pdf' && (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">PDF ready for upload</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Supports images (JPG, PNG, GIF, WebP) and PDF files (max 10MB)
              </p>
            </div>
          )}

          {/* Source URL */}
          <div>
            <label htmlFor="source_url" className="block text-sm font-medium mb-1">
              Source URL (Optional)
            </label>
            <Input
              id="source_url"
              type="url"
              placeholder="https://company.com/page (where this design appears live)"
              value={formData.source_url}
              onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
            />
          </div>

          {/* Curator's Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              Curator&apos;s Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Add any insights, context, or notes about this design..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Share insights about the design&apos;s effectiveness, context, or notable features (max 500 characters)
            </p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags (Optional)
            </label>
            <Input
              id="tags"
              type="text"
              placeholder="e.g., modern, clean, conversion, B2B SaaS"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Added By */}
          <div>
            <label htmlFor="added_by" className="block text-sm font-medium mb-1">
              Your Email *
            </label>
            <Input
              id="added_by"
              type="email"
              placeholder="your@email.com"
              value={formData.added_by}
              onChange={(e) => setFormData(prev => ({ ...prev, added_by: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              For communication about your submission (not displayed publicly)
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Review'
            )}
          </Button>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                Thanks! Your submission has been received and will be reviewed shortly.
              </span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}