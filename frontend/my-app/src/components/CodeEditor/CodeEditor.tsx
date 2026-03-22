// components/CodeEditor/CodeEditor.tsx
'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco loader
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.47.0/min/vs',
  },
});

export interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string) => void;
  onCursorChange?: (position: { line: number; column: number; isPlayback?: boolean }) => void;
  onUserEdit?: (edit: any) => void;
  theme?: string;
  readOnly?: boolean;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  height?: string;
}

export interface CodeEditorRef {
  getEditor: () => monaco.editor.IStandaloneCodeEditor | null;
  setValue: (value: string, animate?: boolean) => void;
  insertText: (text: string, position: { lineNumber: number; column: number }) => void;
  setCursorPosition: (line: number, column: number, animate?: boolean) => void;
  focus: () => void;
  applyEdit: (edit: { range: any; text: string }) => void;
  highlightRange: (range: any, className?: string) => void;
  clearHighlight: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  (
    {
      language,
      value,
      onChange,
      onCursorChange,
      onUserEdit,
      theme = 'codetube-dark',
      readOnly = false,
      options,
      height = '100%',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const isPlaybackActive = useRef(false);
    const decorationsRef = useRef<string[]>([]);

    // Define custom CodeTube theme
    useEffect(() => {
      loader.init().then((monaco) => {
        monaco.editor.defineTheme('codetube-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'FF6B9D' },
            { token: 'identifier', foreground: 'E6EDF3' },
            { token: 'string', foreground: 'A3E635' },
            { token: 'number', foreground: 'FB923C' },
            { token: 'operator', foreground: 'F9A8D4' },
            { token: 'type', foreground: 'FBBF24' },
          ],
          colors: {
            'editor.background': '#1E1E2E',
            'editor.lineHighlightBackground': '#2A2A3C',
            'editor.selectionBackground': '#264F78',
            'editor.inactiveSelectionBackground': '#3A3D41',
            'editorCursor.foreground': '#7C3AED',
            'editorLineNumber.foreground': '#484F58',
            'editorLineNumber.activeForeground': '#8B949E',
            'editorGutter.background': '#1E1E2E',
          },
        });

        // TypeScript/JavaScript enhanced configuration
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          allowSyntheticDefaultImports: true,
          strict: true,
        });
      });
    }, []);

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // Set up change detection
      editor.onDidChangeModelContent((event) => {
        if (!isPlaybackActive.current && onUserEdit) {
          const changes = event.changes.map((change) => ({
            range: change.range,
            text: change.text,
            rangeOffset: change.rangeOffset,
            rangeLength: change.rangeLength,
          }));
          onUserEdit({ changes, timestamp: Date.now() });
        }
        if (onChange) {
          onChange(editor.getValue());
        }
      });

      // Track cursor position
      editor.onDidChangeCursorPosition((event) => {
        if (onCursorChange) {
          onCursorChange({
            line: event.position.lineNumber,
            column: event.position.column,
            isPlayback: isPlaybackActive.current,
          });
        }
      });

      // Detect user focus
      editor.onDidFocusEditorText(() => {
        if (!readOnly && !isPlaybackActive.current) {
          document.dispatchEvent(new CustomEvent('codetube:user-focus'));
        }
      });
    };

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,

      setValue: (newValue: string, animate = false) => {
        if (!editorRef.current) return;

        if (!animate) {
          editorRef.current.setValue(newValue);
          return;
        }

        // Animated value setting
        const model = editorRef.current.getModel();
        if (!model) return;

        model.setValue('');
        const chars = newValue.split('');
        let index = 0;

        const typeNextChar = () => {
          if (index < chars.length) {
            const pos = model.getPositionAt(model.getValueLength());
            model.applyEdits([
              {
                range: new monaco.Range(
                  pos.lineNumber,
                  pos.column,
                  pos.lineNumber,
                  pos.column
                ),
                text: chars[index],
              },
            ]);
            index++;
            setTimeout(typeNextChar, 10);
          }
        };

        typeNextChar();
      },

      insertText: (text: string, position: { lineNumber: number; column: number }) => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        model.applyEdits([
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text,
          },
        ]);
      },

      setCursorPosition: (line: number, column: number, animate = false) => {
        if (!editorRef.current) return;

        const position = new monaco.Position(line, column);

        if (!animate) {
          editorRef.current.setPosition(position);
          editorRef.current.revealPositionInCenterIfOutsideViewport(position);
          return;
        }

        // Animate cursor movement
        const currentPos = editorRef.current.getPosition();
        if (!currentPos) return;

        const steps = 10;
        const dLine = (line - currentPos.lineNumber) / steps;
        const dCol = (column - currentPos.column) / steps;
        let step = 0;

        const animateStep = () => {
          if (step < steps) {
            const newLine = Math.round(currentPos.lineNumber + dLine * step);
            const newCol = Math.round(currentPos.column + dCol * step);
            editorRef.current?.setPosition(
              new monaco.Position(newLine, newCol)
            );
            step++;
            requestAnimationFrame(animateStep);
          } else {
            editorRef.current?.setPosition(position);
            editorRef.current?.revealPositionInCenterIfOutsideViewport(position);
          }
        };

        animateStep();
      },

      focus: () => {
        editorRef.current?.focus();
      },

      applyEdit: (edit: { range: any; text: string }) => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        model.pushEditOperations(
          [],
          [
            {
              range: monaco.Range.lift(edit.range),
              text: edit.text,
              forceMoveMarkers: true,
            },
          ],
          () => null
        );
      },

      highlightRange: (range: any, className = 'codetube-highlight') => {
        if (!editorRef.current) return;

        const newDecorations = editorRef.current.deltaDecorations(
          decorationsRef.current,
          [
            {
              range,
              options: {
                className,
                isWholeLine: false,
                overviewRuler: {
                  color: '#7C3AED',
                  position: monaco.editor.OverviewRulerLane.Center,
                },
              },
            },
          ]
        );
        decorationsRef.current = newDecorations;
      },

      clearHighlight: () => {
        if (!editorRef.current) return;
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          []
        );
      },
    }));

    return (
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        <Editor
          height={height}
          language={language}
          value={value}
          theme={theme}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            readOnly,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            renderWhitespace: 'selection',
            ...options,
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
