import React from 'react';

type IconProps = { size?: number; className?: string };
const base = (size: number) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const,
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const IconCalendar = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="16" rx="2.2" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
  </svg>
);

export const IconCamera = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const IconNotebook = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M6 3.5h11a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2z" />
    <path d="M3.6 6.5H6M3.6 11H6M3.6 15.5H6" />
    <path d="M9.5 8.5h5.5M9.5 12h3.6" />
  </svg>
);

export const IconTrash = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

export const IconUpload = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const IconSearch = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const IconPin = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
    <circle cx="12" cy="9" r="2.4" />
  </svg>
);

export const IconClose = ({ size = 15, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);

export const IconLogOut = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M21 12L13 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 15L20.913 12.087V12.087C20.961 12.039 20.961 11.961 20.913 11.913V11.913L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 5V4.5V4.5C16 3.67157 15.3284 3 14.5 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H14.5C15.3284 21 16 20.3284 16 19.5V19.5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconEdit = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M14 6L8 12V16H12L18 10M14 6L17 3L21 7L18 10M14 6L18 10M10 4L4 4L4 20L20 20V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconStampEmpty = ({ size = 30, className }: IconProps) => (
  <svg {...base(size)} className={className} aria-hidden="true">
    <rect x="3" y="6" width="18" height="13" rx="1.5" strokeDasharray="2.4 2.4" />
    <path d="M3 9.5l9 5.5 9-5.5" strokeDasharray="2.4 2.4" />
  </svg>
);

export const IconSpinner = ({ size = 13, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
    </path>
  </svg>
);
