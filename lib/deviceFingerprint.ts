"use client";

/**
 * Lightweight deterministic client-side device fingerprint generator.
 * Combines screen geometry, user agent, timezone, color depth, and canvas signature
 * to uniquely identify physical devices and prevent multi-account bonus farming.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "DEV-SERVER-000000";
  }

  try {
    const signals = [
      navigator.userAgent || "",
      navigator.language || "",
      screen.width + "x" + screen.height,
      screen.colorDepth || "",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      navigator.hardwareConcurrency || "",
    ];

    let canvasHash = 0;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 40;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(10, 5, 62, 20);
        ctx.fillStyle = "#f59e0b";
        ctx.fillText("OKWIN-SEC-v1", 12, 10);
        const dataUrl = canvas.toDataURL();
        for (let i = 0; i < dataUrl.length; i++) {
          canvasHash = (canvasHash << 5) - canvasHash + dataUrl.charCodeAt(i);
          canvasHash |= 0;
        }
      }
    } catch {}

    signals.push(canvasHash.toString());

    const rawString = signals.join("###");
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash << 5) - hash + rawString.charCodeAt(i);
      hash |= 0;
    }

    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
    return "DEV-" + hex;
  } catch {
    let localId = localStorage.getItem("okwin_dev_anon_id");
    if (!localId) {
      localId = "DEV-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem("okwin_dev_anon_id", localId);
    }
    return localId;
  }
}
