import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, AlertCircle, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { recognizeCountFromImage, OCRResult } from '../lib/ocrUtils';

interface OCRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
  title?: string;
  fieldLabel?: string;
}

export const OCRScannerModal: React.FC<OCRScannerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'อ่านยอดจากรูปแคปหน้าจอ (OCR)',
  fieldLabel = 'ยอดที่ตรวจพบ'
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult] = useState<OCRResult | null>(null);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File | Blob) => {
    setError(null);
    setResult(null);
    setSelectedCount(null);
    setCustomInput('');
    
    // สร้างภาพ Preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setLoading(true);
    try {
      const ocrRes = await recognizeCountFromImage(file, (_percent, status) => {
        setProgressStatus(status);
      });
      setResult(ocrRes);
      if (ocrRes.detectedNumber !== null) {
        setSelectedCount(ocrRes.detectedNumber);
        setCustomInput(String(ocrRes.detectedNumber));
      } else {
        setError('ไม่พบตัวเลขยอดที่ชัดเจนในภาพ กรุณาเลือกตัวเลขด้านล่างหรือกรอกเอง');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลภาพ');
    } finally {
      setLoading(false);
    }
  };

  // ดักฟังการวางภาพ (Paste / Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processFile(blob);
            break;
          }
        }
      }
    }
  };

  const handleConfirm = () => {
    const finalVal = customInput ? parseInt(customInput.replace(/,/g, ''), 10) : selectedCount;
    if (finalVal !== null && !isNaN(finalVal)) {
      onConfirm(finalVal);
      handleClose();
    } else {
      alert('กรุณาเลือกหรือระบุตัวเลขยอดที่ถูกต้อง');
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setResult(null);
    setSelectedCount(null);
    setCustomInput('');
    setError(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onPaste={handlePaste}
    >
      <div className="bg-paper sketch-border shadow-sketch w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-left animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-dashed border-neutral-300 flex justify-between items-center bg-amber-50/50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-extrabold font-hand text-lg">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 font-hand">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300">
            💡 <strong>วิธีใช้บนมือถือ:</strong> แคปหน้าจอหน้า IG/TikTok/FB แล้วกดปุ่ม <strong>"เลือกรูปแคปหน้าจอ"</strong> ด้านล่าง ระบบจะสแกนตัวเลขยอดให้อัตโนมัติ (หรือกดวางภาพจาก Clipboard)
          </div>

          {/* File Input Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 dark:bg-neutral-900/30 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-amber-50/60 flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-base text-neutral-800 dark:text-neutral-200">
                  แตะเพื่อเลือกรูปภาพแคปหน้าจอ
                </p>
                <p className="text-xs text-pencil-muted mt-1">
                  รองรับ PNG, JPG, WebP จากคลังรูปภาพ
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden border border-neutral-300 max-h-48 bg-neutral-900 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 object-contain w-auto"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 backdrop-blur-xs transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  เปลี่ยนรูป
                </button>
              </div>

              {/* Loading status */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="font-bold text-sm text-neutral-700 dark:text-neutral-300">
                    {progressStatus || 'กำลังประมวลผลภาพ...'}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Results & Candidate selection */}
              {result && !loading && (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg p-3">
                    <span className="text-xs text-green-700 dark:text-green-300 block mb-1">
                      {fieldLabel}:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="0"
                        className="w-full bg-white dark:bg-neutral-800 border border-green-300 dark:border-green-700 rounded-md px-3 py-1.5 text-xl font-bold font-mono text-green-700 dark:text-green-300"
                      />
                    </div>
                  </div>

                  {/* Candidates */}
                  {result.candidateNumbers.length > 1 && (
                    <div>
                      <span className="text-xs text-pencil-muted block mb-1.5">
                        ตัวเลขอื่นๆ ที่ตรวจพบในภาพ (แตะเพื่อเลือก):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {result.candidateNumbers.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedCount(c.value);
                              setCustomInput(String(c.value));
                            }}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-all font-mono ${
                              selectedCount === c.value
                                ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                                : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 border-neutral-300'
                            }`}
                          >
                            {c.text} ({c.value.toLocaleString()})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dashed border-neutral-300 flex justify-end gap-2 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors font-hand"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (!customInput && selectedCount === null)}
            className="px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg shadow-sketch flex items-center gap-1.5 transition-all font-hand"
          >
            <Check className="w-4 h-4" />
            นำยอดนี้ไปใช้
          </button>
        </div>
      </div>
    </div>
  );
};
