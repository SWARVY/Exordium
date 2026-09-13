/** Quote PostgREST values so punctuation cannot become filter syntax. */
export function textSearchFilter(columns: string[], query: string): string {
  const value = `%${query.trim()}%`.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
  return columns.map((column) => `${column}.ilike."${value}"`).join(",")
}
