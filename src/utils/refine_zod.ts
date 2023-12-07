export default function refineZod(elements: any[], names: string[]): boolean {
  return names.every((el: string) => elements.some((x) => x.name === el));
}
