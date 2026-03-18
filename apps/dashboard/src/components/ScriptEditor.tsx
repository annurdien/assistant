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
 * @param {SandboxContext} ctx - The execution context. Type \`ctx.\` to see available APIs.
 */
export default async function (ctx) {
  const { input, ai, expense, db, reply, session, env, remind } = ctx;
  // Your execution logic here...
  
  return "Success!";
}`;

// The TypeScript ambient declarations that power Monaco's IntelliSense for the sandbox ctx object.
// These MUST exactly mirror the real Context type in packages/sdk/src/context.ts
const SandboxDeclarations = `
/** A media attachment (image, video, audio, document) sent alongside the message. */
interface SandboxMedia {
  /** MIME type of the media, e.g. "image/jpeg" */
  mimetype: string;
  /** Base64-encoded content of the media file. */
  data: string;
}

/** Result from a Knowledge Base semantic vector search. */
interface SearchResult {
  /** The ID of the source document. */
  documentId: string;
  /** The relevant chunk of text from the document. */
  content: string;
  /** Cosine similarity score (0-1). Higher is more relevant. */
  similarity: number;
}

/** Provides access to an expense record returned by ctx.expense.list(). */
interface ExpenseRecord {
  id: string;
  amount: number;
  note: string;
  createdAt: Date;
}

/**
 * The sandboxed execution context injected into every command script.
 * All APIs are pre-authenticated and scoped to the current request.
 */
interface SandboxContext {
  /**
   * The raw text the user typed after the command keyword.
   * e.g. if user sends "/remind buy milk", input = "buy milk"
   */
  input: string;

  /** AI capabilities powered by Gemini. */
  ai: {
    /**
     * Sends a prompt to the Gemini AI and returns the text response.
     * Follows WhatsApp formatting: uses *bold*, _italic_, \`\`\`code\`\`\`.
     * @param prompt The question or instruction for the AI.
     * @returns The AI-generated text response.
     * @example
     * const answer = await ai.ask("What is 2 + 2?");
     * reply(answer);
     */
    ask(prompt: string): Promise<string>;

    /**
     * Searches the Knowledge Base using semantic vector similarity.
     * Returns the most relevant document chunks for the given query.
     * @param query The natural language search query.
     * @param limit Maximum number of results to return (default: 3).
     * @returns Array of matching document chunks with similarity scores.
     * @example
     * const results = await ai.search("company refund policy");
     * const context = results.map(r => r.content).join("\\n");
     * reply(await ai.ask(\`Answer using this context: \${context}\nQ: \${input}\`));
     */
    search(query: string, limit?: number): Promise<SearchResult[]>;
  };

  /** Expense tracking service. */
  expense: {
    /**
     * Records a new expense entry in the database.
     * @param amount The amount/cost (can be a decimal number).
     * @param note A short description of the expense.
     * @example
     * await expense.add(12.5, "Lunch with team");
     */
    add(amount: number, note: string): Promise<ExpenseRecord>;

    /**
     * Lists all expense records, newest first.
     * @returns Array of all expense records.
     * @example
     * const all = await expense.list();
     * reply(all.map(e => \`- \${e.note}: \$\${e.amount}\`).join("\\n"));
     */
    list(): Promise<ExpenseRecord[]>;

    /**
     * Calculates the total sum of all recorded expenses.
     * @returns The total sum as a number.
     * @example
     * const total = await expense.summarize();
     * reply(\`Total spending: \$\${total}\`);
     */
    summarize(): Promise<number>;
  };

  /**
   * The Prisma database client for advanced, direct database operations.
   * Use for complex queries not covered by the standard services.
   * @example
   * const logs = await db.log.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
   */
  db: any;

  /**
   * Sends a text message back to the WhatsApp user.
   * Use WhatsApp formatting: *bold*, _italic_, ~strikethrough~, \`\`\`code\`\`\`
   * @param text The message to send.
   * @example
   * reply("Hello! How can I help you today?");
   */
  reply(text: string): Promise<void>;

  /**
   * Per-user persistent key-value session storage, scoped to the caller's WhatsApp number.
   * Data persists across separate command invocations.
   */
  session: {
    /**
     * Retrieves a value from the user's session.
     * @param key The unique identifier for the stored value.
     * @returns The stored value, or undefined if not found.
     * @example
     * const name = await session.get("name");
     * if (name) reply(\`Welcome back, \${name}!\`);
     */
    get(key: string): Promise<any>;

    /**
     * Stores a value in the user's session.
     * @param key The unique identifier to store the value under.
     * @param value The data to persist (can be any JSON-serializable value).
     * @example
     * await session.set("lastCommand", input);
     */
    set(key: string, value: any): Promise<void>;
  };

  /**
   * Any media files (images, audio, video, documents) sent alongside the command message.
   * Will be undefined if no media was attached.
   * @example
   * if (media && media.length > 0) {
   *   const answer = await ai.ask("Describe this image.", media);
   *   reply(answer);
   * }
   */
  media?: SandboxMedia[];

  /**
   * Schedules a one-time reminder message to be sent to the user in the future.
   * @param time When to send the reminder. Can be: a number of minutes, an ISO 8601 date string, or a Date object.
   * @param message The reminder text to send when the time arrives.
   * @example
   * // Remind in 30 minutes
   * await remind(30, "Time to take a break!");
   * // Remind at a specific time
   * await remind("2026-12-25T08:00:00", "Merry Christmas!");
   */
  remind(time: number | string | Date, message: string): Promise<void>;

  /**
   * Retrieves a secret value from the API Keys vault by key name.
   * Use this instead of hardcoding API keys in scripts.
   */
  env: {
    /**
     * Gets a secret value from the API Keys vault.
     * @param key The name of the secret (e.g. "OPENWEATHER_API_KEY").
     * @returns The secret value, or undefined if it doesn't exist.
     * @example
     * const apiKey = await env.get("OPENWEATHER_API_KEY");
     * if (!apiKey) { reply("API key not configured."); return; }
     */
    get(key: string): Promise<string | undefined>;
  };
}

/**
 * The execution context injected into every command script.
 * @global
 */
declare var ctx: SandboxContext;
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
          // Disable TypeScript strict type errors for JS mode to keep DX clean
          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true, // suppress "Cannot find name 'ctx'" etc.
            noSyntaxValidation: false,
          });

          // Use ESNext + loose JS mode so the editor focuses on DX not type errors
          monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            allowNonTsExtensions: true,
            allowJs: true,
            checkJs: false,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            noEmit: true,
            lib: ['esnext'],
          });

          // Register the ambient declarations so Monaco knows the shape of `ctx`
          // The `declare var ctx: SandboxContext` in the lib makes member completion work.
          monaco.languages.typescript.javascriptDefaults.addExtraLib(
            SandboxDeclarations,
            'ts:sandbox/context.d.ts'
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
