export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

/**
 * Parses a raw chat command string into a structured object.
 * 
 * Supports commands starting with "/" and handles quoted arguments.
 * Example:
 *   "/expense add 100 coffee"
 *   => { command: "expense", args: ["add", "100", "coffee"], raw: "/expense add 100 coffee" }
 * 
 *   '/expense add "monthly rent"' 
 *   => { command: "expense", args: ["add", "monthly rent"], raw: '/expense add "monthly rent"' }
 */
export function parseCommand(rawInput: string): ParsedCommand | null {
  const trimmed = rawInput.trim();
  
  // Handle empty input or input that doesn't start with "/"
  if (!trimmed || !trimmed.startsWith('/')) {
    return null;
  }

  // Remove the prefixing "/"
  const inputWithoutSlash = trimmed.slice(1);

  // Regex to split by spaces, but keep text inside quotes together
  // Matches either text inside quotes OR non-space characters
  const argRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  
  const matches = [...inputWithoutSlash.matchAll(argRegex)];

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
