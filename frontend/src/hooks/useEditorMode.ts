import { useState, useCallback, RefObject } from 'react';
import type { EditorMode } from '@/types/codetube';
import type { CodeEditorRef } from '@/components/CodeEditor/CodeEditor';

interface Options {
  editorRef: RefObject<CodeEditorRef | null>;
  onPausePlayback: () => void;
}

export function useEditorMode({ editorRef, onPausePlayback }: Options) {
  const [mode, setMode] = useState<EditorMode>('FOLLOWING');
  const [userCode, setUserCode] = useState<string>('');

  const enterFollowing = useCallback(
    (instructorCode: string) => {
      setMode('FOLLOWING');
      editorRef.current?.setPlaybackMode(true);
      editorRef.current?.setValue(instructorCode);
    },
    [editorRef]
  );

  const enterExploring = useCallback(() => {
    if (mode === 'FOLLOWING') {
      onPausePlayback();
      // Capture current code before switching
      setUserCode(editorRef.current?.getValue() ?? '');
    }
    setMode('EXPLORING');
    editorRef.current?.setPlaybackMode(false);
  }, [mode, editorRef, onPausePlayback]);

  const enterEditing = useCallback(() => {
    if (mode === 'FOLLOWING') {
      onPausePlayback();
      setUserCode(editorRef.current?.getValue() ?? '');
    }
    setMode('EDITING');
    editorRef.current?.setPlaybackMode(false);
    editorRef.current?.focus();
  }, [mode, editorRef, onPausePlayback]);

  // Auto-pause when user types while FOLLOWING
  const handleUserEdit = useCallback(() => {
    if (mode === 'FOLLOWING') {
      enterEditing();
    } else {
      setUserCode(editorRef.current?.getValue() ?? '');
    }
  }, [mode, enterEditing, editorRef]);

  const isReadOnly = mode === 'FOLLOWING';

  return {
    mode,
    isReadOnly,
    enterFollowing,
    enterExploring,
    enterEditing,
    handleUserEdit,
    userCode,
  };
}
