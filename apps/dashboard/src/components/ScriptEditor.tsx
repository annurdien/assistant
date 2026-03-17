import Editor from '@monaco-editor/react';
import { useEffect } from 'react';

type ScriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const DEFAULT_TEMPLATE = `/**
 * @param {import("@assistant/sandbox").Context} ctx
 */
export default async function (ctx) {
  const { input, ai, expense, db, reply } = ctx;
  // Your execution logic here...
  
  return "Success!";
}`;

// Define the shape of the sandbox context to power Monaco's intellisense
const SandboxDeclarations = `
declare module "@assistant/sandbox" {
  export interface Context {
    /** The raw string input provided by the user after the command. */
    input: string;
    
    /** The AI Service for prompting the LLM. */
    ai: {
      ask(prompt: string): Promise<string>;
    };
    
    /** The Expense Service for managing user budget entries. */
    expense: {
      add(amount: number, description: string): Promise<string>;
      list(): Promise<string>;
    };
    
    /** The Prisma Database instance for direct data operations. */
    db: any;
    
    /** Send a text reply back to the user on WhatsApp. */
    reply(text: string): void;
  }
}

declare const ctx: import("@assistant/sandbox").Context;
`;

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
        language="javascript"
        theme="vs-dark"
        onMount={(_, monaco) => {
          // Add the contextual sandbox typing definitions into the editor instance
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            SandboxDeclarations,
            "ts:filename/sandbox.d.ts"
          );
          // Don't complain about top-level return in our string-scripts
          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
          });
        }}
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
