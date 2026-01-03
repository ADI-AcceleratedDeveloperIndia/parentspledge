'use client';

import { useState, useEffect, FormEvent } from 'react';
import { PledgeFormData, pledgeSchema } from '@/lib/validations';
import { TELANGANA_DISTRICTS } from '@/lib/constants';
import { translations, type Language } from '@/lib/translations';
import CertificateGenerator from '@/components/CertificateGenerator';
import LanguageToggle from '@/components/LanguageToggle';
import AudioGuide from '@/components/AudioGuide';

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [formData, setFormData] = useState<Partial<PledgeFormData>>({
    childName: '',
    parentName: '',
    institutionName: '',
    standard: '',
    district: undefined,
    language: 'en',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PledgeFormData | '_form', string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [submittedData, setSubmittedData] = useState<PledgeFormData | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [hasStartedPledging, setHasStartedPledging] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [alreadyPledged, setAlreadyPledged] = useState<{ referenceId: string; downloaded: boolean } | null>(null);
  const [isCheckingPledge, setIsCheckingPledge] = useState(true);

  const t = translations[language];

  // Check if user already pledged on page load
  useEffect(() => {
    const checkExistingPledge = async () => {
      try {
        // Check localStorage for referenceId
        const storedReferenceId = localStorage.getItem('pledgeReferenceId');
        if (storedReferenceId) {
          // Check if this pledge was downloaded
          const response = await fetch(`/api/pledges?referenceId=${storedReferenceId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.pledge) {
              setAlreadyPledged({
                referenceId: storedReferenceId,
                downloaded: (data.pledge.downloadCount || 0) > 0
              });
              setReferenceId(storedReferenceId);
              setCertificateNumber(data.pledge.certificateNumber);
              if (data.pledge.downloadCount > 0) {
                // Already downloaded - don't show form
                setShowCertificate(false);
              } else {
                // Not downloaded yet - show form to allow download
                setSubmittedData(data.pledge);
                setShowCertificate(true);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to check existing pledge:', error);
      } finally {
        setIsCheckingPledge(false);
      }
    };

    checkExistingPledge();
  }, []);

  // Fetch visitor count on mount - only for unique visitors
  useEffect(() => {
    const trackVisitor = async () => {
      // Check if this is a first-time visitor
      const hasVisited = localStorage.getItem('hasVisited');
      if (!hasVisited) {
        // First-time visitor - increment count
        try {
          const response = await fetch('/api/visitors/increment');
          const data = await response.json();
          if (data.count !== undefined && data.count !== null) {
            setVisitorCount(data.count);
          }
          // Mark as visited
          localStorage.setItem('hasVisited', 'true');
        } catch (error) {
          console.warn('Failed to track visitor:', error);
        }
      } else {
        // Returning visitor - just fetch count without incrementing
        try {
          const response = await fetch('/api/visitors/increment', { method: 'POST' });
          const data = await response.json();
          if (data.count !== undefined && data.count !== null) {
            setVisitorCount(data.count);
          }
        } catch (error) {
          console.warn('Failed to fetch visitor count:', error);
        }
      }
    };

    trackVisitor();
  }, []);

  const handleInputChange = (field: keyof PledgeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setFormData((prev) => ({ ...prev, language: lang }));
  };

  const handleStartPledging = () => {
    setHasStartedPledging(true);
    
    // Play audio using browser Text-to-Speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(t.fullPledgeText);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Client-side validation
      const validatedData = pledgeSchema.parse({
        ...formData,
        language,
      });

      // Submit to API
      const response = await fetch('/api/pledges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit pledge');
      }

      const responseData = await response.json();
      
      // Success - show certificate
      setSubmittedData(validatedData);
      setReferenceId(responseData.referenceId || null);
      setCertificateNumber(responseData.certificateNumber || null);
      
      // Store referenceId in localStorage
      if (responseData.referenceId) {
        localStorage.setItem('pledgeReferenceId', responseData.referenceId);
      }
      
      setShowCertificate(true);
    } catch (error: any) {
      if (error.issues) {
        // Zod validation errors
        const zodErrors: Partial<Record<keyof PledgeFormData, string>> = {};
        error.issues.forEach((err: any) => {
          if (err.path) {
            zodErrors[err.path[0] as keyof PledgeFormData] = err.message;
          }
        });
        setErrors(zodErrors);
      } else {
        setErrors({ _form: error.message || t.error });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking pledge
  if (isCheckingPledge) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0F5F9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p style={{ color: '#2C3E50' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if already pledged and downloaded
  if (alreadyPledged?.downloaded && !showCertificate) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F0F5F9' }}>
        <header className="border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#B8D4E8' }}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-end mb-2">
              <LanguageToggle currentLanguage={language} onLanguageChange={handleLanguageChange} />
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#0D3A5C' }}>
              {language === 'te' ? 'మీరు ఇప్పటికే ప్రతిజ్ఞ చేసి సర్టిఫికేట్ డౌన్‌లోడ్ చేసారు' : 'You have already pledged and downloaded certificate'}
            </h1>
            <p className="text-lg mb-6" style={{ color: '#2C3E50' }}>
              {language === 'te' 
                ? 'మీరు ఇప్పటికే రోడ్ సేఫ్టీ ప్రతిజ్ఞ చేసి మీ సర్టిఫికేట్ డౌన్‌లోడ్ చేసారు. ధన్యవాదాలు!'
                : 'You have already taken the Road Safety Pledge and downloaded your certificate. Thank you!'}
            </p>
            <p className="text-sm" style={{ color: '#2C3E50' }}>
              {language === 'te' ? 'సర్టిఫికేట్ నంబర్' : 'Certificate Number'}: <span className="font-bold" style={{ color: '#1E5A8A' }}>{certificateNumber || 'N/A'}</span>
            </p>
          </div>
        </main>
        <footer className="border-t mt-12 py-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#B8D4E8' }}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p style={{ color: '#2C3E50' }}>
              {t.visitorCount}: <span className="font-bold" style={{ color: '#1E5A8A' }}>{visitorCount ?? '...'}</span>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (showCertificate && submittedData) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F0F5F9' }}>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#0D3A5C' }}>{t.success}</h1>
            <button
              onClick={() => {
                setShowCertificate(false);
                setFormData({
                  childName: '',
                  parentName: '',
                  institutionName: '',
                  district: undefined,
                  language: 'en',
                });
                setSubmittedData(null);
              }}
              className="underline font-medium"
              style={{ color: '#1E5A8A' }}
            >
              Submit Another Pledge
            </button>
          </div>
          <CertificateGenerator 
            data={submittedData} 
            language={language} 
            referenceId={referenceId || undefined}
            certificateNumber={certificateNumber || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#B8D4E8' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Language Toggle - Top Right */}
          <div className="flex justify-end mb-2">
            <LanguageToggle currentLanguage={language} onLanguageChange={handleLanguageChange} />
          </div>
          
          {/* Logos and Photos - Same layout as certificate */}
          <div className="flex items-center justify-between gap-2 md:gap-4" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
            {/* Left: Logo1 and Logo3 (same size as photos) */}
            <div className="flex items-center gap-2 md:gap-3">
              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/logos/logo1.png" 
                  alt="Logo 1" 
                  style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/logos/logo3.png" 
                  alt="Logo 3" 
                  style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            {/* Middle: Logo2 (big, double size = 96px) */}
            <div className="flex-1 flex justify-center">
              <img 
                src="/logos/logo2.png" 
                alt="Logo 2 Large" 
                className="object-contain"
                style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px', maxWidth: '96px', maxHeight: '96px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            {/* Right: Photo1 and Photo2 (same size as Logo1, Logo3) */}
            <div className="flex items-center gap-2 md:gap-3">
              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/photos/1.png" 
                  alt="Photo 1" 
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/photos/2.jpg" 
                  alt="Photo 2" 
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Leadership Photos Section - Removed as photos are now in header */}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Pledge Content Section - Always Visible */}
        <div className="rounded-lg p-6 md:p-8" style={{ backgroundColor: '#F0F5F9', border: '1px solid #B8D4E8' }}>
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#0D3A5C' }}>{t.title}</h1>
            <p className="text-lg" style={{ color: '#2C3E50' }}>{t.subtitle}</p>
          </div>

          {/* Pledge Text Display */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#0D3A5C' }}>
              {language === 'te' ? 'తల్లిదండ్రుల హామీ పత్రం' : 'Parents Pledge'}
            </h2>
            <div 
              className="text-base leading-relaxed p-6 rounded-lg"
              style={{ 
                backgroundColor: '#FFFFFF', 
                border: '1px solid #B8D4E8',
                color: '#0D3A5C',
                minHeight: '200px'
              }}
            >
              <p className="whitespace-pre-line">{t.fullPledgeText}</p>
            </div>
          </div>

          {/* Start Pledging Button */}
          {!hasStartedPledging && (
            <div className="text-center">
              <button
                onClick={handleStartPledging}
                disabled={isPlayingAudio}
                className="px-8 py-4 text-white rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ backgroundColor: isPlayingAudio ? '#4A90C2' : '#1E5A8A' }}
              >
                {isPlayingAudio ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {language === 'te' ? 'ఆడియో ప్లే అవుతోంది...' : 'Playing Audio...'}
                  </span>
                ) : (
                  t.startPledging
                )}
              </button>
            </div>
          )}

          {/* Audio Playing Indicator */}
          {isPlayingAudio && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8D4E8' }}>
                <svg className="animate-pulse h-5 w-5" style={{ color: '#1E5A8A' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span style={{ color: '#0D3A5C' }}>
                  {language === 'te' ? 'ఆడియో ప్లే అవుతోంది...' : 'Audio is playing...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Form Section - Shows after clicking Start Pledging */}
        {hasStartedPledging && (
          <div className="rounded-lg p-6 md:p-8" style={{ backgroundColor: '#F0F5F9', border: '1px solid #B8D4E8' }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#0D3A5C' }}>{t.formTitle}</h2>
            </div>

            <div className="mb-6 flex justify-center">
              <AudioGuide language={language} text={t.formTitle} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Name */}
            <div>
              <label htmlFor="childName" className="block text-sm font-medium mb-2" style={{ color: '#0D3A5C' }}>
                {t.childName} <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                type="text"
                id="childName"
                value={formData.childName || ''}
                onChange={(e) => handleInputChange('childName', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: errors.childName ? '2px solid #FF6B35' : '1px solid #B8D4E8',
                  backgroundColor: '#FFFFFF',
                  color: '#0D3A5C',
                  '--tw-ring-color': '#1E5A8A'
                } as React.CSSProperties}
                required
              />
              {errors.childName && (
                <p className="mt-1 text-sm" style={{ color: '#FF6B35' }}>{errors.childName}</p>
              )}
            </div>

            {/* Parent Name */}
            <div>
              <label htmlFor="parentName" className="block text-sm font-medium mb-2" style={{ color: '#0D3A5C' }}>
                {t.parentName} <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                type="text"
                id="parentName"
                value={formData.parentName || ''}
                onChange={(e) => handleInputChange('parentName', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: errors.parentName ? '2px solid #FF6B35' : '1px solid #B8D4E8',
                  backgroundColor: '#FFFFFF',
                  color: '#0D3A5C',
                  '--tw-ring-color': '#1E5A8A'
                } as React.CSSProperties}
                required
              />
              {errors.parentName && (
                <p className="mt-1 text-sm" style={{ color: '#FF6B35' }}>{errors.parentName}</p>
              )}
            </div>

            {/* Institution Name */}
            <div>
              <label
                htmlFor="institutionName"
                className="block text-sm font-medium mb-2"
                style={{ color: '#0D3A5C' }}
              >
                {t.institutionName} <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                type="text"
                id="institutionName"
                value={formData.institutionName || ''}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: errors.institutionName ? '2px solid #FF6B35' : '1px solid #B8D4E8',
                  backgroundColor: '#FFFFFF',
                  color: '#0D3A5C',
                  '--tw-ring-color': '#1E5A8A'
                } as React.CSSProperties}
                required
              />
              {errors.institutionName && (
                <p className="mt-1 text-sm" style={{ color: '#FF6B35' }}>{errors.institutionName}</p>
              )}
            </div>

            {/* Standard/Class */}
            <div>
              <label htmlFor="standard" className="block text-sm font-medium mb-2" style={{ color: '#0D3A5C' }}>
                {t.standard} <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                type="text"
                id="standard"
                value={formData.standard || ''}
                onChange={(e) => handleInputChange('standard', e.target.value)}
                placeholder={language === 'te' ? 'ఉదా: 5వ తరగతి, 10వ తరగతి' : 'e.g., Class 5, 10th Standard'}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: errors.standard ? '2px solid #FF6B35' : '1px solid #B8D4E8',
                  backgroundColor: '#FFFFFF',
                  color: '#0D3A5C',
                  '--tw-ring-color': '#1E5A8A'
                } as React.CSSProperties}
                required
              />
              {errors.standard && (
                <p className="mt-1 text-sm" style={{ color: '#FF6B35' }}>{errors.standard}</p>
              )}
            </div>

            {/* District */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium mb-2" style={{ color: '#0D3A5C' }}>
                {t.district} <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <select
                id="district"
                value={formData.district || ''}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{
                  border: errors.district ? '2px solid #FF6B35' : '1px solid #B8D4E8',
                  backgroundColor: '#FFFFFF',
                  color: '#0D3A5C',
                  '--tw-ring-color': '#1E5A8A'
                } as React.CSSProperties}
                required
              >
                <option value="">{t.selectDistrict}</option>
                {TELANGANA_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1 text-sm" style={{ color: '#FF6B35' }}>{errors.district}</p>
              )}
            </div>

            {/* Form Error */}
            {errors._form && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#F0F5F9', border: '1px solid #FF6B35' }}>
                <p className="text-sm" style={{ color: '#FF6B35' }}>{errors._form}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: isSubmitting ? '#4A90C2' : '#1E5A8A' }}
            >
              {isSubmitting ? t.generating : t.submit}
            </button>
          </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#B8D4E8' }}>
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p style={{ color: '#2C3E50' }}>
            {t.visitorCount}: <span className="font-bold" style={{ color: '#1E5A8A' }}>{visitorCount ?? '...'}</span>
          </p>
          <p className="text-sm" style={{ color: '#2C3E50' }}>
            Admin Dashboard: <a href="/admin" className="underline font-medium" style={{ color: '#1E5A8A' }}>Click here</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
