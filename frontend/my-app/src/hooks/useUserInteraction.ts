// hooks/useUserInteraction.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';

interface UseUserInteractionOptions {
  editorRef: React.RefObject<any>;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  debounceMs?: number;
}

export function useUserInteraction({
  editorRef,
  onInteractionStart,
  onInteractionEnd,
  debounceMs = 1000,
}: UseUserInteractionOptions) {
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef(false);
  const playbackStore = usePlaybackStore();

  const handleInteractionStart = useCallback(() => {
    if (!isInteractingRef.current) {
      isInteractingRef.current = true;
      onInteractionStart?.();
      
      // Pause playback if playing
      if (playbackStore.isPlaying && !playbackStore.isPaused) {
        playbackStore.pause();
        playbackStore.setMode('exploring');
      }
    }

    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    interactionTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      onInteractionEnd?.();
    }, debounceMs);
  }, [onInteractionStart, onInteractionEnd, debounceMs, playbackStore]);

  useEffect(() => {
    const editor = editorRef.current?.getEditor?.();
    if (!editor) return;

    const disposables: any[] = [];

    // Listen for various interaction events
    disposables.push(
      editor.onDidChangeModelContent(() => {
        handleInteractionStart();
        playbackStore.setHasChanges(true);
      })
    );

    disposables.push(
      editor.onDidChangeCursorPosition(() => {
        handleInteractionStart();
      })
    );

    disposables.push(
      editor.onDidChangeCursorSelection(() => {
        handleInteractionStart();
      })
    );

    disposables.push(
      editor.onDidScrollChange(() => {
        handleInteractionStart();
      })
    );

    // Listen for focus events
    const domNode = editor.getDomNode();
    if (domNode) {
      const handleFocus = () => {
        handleInteractionStart();
        if (playbackStore.mode === 'following') {
          playbackStore.setMode('exploring');
        }
      };

      domNode.addEventListener('focusin', handleFocus);
      domNode.addEventListener('mousedown', handleInteractionStart);
      domNode.addEventListener('keydown', handleInteractionStart);

      return () => {
        disposables.forEach((d) => d.dispose?.());
        domNode.removeEventListener('focusin', handleFocus);
        domNode.removeEventListener('mousedown', handleInteractionStart);
        domNode.removeEventListener('keydown', handleInteractionStart);
        if (interactionTimeoutRef.current) {
          clearTimeout(interactionTimeoutRef.current);
        }
      };
    }

    return () => {
      disposables.forEach((d) => d.dispose?.());
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [editorRef, handleInteractionStart, playbackStore]);

  return {
    isInteracting: () => isInteractingRef.current,
  };
}
