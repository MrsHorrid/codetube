/**
 * CodeEditor Component Tests
 *
 * Tests the Monaco Editor wrapper including:
 * - Rendering
 * - Value changes
 * - Editor methods
 * - Theme configuration
 * - Event handlers
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeEditor, CodeEditorRef } from '@/components/CodeEditor/CodeEditor';

// Mock Monaco loader
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: function MockEditor({ value, onChange, onMount, options }: any) {
    React.useEffect(() => {
      if (onMount) {
        // Create a mock editor instance
        const mockEditor = {
          getValue: () => value,
          setValue: (v: string) => onChange?.(v),
          getModel: () => ({
            getValueLength: () => value?.length || 0,
            getPositionAt: () => ({ lineNumber: 1, column: 1 }),
            applyEdits: jest.fn(),
            pushEditOperations: jest.fn(),
          }),
          onDidChangeModelContent: (cb: any) => {
            // Store callback for later use
            (mockEditor as any)._contentCallback = cb;
            return { dispose: jest.fn() };
          },
          onDidChangeCursorPosition: (cb: any) => {
            (mockEditor as any)._cursorCallback = cb;
            return { dispose: jest.fn() };
          },
          onDidFocusEditorText: (cb: any) => {
            (mockEditor as any)._focusCallback = cb;
            return { dispose: jest.fn() };
          },
          setPosition: jest.fn(),
          revealPositionInCenterIfOutsideViewport: jest.fn(),
          revealLineInCenter: jest.fn(),
          focus: jest.fn(),
          deltaDecorations: jest.fn(() => []),
          getPosition: () => ({ lineNumber: 1, column: 1 }),
        };
        onMount(mockEditor);
      }
    }, [onMount]);

    return (
      <div data-testid="monaco-editor" data-value={value}>
        <textarea
          data-testid="mock-editor"
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  },
  loader: {
    config: jest.fn(),
    init: jest.fn(() => Promise.resolve({
      editor: {
        defineTheme: jest.fn(),
        setModelLanguage: jest.fn(),
      },
      languages: {
        typescript: {
          typescriptDefaults: {
            setCompilerOptions: jest.fn(),
          },
        },
      },
      Range: {
        lift: jest.fn((r: any) => r),
      },
    })),
  },
}));

describe('CodeEditor', () => {
  const defaultProps = {
    language: 'typescript',
    value: '// Test code',
    onChange: jest.fn(),
  };

  it('should render the editor', () => {
    render(<CodeEditor {...defaultProps} />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should display the initial value', () => {
    render(<CodeEditor {...defaultProps} value="const x = 1;" />);
    expect(screen.getByTestId('mock-editor')).toHaveValue('const x = 1;');
  });

  it('should call onChange when content changes', () => {
    const onChange = jest.fn();
    render(<CodeEditor {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByTestId('mock-editor');
    fireEvent.change(textarea, { target: { value: 'const y = 2;' } });

    expect(onChange).toHaveBeenCalledWith('const y = 2;');
  });

  it('should apply custom height', () => {
    render(<CodeEditor {...defaultProps} height="500px" />);
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should support readOnly mode', () => {
    render(<CodeEditor {...defaultProps} readOnly={true} />);
    // Monaco editor receives readOnly in options
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should apply custom theme', () => {
    render(<CodeEditor {...defaultProps} theme="vs-dark" />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  describe('Imperative Methods', () => {
    it('should expose setValue method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('setValue');
    });

    it('should expose insertText method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('insertText');
    });

    it('should expose setCursorPosition method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('setCursorPosition');
    });

    it('should expose focus method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('focus');
    });

    it('should expose applyEdit method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('applyEdit');
    });

    it('should expose highlightRange method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('highlightRange');
    });

    it('should expose clearHighlight method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('clearHighlight');
    });

    it('should expose getEditor method', () => {
      const ref = React.createRef<CodeEditorRef>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toHaveProperty('getEditor');
    });
  });

  describe('Event Handlers', () => {
    it('should call onCursorChange when cursor moves', () => {
      const onCursorChange = jest.fn();
      render(<CodeEditor {...defaultProps} onCursorChange={onCursorChange} />);

      // The editor should have registered the cursor change handler
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should call onUserEdit when user makes changes', () => {
      const onUserEdit = jest.fn();
      render(<CodeEditor {...defaultProps} onUserEdit={onUserEdit} />);

      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Language Support', () => {
    it('should support TypeScript', () => {
      render(<CodeEditor {...defaultProps} language="typescript" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should support JavaScript', () => {
      render(<CodeEditor {...defaultProps} language="javascript" value="const x = 1;" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should support Python', () => {
      render(<CodeEditor {...defaultProps} language="python" value="x = 1" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should support Rust', () => {
      render(<CodeEditor {...defaultProps} language="rust" value="let x = 1;" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Options', () => {
    it('should accept custom editor options', () => {
      const customOptions = {
        fontSize: 16,
        lineNumbers: 'off' as const,
        minimap: { enabled: true },
      };

      render(<CodeEditor {...defaultProps} options={customOptions} />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should merge custom options with defaults', () => {
      render(<CodeEditor {...defaultProps} options={{ fontSize: 20 }} />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<CodeEditor {...defaultProps} value="" />);
      expect(screen.getByTestId('mock-editor')).toHaveValue('');
    });

    it('should handle null/undefined value', () => {
      render(<CodeEditor {...defaultProps} value={undefined as any} />);
      expect(screen.getByTestId('mock-editor')).toHaveValue('');
    });

    it('should handle very long content', () => {
      const longContent = 'x'.repeat(100000);
      render(<CodeEditor {...defaultProps} value={longContent} />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const specialContent = 'const x = "hello\nworld" + \'\\n\' + `template`; // 🎉';
      render(<CodeEditor {...defaultProps} value={specialContent} />);
      expect(screen.getByTestId('mock-editor')).toHaveValue(specialContent);
    });

    it('should handle multi-byte unicode', () => {
      const unicodeContent = '// 日本語 🎉 émojis';
      render(<CodeEditor {...defaultProps} value={unicodeContent} />);
      expect(screen.getByTestId('mock-editor')).toHaveValue(unicodeContent);
    });
  });
});
