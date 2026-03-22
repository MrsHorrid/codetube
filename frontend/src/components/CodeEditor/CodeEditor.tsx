import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

// Tell Monaco where to load workers from (bundled by vite)
loader.config({ monaco });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodeEditorProps {
  language?: 'typescript' | 'javascript' | 'python' | 'json' | 'html' | 'css';
  value?: string;
  onChange?: (value: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onUserEdit?: () => void;
  theme?: string;
  readOnly?: boolean;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export interface CodeEditorRef {
  // Value
  getValue: () => string;
  setValue: (value: string) => void;
  // Text operations
  insertText: (text: string, line: number, col: number) => void;
  deleteRange: (startLine: number, startCol: number, endLine: number, endCol: number) => void;
  applyEdit: (startLine: number, startCol: number, endLine: number, endCol: number, text: string) => void;
  // Cursor
  getCursorPosition: () => { line: number; column: number } | null;
  setCursorPosition: (line: number, column: number) => void;
  revealLine: (line: number) => void;
  // Playback flag (suppress user-edit events during playback)
  setPlaybackMode: (active: boolean) => void;
  // Focus
  focus: () => void;
  getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
}

// ─── Theme definition ────────────────────────────────────────────────────────

let themeRegistered = false;

function ensureTheme() {
  if (themeRegistered) return;
  themeRegistered = true;
  monaco.editor.defineTheme('codetube-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#1a1a2e',
      'editor.foreground': '#D4D4D4',
      'editor.lineHighlightBackground': '#16213e',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorCursor.foreground': '#00d2ff',
      'editorLineNumber.foreground': '#495670',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.findMatchBackground': '#9E6A03',
      'editor.findMatchHighlightBackground': '#9E6A0340',
    },
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  (
    {
      language = 'typescript',
      value = '',
      onChange,
      onCursorChange,
      onUserEdit,
      theme = 'codetube-dark',
      readOnly = false,
      options,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const isPlaybackActiveRef = useRef(false);
    const onChangeRef = useRef(onChange);
    const onUserEditRef = useRef(onUserEdit);
    const onCursorChangeRef = useRef(onCursorChange);

    // Keep callbacks current without re-creating the editor
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    useEffect(() => { onUserEditRef.current = onUserEdit; }, [onUserEdit]);
    useEffect(() => { onCursorChangeRef.current = onCursorChange; }, [onCursorChange]);

    // ── Initialize editor ──────────────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current) return;

      ensureTheme();

      const editor = monaco.editor.create(containerRef.current, {
        value,
        language,
        theme,
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'line',
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        fontLigatures: true,
        readOnly,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        ...options,
      });

      editorRef.current = editor;

      // Content changes
      editor.onDidChangeModelContent(() => {
        const val = editor.getValue();
        onChangeRef.current?.(val);
        if (!isPlaybackActiveRef.current) {
          onUserEditRef.current?.();
        }
      });

      // Cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        onCursorChangeRef.current?.(e.position.lineNumber, e.position.column);
      });

      return () => {
        editor.dispose();
        editorRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — editor is created once

    // ── Sync readOnly option without rebuild ────────────────────────────────
    useEffect(() => {
      editorRef.current?.updateOptions({ readOnly });
    }, [readOnly]);

    // ── Expose imperative API ───────────────────────────────────────────────
    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editorRef.current,

        getValue: () => editorRef.current?.getValue() ?? '',

        setValue: (newValue: string) => {
          const editor = editorRef.current;
          if (!editor) return;
          // Use pushEditOperations so it can be undone
          const model = editor.getModel();
          if (!model) return;
          const fullRange = model.getFullModelRange();
          model.pushEditOperations(
            [],
            [{ range: fullRange, text: newValue, forceMoveMarkers: true }],
            () => null
          );
        },

        insertText: (text: string, line: number, col: number) => {
          const editor = editorRef.current;
          if (!editor) return;
          const model = editor.getModel();
          if (!model) return;
          model.applyEdits([
            {
              range: new monaco.Range(line, col, line, col),
              text,
              forceMoveMarkers: true,
            },
          ]);
        },

        deleteRange: (
          startLine: number,
          startCol: number,
          endLine: number,
          endCol: number
        ) => {
          const editor = editorRef.current;
          if (!editor) return;
          const model = editor.getModel();
          if (!model) return;
          model.applyEdits([
            {
              range: new monaco.Range(startLine, startCol, endLine, endCol),
              text: '',
              forceMoveMarkers: true,
            },
          ]);
        },

        applyEdit: (
          startLine: number,
          startCol: number,
          endLine: number,
          endCol: number,
          text: string
        ) => {
          const editor = editorRef.current;
          if (!editor) return;
          const model = editor.getModel();
          if (!model) return;
          model.applyEdits([
            {
              range: new monaco.Range(startLine, startCol, endLine, endCol),
              text,
              forceMoveMarkers: true,
            },
          ]);
        },

        getCursorPosition: () => {
          const pos = editorRef.current?.getPosition();
          if (!pos) return null;
          return { line: pos.lineNumber, column: pos.column };
        },

        setCursorPosition: (line: number, column: number) => {
          const editor = editorRef.current;
          if (!editor) return;
          const pos = new monaco.Position(line, column);
          editor.setPosition(pos);
          editor.revealPositionInCenterIfOutsideViewport(pos, monaco.editor.ScrollType.Smooth);
        },

        revealLine: (line: number) => {
          editorRef.current?.revealLineInCenter(line, monaco.editor.ScrollType.Smooth);
        },

        setPlaybackMode: (active: boolean) => {
          isPlaybackActiveRef.current = active;
        },

        focus: () => {
          editorRef.current?.focus();
        },
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
      />
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
