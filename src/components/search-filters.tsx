'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Building2, Palette, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { AssetCategory, IndustryTag, DesignStyle } from '@/types/asset';

interface SearchFiltersProps {
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: AssetCategory | 'all') => void;
  onIndustryChange: (industry: IndustryTag | null) => void;
  onDesignStyleChange: (styles: DesignStyle[]) => void;
  onDesignBuffsToggle: (enabled: boolean) => void;
  onClearAll: () => void;
  searchValue: string;
  selectedCategory: AssetCategory | 'all';
  selectedIndustry: IndustryTag | null;
  selectedDesignStyles: DesignStyle[];
  designBuffsOnly: boolean;
}

const categories: Array<{ value: AssetCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'brand identity', label: 'Brand Identity' },
  { value: 'social media', label: 'Social Media' },
  { value: 'web design', label: 'Web Design' },
  { value: 'events & conferences', label: 'Events & Conferences' },
  { value: 'sales enablement', label: 'Sales Enablement' },
  { value: 'content marketing', label: 'Content Marketing' },
  { value: 'email marketing', label: 'Email Marketing' }
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

export function SearchFilters({
  onSearchChange,
  onCategoryChange,
  onIndustryChange,
  onDesignStyleChange,
  onDesignBuffsToggle,
  onClearAll,
  searchValue,
  selectedCategory,
  selectedIndustry,
  selectedDesignStyles,
  designBuffsOnly,
}: SearchFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  const toggleIndustry = (industry: IndustryTag) => {
    const updated = selectedIndustry === industry ? null : industry;
    onIndustryChange(updated);
  };

  const toggleDesignStyle = (style: DesignStyle) => {
    const updated = selectedDesignStyles.includes(style)
      ? selectedDesignStyles.filter(s => s !== style)
      : [...selectedDesignStyles, style];
    onDesignStyleChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search 200+ B2B designs, industries, or keywords..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-14 pl-12 pr-12 text-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm rounded-xl font-body"
            style={{ fontFamily: 'var(--font-secondary)' }}
          />
          {localSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Made by Design Buffs Filter - Interactive Toggle */}
      <div className="flex items-center justify-center py-3 px-4">
        <button 
          onClick={() => onDesignBuffsToggle(!designBuffsOnly)}
          className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all group/tooltip relative border-2 ${
            designBuffsOnly 
              ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
              : 'bg-white border-yellow-300 text-gray-700 hover:bg-yellow-50 hover:border-yellow-400'
          }`}
        >
          {/* Toggle indicator */}
          <div className={`w-4 h-4 rounded-full border-2 transition-all ${
            designBuffsOnly 
              ? 'bg-white border-white' 
              : 'bg-transparent border-gray-400'
          }`}>
            {designBuffsOnly && (
              <div className="w-full h-full rounded-full bg-blue-600 scale-50"></div>
            )}
          </div>
          
          <span className="font-medium">
            {designBuffsOnly ? 'Design Buffs Originals' : 'Show Design Buffs Originals'}
          </span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            These are designs created by our team at Design Buffs — crafted for top B2B brands.
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
          </div>
        </button>
      </div>

      {/* Category Filters - Enhanced Pills */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Type</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'primary' : 'outline'}
                className={`px-6 py-3 rounded-full font-medium transition-all ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600'
                }`}
                onClick={() => onCategoryChange(category.value)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* More Filters Toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="px-6 py-2 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-lg"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          More Filters
          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Collapsible Secondary Filters */}
      {showMoreFilters && (
        <div className="border-t border-gray-200 pt-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
        {/* Industry Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-gray-400" />
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Industry</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {industries.map((industry) => (
              <Button
                key={industry.value}
                variant="outline"
                size="sm"
                className={`text-xs h-7 px-2 ${
                  selectedIndustry === industry.value
                    ? 'bg-gray-100 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => toggleIndustry(industry.value)}
              >
                {industry.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Design Style Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Palette className="h-3 w-3 text-gray-400" />
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Style</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {designStyles.map((style) => (
              <Button
                key={style.value}
                variant="outline"
                size="sm"
                className={`text-xs h-7 px-2 ${
                  selectedDesignStyles.includes(style.value)
                    ? 'bg-gray-100 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => toggleDesignStyle(style.value)}
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>

        </div>
      )}

      {/* Active Filters Summary */}
      {(searchValue || selectedCategory !== 'all' || selectedIndustry || selectedDesignStyles.length > 0 || designBuffsOnly) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>Active filters:</span>
          {searchValue && (
            <Badge variant="secondary">
              Search: &quot;{searchValue}&quot;
              <button onClick={clearSearch} className="ml-1 hover:text-gray-800">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary">
              Category: {selectedCategory}
              <button
                onClick={() => onCategoryChange('all')}
                className="ml-1 hover:text-gray-800"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedIndustry && (
            <Badge variant="secondary" className="bg-gray-50 text-gray-600">
              Industry: {industries.find(i => i.value === selectedIndustry)?.label}
              <button
                onClick={() => onIndustryChange(null)}
                className="ml-1 hover:text-gray-800"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedDesignStyles.map((style) => (
            <Badge key={style} variant="secondary" className="bg-gray-50 text-gray-600">
              Style: {designStyles.find(s => s.value === style)?.label}
              <button
                onClick={() => toggleDesignStyle(style)}
                className="ml-1 hover:text-gray-800"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {designBuffsOnly && (
            <Badge variant="secondary">
              Design Buffs Only
              <button
                onClick={() => onDesignBuffsToggle(false)}
                className="ml-1 hover:text-gray-800"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {/* Clear All Button */}
          <Button
            onClick={onClearAll}
            variant="outline"
            size="sm"
            className="ml-2 h-6 px-2 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
