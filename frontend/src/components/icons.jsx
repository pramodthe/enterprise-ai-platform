import React from 'react';

const Icon = ({ strokeWidth = 2, className = 'h-5 w-5', path }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{path}</svg>
);

export const IUsers = (p) => (
  <Icon {...p} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />
);
export const IChart = (p) => (
  <Icon {...p} path={<><path d="M3 3v18h18"/><rect x="7" y="8" width="3" height="8"/><rect x="12" y="5" width="3" height="11"/><rect x="17" y="11" width="3" height="5"/></>} />
);
export const IFileSearch = (p) => (
  <Icon {...p} path={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="11" cy="14" r="2"/><path d="m13 16 2 2"/></>} />
);
export const IMessage = (p) => (
  <Icon {...p} path={<><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></>} />
);
export const ISearch = (p) => (
  <Icon {...p} path={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} />
);
export const ISparkles = (p) => (
  <Icon {...p} path={<><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></>} />
);
export const IChevronDown = (p) => (<Icon {...p} path={<path d="m6 9 6 6 6-6"/>} />);
export const IX = (p) => (
  <Icon {...p} path={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} />
);
export const IArrowRight = (p) => (<Icon {...p} path={<path d="M5 12h14M12 5l7 7-7 7"/>} />);
export const IChevronLeft = (p) => (<Icon {...p} path={<path d="m15 18-6-6 6-6"/>} />);
export const IChevronRight = (p) => (<Icon {...p} path={<path d="m9 6 6 6-6 6"/>} />);
export const ISliders = (p) => (
  <Icon {...p} path={<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 10V3"/><circle cx="4" cy="14" r="2"/><circle cx="12" cy="11" r="2"/><circle cx="20" cy="16" r="2"/></>} />
);
export const ISend = (p) => (
  <Icon {...p} path={<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>} />
);

export default Icon;