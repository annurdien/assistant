import Editor from '@monaco-editor/react';
import { useEffect, useState, useRef } from 'react';
import { Maximize2, Minimize2, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ScriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const DEFAULT_TEMPLATE = `/**
 * @param {SandboxContext} ctx
 */
export default async function (ctx) {
  const { input, ai, expense, db, reply } = ctx;
  // Your execution logic here...
  
  return "Success!";
}`;

// Define the shape of the sandbox context to power Monaco's intellisense
const SandboxDeclarations = `
interface SandboxContext {
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
`;

export default function ScriptEditor({ value, onChange, disabled = false }: ScriptEditorProps) {
  const displayValue = value || DEFAULT_TEMPLATE;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    // If we have an empty value initially, we want to broadcast the default template upwards
    // so that the parent form creates the backend entity with the template instead of empty string
    if (!value) {
      onChange(DEFAULT_TEMPLATE);
    }
  }, []);

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      className={isFullscreen ? "fixed inset-0 z-[100] bg-background flex flex-col" : "relative flex flex-col border rounded-md overflow-hidden bg-background h-[500px] w-full"}
      style={{
        opacity: disabled ? 0.7 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Editor Toolbar */}
      <div className="bg-muted p-2 flex justify-between items-center border-b">
        <div className="text-muted-foreground text-xs ml-2 font-mono">
          execute.js <span className="opacity-50 mx-2">|</span> JavaScript
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={handleFormat}
            title="Format Document (Shift+Alt+F)"
            className="h-7 text-xs px-2"
          >
            <AlignLeft size={14} className="mr-1" /> Format
          </Button>
          <Button 
            type="button" 
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="h-7 text-xs px-2"
          >
            {isFullscreen ? (
              <><Minimize2 size={14} className="mr-1" /> Exit Fullscreen</>
            ) : (
              <><Maximize2 size={14} className="mr-1" /> Fullscreen</>
            )}
          </Button>
        </div>
      </div>
      
      {/* Editor Main Canvas */}
      <div className="flex-1 overflow-hidden relative">
      <Editor
        height="100%"
        language="javascript"
        theme="vs-dark"
        beforeMount={(monaco) => {
          // Configure JavaScript language service for Monaco to enable Autocomplete
          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
          });

          // Enforce moduleResolution and compilation options so typed modules evaluate correctly
          monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            typeRoots: ["node_modules/@types"],
            checkJs: true, // Enable JSDoc structural checking
            allowJs: true,
          });

          // Add the contextual sandbox typing definitions into the editor instance
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            SandboxDeclarations,
            "file:///types.d.ts"
          );
        }}
        onMount={(editor) => {
          editorRef.current = editor;
        }}
        path="file:///main.js"
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
    </div>
  );
}
