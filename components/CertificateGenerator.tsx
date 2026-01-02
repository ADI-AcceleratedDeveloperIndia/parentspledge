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

  const generateCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);

    // Set canvas size for high-quality landscape certificate (MyGov style)
    const width = 1920; // Landscape width
    const height = 1080; // Landscape height
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background - White
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Decorative outer border (MyGov style - thick border with pattern)
    const borderWidth = 12;
    ctx.strokeStyle = '#123C66';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

    // Inner decorative border
    ctx.strokeStyle = '#1F6FB2';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    // Decorative corner elements (MyGov style)
    const cornerSize = 40;
    ctx.strokeStyle = '#E3B341';
    ctx.lineWidth = 3;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50 + cornerSize, 50);
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 50 + cornerSize);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(width - 50, 50);
    ctx.lineTo(width - 50 - cornerSize, 50);
    ctx.moveTo(width - 50, 50);
    ctx.lineTo(width - 50, 50 + cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(50 + cornerSize, height - 50);
    ctx.moveTo(50, height - 50);
    ctx.lineTo(50, height - 50 - cornerSize);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(width - 50, height - 50);
    ctx.lineTo(width - 50 - cornerSize, height - 50);
    ctx.moveTo(width - 50, height - 50);
    ctx.lineTo(width - 50, height - 50 - cornerSize);
    ctx.stroke();

    // Header section with logos (MyGov style - centered logos)
    const logoY = 80;
    const logoSize = 90;
    const logoSpacing = 100;
    const logoStartX = (width - (logoSize * 3 + logoSpacing * 2)) / 2;

    // Logo 1 - Government emblem style
    ctx.fillStyle = '#1F6FB2';
    ctx.beginPath();
    ctx.arc(logoStartX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#123C66';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOGO', logoStartX + logoSize / 2, logoY + logoSize / 2);

    // Logo 2 - Center (main logo)
    ctx.fillStyle = '#1F6FB2';
    ctx.beginPath();
    ctx.arc(logoStartX + logoSize + logoSpacing + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E3B341';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('LOGO', logoStartX + logoSize + logoSpacing + logoSize / 2, logoY + logoSize / 2);

    // Logo 3
    ctx.fillStyle = '#1F6FB2';
    ctx.beginPath();
    ctx.arc(logoStartX + (logoSize + logoSpacing) * 2 + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#123C66';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('LOGO', logoStartX + (logoSize + logoSpacing) * 2 + logoSize / 2, logoY + logoSize / 2);

    // Decorative line under logos
    ctx.strokeStyle = '#D6E2EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, logoY + logoSize + 20);
    ctx.lineTo(width - 150, logoY + logoSize + 20);
    ctx.stroke();

    // Certificate Title - Large and prominent (MyGov style)
    ctx.fillStyle = '#123C66';
    ctx.font = 'bold 72px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.certificateTitle, width / 2, logoY + logoSize + 100);

    // Subtitle with decorative underline
    ctx.fillStyle = '#1F6FB2';
    ctx.font = 'bold 40px "Times New Roman", serif';
    ctx.fillText(translations.en.subtitle, width / 2, logoY + logoSize + 150);
    
    // Decorative underline
    ctx.strokeStyle = '#E3B341';
    ctx.lineWidth = 3;
    const subtitleWidth = ctx.measureText(translations.en.subtitle).width;
    ctx.beginPath();
    ctx.moveTo((width - subtitleWidth) / 2 - 20, logoY + logoSize + 165);
    ctx.lineTo((width + subtitleWidth) / 2 + 20, logoY + logoSize + 165);
    ctx.stroke();

    // Certificate content section (MyGov formal style)
    const contentY = logoY + logoSize + 220;
    
    // "This is to certify that" text
    ctx.fillStyle = '#4A4A4A';
    ctx.font = '32px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.certificateSubtitle, width / 2, contentY);

    // Name section - Prominent and bold
    ctx.fillStyle = '#123C66';
    ctx.font = 'bold 56px "Times New Roman", serif';
    ctx.fillText(data.childName, width / 2, contentY + 70);

    // Parent name - Secondary information
    ctx.fillStyle = '#1F6FB2';
    ctx.font = '36px "Times New Roman", serif';
    ctx.fillText(`(${t.parentName}: ${data.parentName})`, width / 2, contentY + 130);

    // Institution and District - Formal style
    ctx.fillStyle = '#4A4A4A';
    ctx.font = '30px "Times New Roman", serif';
    ctx.fillText(`${t.institutionName}: ${data.institutionName}`, width / 2, contentY + 190);
    ctx.fillText(`${t.district}: ${data.district}`, width / 2, contentY + 240);

    // Decorative separator line
    ctx.strokeStyle = '#D6E2EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, contentY + 280);
    ctx.lineTo(width - 200, contentY + 280);
    ctx.stroke();

    // Pledge text - Formal italic style
    ctx.fillStyle = '#123C66';
    ctx.font = 'italic 26px "Times New Roman", serif';
    const pledgeText = t.fullPledgeText;
    const maxWidth = width - 300;
    const lines = wrapText(ctx, pledgeText, maxWidth);
    lines.forEach((line, index) => {
      ctx.fillText(line, width / 2, contentY + 330 + index * 38);
    });

    // Certificate confirmation text
    const pledgeEndY = contentY + 330 + lines.length * 38 + 40;
    ctx.fillStyle = '#1F6FB2';
    ctx.font = 'bold 32px "Times New Roman", serif';
    ctx.fillText(t.certificateText, width / 2, pledgeEndY);

    // Official signatures section (MyGov style - bottom)
    const signatureY = height - 180;
    const signatureSpacing = (width - 600) / 3;
    const signatureWidth = 150;
    const signatureHeight = 80;

    // Signature 1 - CM
    ctx.strokeStyle = '#D6E2EE';
    ctx.lineWidth = 1;
    ctx.strokeRect(300, signatureY, signatureWidth, signatureHeight);
    ctx.fillStyle = '#4A4A4A';
    ctx.font = '14px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('CM_PHOTO', 300 + signatureWidth / 2, signatureY + signatureHeight / 2);
    ctx.fillText('Chief Minister', 300 + signatureWidth / 2, signatureY + signatureHeight + 20);

    // Signature 2 - Transport Minister
    ctx.strokeRect(300 + signatureSpacing, signatureY, signatureWidth, signatureHeight);
    ctx.fillText('MINISTER_PHOTO', 300 + signatureSpacing + signatureWidth / 2, signatureY + signatureHeight / 2);
    ctx.fillText('Transport Minister', 300 + signatureSpacing + signatureWidth / 2, signatureY + signatureHeight + 20);

    // Signature 3 - Official
    ctx.strokeRect(300 + signatureSpacing * 2, signatureY, signatureWidth, signatureHeight);
    ctx.fillText('OFFICIAL_PHOTO', 300 + signatureSpacing * 2 + signatureWidth / 2, signatureY + signatureHeight / 2);
    ctx.fillText('Official', 300 + signatureSpacing * 2 + signatureWidth / 2, signatureY + signatureHeight + 20);

    // Official seal/stamp area (right side)
    ctx.strokeStyle = '#E3B341';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width - 200, signatureY + signatureHeight / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#E3B341';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SEAL', width - 200, signatureY + signatureHeight / 2);

    // Date - Formal style
    ctx.fillStyle = '#4A4A4A';
    ctx.font = '24px "Times New Roman", serif';
    ctx.textAlign = 'center';
    const date = new Date().toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(`Date: ${date}`, width / 2, height - 40);

    // Certificate number (MyGov style)
    ctx.fillStyle = '#1F6FB2';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    const certNumber = `CERT-${Date.now().toString().slice(-8)}`;
    ctx.fillText(`Certificate No: ${certNumber}`, 100, height - 40);

    setIsGenerating(false);
  };

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
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#123C66' }}>Your Certificate is Ready!</h2>
          <p style={{ color: '#4A4A4A' }}>Download your Road Safety Pledge Certificate</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={downloadCertificate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-4 text-white font-semibold text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
            style={{ backgroundColor: isGenerating ? '#5DA9E9' : '#1F6FB2' }}
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
              borderColor: '#1F6FB2',
              color: '#1F6FB2',
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
      <div className="w-full overflow-auto rounded-lg p-4 shadow-lg" style={{ backgroundColor: '#F5F9FD', border: '2px solid #D6E2EE' }}>
        <div className="inline-block">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{ maxHeight: '70vh' }}
          />
        </div>
      </div>
    </div>
  );
}

