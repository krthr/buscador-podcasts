export function parsePage(page: number | undefined | null | string | boolean) {
  if (
    typeof page === 'undefined' ||
    page === null ||
    Number.isNaN(page) ||
    typeof page === 'boolean'
  ) {
    return 1
  }

  let parsed: number = 1
  if (typeof page === 'string') {
    parsed = Number.parseInt(page)
  } else if (typeof page === 'number') {
    parsed = Number(page)
  }

  if (Number.isNaN(parsed) || parsed < 1) {
    parsed = 1
  }

  return parsed
}
