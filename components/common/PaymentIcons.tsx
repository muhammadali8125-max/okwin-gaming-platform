"use client";

import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Official EasyPaisa Brand Icon (from official source)
 * Matches the authentic white square emblem from the commercial casino app
 */
export const EasyPaisaIcon: React.FC<IconProps> = ({ className = "", size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-white p-1 shadow-sm border border-white/20 overflow-hidden ${className}`}
      title="EasyPaisa"
    >
      <img
        src="/images/easypaisa_emblem.png"
        alt="EasyPaisa"
        className="w-full h-full object-contain pointer-events-none select-none"
        loading="eager"
      />
    </div>
  );
};

/**
 * Official JazzCash Brand Icon (from official source)
 * Matches the authentic white square emblem from the commercial casino app
 */
export const JazzCashIcon: React.FC<IconProps> = ({ className = "", size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-white p-1 shadow-sm border border-white/20 overflow-hidden ${className}`}
      title="JazzCash"
    >
      <img
        src="/images/jazzcash_emblem.png"
        alt="JazzCash"
        className="w-full h-full object-contain pointer-events-none select-none"
        loading="eager"
      />
    </div>
  );
};

/**
 * Official State Bank of Pakistan RAAST Instant Payment Icon (from official source)
 */
export const RaastIcon: React.FC<IconProps> = ({ className = "", size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg bg-white p-0.5 shadow-sm border border-white/20 overflow-hidden ${className}`}
      title="Raast"
    >
      <img
        src="/images/raast_emblem.png"
        alt="Raast"
        className="w-full h-full object-contain pointer-events-none select-none"
        loading="eager"
      />
    </div>
  );
};

/**
 * Bank Transfer + Official Raast Combined Badge Icon
 * Prominently displays the official Raast logo with bank transfer certification
 */
export const BankRaastIcon: React.FC<IconProps> = ({ className = "", size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl bg-white p-0.5 shadow-[0_2px_8px_rgba(56,189,248,0.25)] border border-sky-500/40 overflow-visible ${className}`}
      title="Pakistani Bank Transfer via Raast Instant Settlement"
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[10px]">
        <img
          src="/images/raast_official.png"
          alt="Raast Bank Transfer"
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="eager"
        />
      </div>
      {/* Mini Bank Emblem in corner to indicate Bank Transfer + Raast */}
      <div
        className="absolute -bottom-1 -right-1 rounded-full bg-[#0B132B] border border-sky-400 text-sky-400 flex items-center justify-center shadow-md z-10"
        style={{
          width: Math.max(13, Math.round(size * 0.4)),
          height: Math.max(13, Math.round(size * 0.4)),
        }}
        title="Bank Transfer"
      >
        <svg
          viewBox="0 0 24 24"
          width="60%"
          height="60%"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m2 9 10-6 10 6" />
          <path d="M6 10v9" />
          <path d="M10 10v9" />
          <path d="M14 10v9" />
          <path d="M18 10v9" />
          <path d="M2 19h20" />
        </svg>
      </div>
    </div>
  );
};

/**
 * USDT (TRC20) Crypto Currency Icon
 */
export const UsdtIcon: React.FC<IconProps> = ({ className = "", size = 32 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-[#26A17B] via-[#1E7E60] to-[#12523E] shadow-[0_2px_8px_rgba(38,161,123,0.3)] border border-[#26A17B]/50 ${className}`}
      title="USDT TRC20"
    >
      <svg
        viewBox="0 0 32 32"
        width={size * 0.7}
        height={size * 0.7}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.8 14.2V11.8H24V8H8V11.8H14.2V14.2C9.5 14.4 6 15.6 6 17C6 18.4 9.5 19.6 14.2 19.8V26H17.8V19.8C22.5 19.6 26 18.4 26 17C26 15.6 22.5 14.4 17.8 14.2ZM16 18.4C11.8 18.4 8.7 17.5 8.7 17C8.7 16.5 11.8 15.6 16 15.6C20.2 15.6 23.3 16.5 23.3 17C23.3 17.5 20.2 18.4 16 18.4Z"
          fill="white"
        />
      </svg>
    </div>
  );
};
