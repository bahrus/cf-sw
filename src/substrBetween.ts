export function substrBetween(str: string, start: string, end: string): string {
  const start_pos = str.indexOf(start);
  if(start_pos === -1) return '';
  const iPos = str.indexOf(end, start_pos + start.length);
  return iPos === -1 ? str.substring(start_pos + start.length) :  str.substring(start_pos + start.length, iPos);
}