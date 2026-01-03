'use client';

import { useEffect, useRef, useState } from 'react';
import { translations, type Language } from '@/lib/translations';
import { PledgeFormData } from '@/lib/validations';

interface CertificateGeneratorProps {
  data: PledgeFormData;
  language: Language;
}

export default function CertificateGenerator({ data, language }: CertificateGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const t = translations[language];

  useEffect(() => {
    generateCertificate();
  }, [data, language]);

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        reject(new Error(`Failed to load: ${src}`));
      };
      img.src = src;
    });
  };

  const generateCertificate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    try {
      // Load background image first to get its dimensions
      const bgImage = await loadImage('/certificatedesign.png');
      
      // Use image dimensions for high-quality output (scale up 2x for better quality)
      const scale = 2;
      const width = bgImage.width * scale; // 1050 * 2 = 2100
      const height = bgImage.height * scale; // 600 * 2 = 1200
      
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw background image scaled up
      ctx.drawImage(bgImage, 0, 0, width, height);

      // Load all images in parallel
      const [logo1, logo2, photo1, photo2] = await Promise.allSettled([
        loadImage('/logos/logo1.png'),
        loadImage('/logos/logo2.png'),
        loadImage('/photos/1.png'),
        loadImage('/photos/2.jpg'),
      ]);

      // Draw logos and photos
      drawLogosAndPhotos(ctx, width, height, scale, logo1, logo2, photo1, photo2);

      // Draw text content (adjusted to avoid overlaps)
      drawTextContent(ctx, width, height, scale);

      setIsGenerating(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
      // Fallback: draw basic certificate
      const fallbackWidth = 2100;
      const fallbackHeight = 1200;
      canvas.width = fallbackWidth;
      canvas.height = fallbackHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#E8F4F8';
      ctx.fillRect(0, 0, fallbackWidth, fallbackHeight);
      drawTextContent(ctx, fallbackWidth, fallbackHeight, 2);
      setIsGenerating(false);
    }
  };

  const drawLogosAndPhotos = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number,
    logo1: PromiseSettledResult<HTMLImageElement>,
    logo2: PromiseSettledResult<HTMLImageElement>,
    photo1: PromiseSettledResult<HTMLImageElement>,
    photo2: PromiseSettledResult<HTMLImageElement>
  ) => {
    const baseLogoSize = 50 * scale; // Base size for logo1 and small logo2
    const logo2BigSize = baseLogoSize * 2; // Logo2 big version is double size
    const photoSize = baseLogoSize; // Photos same size as small logos
    const paddingPercent = 0.1; // 10% padding from edges
    const horizontalPadding = width * paddingPercent;
    const topY = 30 * scale; // Top edge position
    const spacing = 20 * scale; // Spacing between elements

    // LEFT SIDE: Logo1 and Logo2 (small) together
    let currentX = horizontalPadding;
    
    if (logo1.status === 'fulfilled') {
      ctx.drawImage(logo1.value, currentX, topY, baseLogoSize, baseLogoSize);
      currentX += baseLogoSize + spacing;
    }
    
    if (logo2.status === 'fulfilled') {
      // Small logo2 on left
      ctx.drawImage(logo2.value, currentX, topY, baseLogoSize, baseLogoSize);
    }

    // MIDDLE: Logo2 (big, double size) - centered
    if (logo2.status === 'fulfilled') {
      const logo2BigX = (width - logo2BigSize) / 2;
      ctx.drawImage(logo2.value, logo2BigX, topY, logo2BigSize, logo2BigSize);
    }

    // RIGHT SIDE: Photo1 and Photo2 together
    const rightStartX = width - horizontalPadding - (photoSize * 2) - spacing;
    let photoX = rightStartX;
    
    if (photo1.status === 'fulfilled') {
      ctx.drawImage(photo1.value, photoX, topY, photoSize, photoSize);
      photoX += photoSize + spacing;
    }
    
    if (photo2.status === 'fulfilled') {
      ctx.drawImage(photo2.value, photoX, topY, photoSize, photoSize);
    }
  };

  const drawTextContent = (ctx: CanvasRenderingContext2D, width: number, height: number, scale: number = 1) => {
    const t = translations[language];
    
    // Calculate safe zones to avoid overlapping with logos/photos
    const topSafeZone = 200 * scale; // Space for logos/photos at top
    const leftSafeZone = 150 * scale; // Space for left logos
    const rightSafeZone = 150 * scale; // Space for right photos
    const bottomSafeZone = 80 * scale; // Space for date at bottom

    // Certificate Title - centered, below top safe zone
    ctx.fillStyle = '#0D3A5C';
    ctx.font = `bold ${42 * scale}px "Times New Roman", serif`;
    ctx.textAlign = 'center';
    const titleY = topSafeZone + 40 * scale;
    ctx.fillText(t.certificateTitle, width / 2, titleY);

    // Subtitle
    ctx.fillStyle = '#1E5A8A';
    ctx.font = `bold ${26 * scale}px "Times New Roman", serif`;
    ctx.fillText(translations.en.subtitle, width / 2, titleY + 50 * scale);

    // Certificate content - "This is to certify that"
    const contentY = titleY + 100 * scale;
    ctx.fillStyle = '#0D3A5C';
    ctx.font = `${22 * scale}px "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.fillText(t.certificateSubtitle, width / 2, contentY);

    // Name section - prominent and bold
    ctx.fillStyle = '#0D3A5C';
    ctx.font = `bold ${36 * scale}px "Times New Roman", serif`;
    const nameY = contentY + 50 * scale;
    ctx.fillText(data.childName, width / 2, nameY);

    // Parent name
    ctx.fillStyle = '#1E5A8A';
    ctx.font = `${22 * scale}px "Times New Roman", serif`;
    ctx.fillText(`(${t.parentName}: ${data.parentName})`, width / 2, nameY + 40 * scale);

    // Institution and District
    ctx.fillStyle = '#0D3A5C';
    ctx.font = `${18 * scale}px "Times New Roman", serif`;
    ctx.fillText(`${t.institutionName}: ${data.institutionName}`, width / 2, nameY + 80 * scale);
    ctx.fillText(`${t.district}: ${data.district}`, width / 2, nameY + 110 * scale);

    // Pledge text - smaller, italic, with proper wrapping
    ctx.fillStyle = '#0D3A5C';
    ctx.font = `italic ${16 * scale}px "Times New Roman", serif`;
    const pledgeText = t.fullPledgeText;
    const maxWidth = width - leftSafeZone - rightSafeZone;
    const lines = wrapText(ctx, pledgeText, maxWidth);
    const pledgeStartY = nameY + 150 * scale;
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, pledgeStartY + index * 22 * scale);
    });

    // Certificate confirmation text
    const pledgeEndY = pledgeStartY + lines.length * 22 * scale + 30 * scale;
    ctx.fillStyle = '#1E5A8A';
    ctx.font = `bold ${20 * scale}px "Times New Roman", serif`;
    ctx.fillText(t.certificateText, width / 2, pledgeEndY);

    // Date - at bottom, above bottom safe zone
    ctx.fillStyle = '#2C3E50';
    ctx.font = `${16 * scale}px "Times New Roman", serif`;
    const date = new Date().toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(`Date: ${date}`, width / 2, height - bottomSafeZone);
  };

  const downloadCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create download link
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Road_Safety_Pledge_${data.childName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0D3A5C' }}>Your Certificate is Ready!</h2>
          <p style={{ color: '#2C3E50' }}>Download your Road Safety Pledge Certificate</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={downloadCertificate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-4 text-white font-semibold text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
            style={{ backgroundColor: isGenerating ? '#4A90C2' : '#1E5A8A' }}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.generating}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.download}
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-4 font-semibold rounded-lg border-2 transition-opacity"
            style={{ 
              borderColor: '#1E5A8A',
              color: '#1E5A8A',
              backgroundColor: '#FFFFFF'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Certificate
          </button>
        </div>
      </div>
      <div className="w-full overflow-x-auto rounded-lg p-2 sm:p-4 shadow-lg" style={{ backgroundColor: '#F0F5F9', border: '2px solid #B8D4E8' }}>
        <div className="inline-block min-w-full">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ 
              maxHeight: '85vh',
              display: 'block',
              margin: '0 auto',
              maxWidth: '100%'
            }}
          />
        </div>
      </div>
    </div>
  );
}
