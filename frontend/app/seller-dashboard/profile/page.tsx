'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  Globe, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Store,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Info,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  getSellerProfile, 
  updateSellerProfile, 
  fetchActiveCollegiateChapters,
  type Seller, 
  type Chapter 
} from '@/lib/api';
import Image from 'next/image';
import SearchableSelect from '@/app/components/SearchableSelect';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SellerProfilePage() {
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    website: '',
    slug: '',
    merchandise_type: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    sponsoring_chapter_id: '',
  });

  const [headshot, setHeadshot] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  useEffect(() => {
    loadProfileAndChapters();
  }, []);

  const loadProfileAndChapters = async () => {
    try {
      setLoading(true);
      const [profileData, chaptersData] = await Promise.all([
        getSellerProfile(),
        fetchActiveCollegiateChapters()
      ]);
      
      setSeller(profileData);
      setChapters(chaptersData);

      // Find Psi chapter for default
      const psiChapter = chaptersData.find(c => c.name.toLowerCase().includes('psi') && !c.name.toLowerCase().includes('alumni'));
      
      setFormData({
        business_name: profileData.business_name || '',
        business_email: profileData.business_email || '',
        business_phone: profileData.business_phone || '',
        website: profileData.website || '',
        slug: profileData.slug || '',
        merchandise_type: profileData.merchandise_type || '',
        instagram: profileData.social_links?.instagram || '',
        twitter: profileData.social_links?.twitter || '',
        linkedin: profileData.social_links?.linkedin || '',
        sponsoring_chapter_id: profileData.sponsoring_chapter_id?.toString() || psiChapter?.id?.toString() || '',
      });

      if (profileData.headshot_url) setHeadshotPreview(profileData.headshot_url);
      if (profileData.store_logo_url) setLogoPreview(profileData.store_logo_url);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = async (val: string) => {
    const slug = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug }));
    
    if (slug === seller?.slug) {
      setSlugStatus('idle');
      return;
    }

    if (slug.length < 3) {
      setSlugStatus('invalid');
      return;
    }

    setSlugStatus('checking');
    try {
      const res = await fetch(`${API_URL}/api/sellers/check-slug/${slug}`);
      const data = await res.json();
      setSlugStatus(data.available ? 'available' : 'taken');
    } catch (err) {
      setSlugStatus('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'headshot' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'headshot') {
      setHeadshot(file);
      setHeadshotPreview(URL.createObjectURL(file));
    } else {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('business_name', formData.business_name);
      data.append('business_email', formData.business_email);
      data.append('business_phone', formData.business_phone);
      data.append('website', formData.website);
      data.append('slug', formData.slug);
      data.append('merchandise_type', formData.merchandise_type);
      data.append('sponsoring_chapter_id', formData.sponsoring_chapter_id);
      
      const socialLinks = {
        instagram: formData.instagram,
        twitter: formData.twitter,
        linkedin: formData.linkedin,
      };
      data.append('social_links', JSON.stringify(socialLinks));

      if (headshot) data.append('headshot', headshot);
      if (logo) data.append('store_logo', logo);

      const updated = await updateSellerProfile(data);
      setSeller(updated);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const chapterOptions = chapters.map(c => ({
    id: c.id,
    label: c.name,
    value: c.id.toString()
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container max-w-4xl py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller-dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Edit Seller Profile</h1>
            <p className="text-midnight-navy/60">Manage your brand and business information</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Brand Assets */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>Update your store logo and professional headshot</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label>Store Logo</Label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl border-frost-gray bg-gray-50/50">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo Preview" fill className="object-contain" />
                    ) : (
                      <Store className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                  <input 
                    id="logo-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'logo')}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Professional Headshot</Label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl border-frost-gray bg-gray-50/50">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border bg-white">
                    {headshotPreview ? (
                      <Image src={headshotPreview} alt="Headshot Preview" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Upload className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('headshot-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <input 
                    id="headshot-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'headshot')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store URL & Sponsorship */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Store URL</CardTitle>
                <CardDescription>Your custom subdomain on one-kappa.com</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Custom URL Subdomain</Label>
                  <div className="flex items-center">
                    <div className="flex-1 relative">
                      <Input 
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="your-store-name"
                        className="pr-32"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-midnight-navy/40 font-medium">
                        .one-kappa.com
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[20px]">
                    {slugStatus === 'checking' && <p className="text-sm text-midnight-navy/60">Checking availability...</p>}
                    {slugStatus === 'available' && <p className="text-sm text-green-600 font-medium">✨ This URL is available!</p>}
                    {slugStatus === 'taken' && <p className="text-sm text-red-600 font-medium">❌ Sorry, this URL is already taken.</p>}
                    {slugStatus === 'invalid' && <p className="text-sm text-yellow-600 font-medium">URL must be at least 3 characters.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Undergrad Sponsorship</CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-midnight-navy/40 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px] p-2 bg-midnight-navy text-white text-xs">
                      Our mission is to support undergraduates. 1 to 2% of all sales for this store go to the undergraduate chapter of your choice.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <CardDescription>Support an undergraduate chapter</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sponsoring_chapter">Dedicated Chapter</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-midnight-navy/40 z-10" />
                    <SearchableSelect
                      options={chapterOptions}
                      value={formData.sponsoring_chapter_id}
                      onChange={(val) => setFormData({ ...formData, sponsoring_chapter_id: val })}
                      placeholder="Search for a chapter..."
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>General storefront and contact details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="business_name">Merchant Display Name</Label>
                <Input 
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="Business Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_email">Public Business Email</Label>
                <Input 
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                  placeholder="store@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_phone">Business Phone</Label>
                <Input 
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-midnight-navy/40" />
                  <Input 
                    id="website"
                    className="pl-10"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Connect your store with your social profiles</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-midnight-navy/40" />
                  <Input 
                    id="instagram"
                    className="pl-10"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-midnight-navy/40" />
                  <Input 
                    id="twitter"
                    className="pl-10"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    placeholder="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-midnight-navy/40" />
                  <Input 
                    id="linkedin"
                    className="pl-10"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="username"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="bg-crimson hover:bg-crimson/90" disabled={saving || slugStatus === 'taken'}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </TooltipProvider>
  );
}
