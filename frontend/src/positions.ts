// Human names for the nine spots of a 3×3 grid, used for local boards and their cells.
export const POSITIONS = [
  'top left',
  'top middle',
  'top right',
  'middle left',
  'centre',
  'middle right',
  'bottom left',
  'bottom middle',
  'bottom right',
] as const;

export function boardName(index: number) {
  return `${POSITIONS[index]} board`;
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
