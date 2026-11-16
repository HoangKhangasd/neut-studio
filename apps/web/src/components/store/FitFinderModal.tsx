'use client';

import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';
import { calculateFitFinder } from '../../lib/api';

interface FitFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (size: string) => void;
}

export function FitFinderModal({ isOpen, onClose, onSelectSize }: FitFinderModalProps) {
  const [height, setHeight] = useState(172);
  const [weight, setWeight] = useState(65);
  const [bodyType, setBodyType] = useState('AVERAGE');
  const [fitPreference, setFitPreference] = useState('OVERSIZE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    recommendedSize: string;
    confidence: number;
    explanation: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await calculateFitFinder({
        heightCm: Number(height),
        weightKg: Number(weight),
        bodyType,
        fitPreference,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySize = () => {
    if (result && onSelectSize) {
      onSelectSize(result.recommendedSize);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white text-black border-2 border-black p-6 sm:p-8 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-black" />
          <span className="text-[11px] font-black tracking-widest uppercase text-neutral-500">
            AI SMART FIT FINDER
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mb-1">
          GỢI Ý CHỌN SIZE CHUẨN XÁC
        </h3>
        <p className="text-xs text-neutral-600 mb-6">
          Dựa trên bảng thông số chuẩn may đo Streetwear Việt Nam và hành vi mua sắm của hàng ngàn khách hàng.
        </p>

        {result ? (
          /* Result View */
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-neutral-900 text-white text-center border border-black">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">
                KÍCH THƯỚC PHÙ HỢP NHẤT VỚI BẠN
              </span>
              <div className="text-5xl font-black tracking-wider text-white my-2">
                SIZE {result.recommendedSize}
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Độ tin cậy: {result.confidence}%</span>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed font-mono bg-neutral-100 p-3.5 border border-neutral-300">
              💡 {result.explanation}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onSelectSize && (
                <button
                  onClick={handleApplySize}
                  className="flex-1 py-3 px-4 bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 flex items-center justify-center gap-2 transition-colors"
                >
                  ÁP DỤNG SIZE {result.recommendedSize}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setResult(null)}
                className="py-3 px-4 border border-black text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-100 transition-colors"
              >
                TÍNH TOÁN LẠI
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Height Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase mb-2">
                <span>Chiều cao:</span>
                <span className="font-mono text-sm font-black">{height} cm</span>
              </div>
              <input
                type="range"
                min={150}
                max={200}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-1">
                <span>150 cm</span>
                <span>175 cm</span>
                <span>200 cm</span>
              </div>
            </div>

            {/* Weight Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase mb-2">
                <span>Cân nặng:</span>
                <span className="font-mono text-sm font-black">{weight} kg</span>
              </div>
              <input
                type="range"
                min={40}
                max={110}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono mt-1">
                <span>40 kg</span>
                <span>75 kg</span>
                <span>110 kg</span>
              </div>
            </div>

            {/* Body Type */}
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Dáng người:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'SLIM', label: 'Gầy' },
                  { value: 'AVERAGE', label: 'Cân đối' },
                  { value: 'CHUBBY', label: 'Đầy đặn' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setBodyType(item.value)}
                    className={`py-2 text-xs font-bold uppercase border transition-all ${
                      bodyType === item.value
                        ? 'bg-black text-white border-black'
                        : 'border-neutral-300 text-neutral-700 hover:border-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Preference */}
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Sở thích mặc:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'SLIM_FIT', label: 'Ôm vừa' },
                  { value: 'REGULAR', label: 'Tiêu chuẩn' },
                  { value: 'OVERSIZE', label: 'Oversize rộng' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFitPreference(item.value)}
                    className={`py-2 text-xs font-bold uppercase border transition-all ${
                      fitPreference === item.value
                        ? 'bg-black text-white border-black'
                        : 'border-neutral-300 text-neutral-700 hover:border-black'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ĐANG PHÂN TÍCH...
                </>
              ) : (
                'TÌM SIZE PHÙ HỢP CHO TÔI'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
