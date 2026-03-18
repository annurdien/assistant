export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

/**
 * Parses a raw chat command string into a structured object.
 * 
 * Supports commands starting with a prefix (default "/") and handles quoted arguments.
 * Example:
 *   "/expense add 100 coffee"
 *   => { command: "expense", args: ["add", "100", "coffee"], raw: "/expense add 100 coffee" }
 * 
 *   '!expense add "monthly rent"' 
 *   => { command: "expense", args: ["add", "monthly rent"], raw: '!expense add "monthly rent"' }
 */
export function parseCommand(rawInput: string, prefix: string = '/'): ParsedCommand | null {
  const trimmed = rawInput.trim();
  
  // If prefix is string but empty, we don't require prefix. 
  // Otherwise check if it starts with the prefix.
  if (prefix !== '' && !trimmed.startsWith(prefix)) {
    return null;
  }

  // Remove the prefixing characters
  const inputWithoutPrefix = trimmed.slice(prefix.length);

  // Regex to split by spaces, but keep text inside quotes together
  // Matches either text inside quotes OR non-space characters
  const argRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  
  const matches = [...inputWithoutPrefix.matchAll(argRegex)];

  if (matches.length === 0 || !matches[0]) {
    return null;
  }

  // First element is the command, remaining are arguments
  const commandStr = matches[0][0].toLowerCase();
  
  const args = matches.slice(1).map(match => {
    // match[1] corresponds to double quotes content
    // match[2] corresponds to single quotes content
    // match[0] is the fallback for unquoted text
    return match[1] || match[2] || match[0];
  });

  return {
    command: commandStr,
    args,
    raw: trimmed
  };
}
