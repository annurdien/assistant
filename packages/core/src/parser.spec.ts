import { parseCommand } from './parser';

describe('Command Parser', () => {
  it('should parse basic commands correctly', () => {
    const result = parseCommand('/expense add 100 coffee');
    expect(result).toEqual({
      command: 'expense',
      args: ['add', '100', 'coffee'],
      raw: '/expense add 100 coffee',
    });
  });

  it('should handle extra spaces between arguments', () => {
    const result = parseCommand('   /status   system    ');
    expect(result).toEqual({
      command: 'status',
      args: ['system'],
      raw: '/status   system', // trimmed
    });
  });

  it('should handle multi-word arguments in quotes', () => {
    const result = parseCommand('/expense add 3000 "monthly rent"');
    expect(result).toEqual({
      command: 'expense',
      args: ['add', '3000', 'monthly rent'],
      raw: '/expense add 3000 "monthly rent"',
    });
  });

  it('should handle single quotes for multi-word arguments', () => {
    const result = parseCommand("/expense add 15.50 'lunch with client'");
    expect(result).toEqual({
      command: 'expense',
      args: ['add', '15.50', 'lunch with client'],
      raw: "/expense add 15.50 'lunch with client'",
    });
  });

  it('should handle command without arguments', () => {
    const result = parseCommand('/help');
    expect(result).toEqual({
      command: 'help',
      args: [],
      raw: '/help',
    });
  });

  it('should return null for empty input or non-commands', () => {
    expect(parseCommand('')).toBeNull();
    expect(parseCommand('    ')).toBeNull();
    expect(parseCommand('hello there')).toBeNull(); // Missing '/'
  });
});
