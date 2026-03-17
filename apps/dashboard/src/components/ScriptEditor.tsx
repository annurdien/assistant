import Editor from '@monaco-editor/react';
import { useEffect } from 'react';

type ScriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const DEFAULT_TEMPLATE = `export default async function (ctx) {
  const { input, ai, expense, db, reply } = ctx;
  // Your execution logic here...
  
  return "Success!";
}`;

export default function ScriptEditor({ value, onChange, disabled = false }: ScriptEditorProps) {
  const displayValue = value || DEFAULT_TEMPLATE;

  useEffect(() => {
    // If we have an empty value initially, we want to broadcast the default template upwards
    // so that the parent form creates the backend entity with the template instead of empty string
    if (!value) {
      onChange(DEFAULT_TEMPLATE);
    }
  }, []);

  return (
    <div 
      style={{
        height: '400px',
        width: '100%',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      <Editor
        height="100%"
        language="typescript"
        theme="vs-dark"
        value={displayValue}
        onChange={(val) => {
          if (val !== undefined) {
            onChange(val);
          }
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: disabled,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on'
        }}
      />
    </div>
  );
}
