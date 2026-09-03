'use client';

import { useEffect } from 'react';

type SavedStyles = {
  rootOverflow: string;
  rootOverscrollBehavior: string;
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  bodyPaddingRight: string;
};

let activeLocks = 0;
let lockedScrollY = 0;
let savedStyles: SavedStyles | null = null;

function acquireDocumentScrollLock() {
  const root = document.documentElement;
  const body = document.body;

  if (activeLocks === 0) {
    lockedScrollY = window.scrollY || root.scrollTop;
    savedStyles = {
      rootOverflow: root.style.overflow,
      rootOverscrollBehavior: root.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
    };

    const scrollbarWidth = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${lockedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
  }

  activeLocks += 1;

  return () => {
    activeLocks = Math.max(0, activeLocks - 1);
    if (activeLocks > 0 || !savedStyles) return;

    root.style.overflow = savedStyles.rootOverflow;
    root.style.overscrollBehavior = savedStyles.rootOverscrollBehavior;
    body.style.overflow = savedStyles.bodyOverflow;
    body.style.overscrollBehavior = savedStyles.bodyOverscrollBehavior;
    body.style.position = savedStyles.bodyPosition;
    body.style.top = savedStyles.bodyTop;
    body.style.left = savedStyles.bodyLeft;
    body.style.right = savedStyles.bodyRight;
    body.style.width = savedStyles.bodyWidth;
    body.style.paddingRight = savedStyles.bodyPaddingRight;
    root.scrollTop = lockedScrollY;
    body.scrollTop = lockedScrollY;
    savedStyles = null;
  };
}

export function useDocumentScrollLock() {
  useEffect(() => acquireDocumentScrollLock(), []);
}
