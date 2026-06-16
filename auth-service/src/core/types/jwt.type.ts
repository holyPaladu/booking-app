export type JWT = {
  sign: (payload: Record<string, string | number>) => Promise<string>
}