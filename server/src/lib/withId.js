/**
 * Recursively adds `_id: obj.id` to all plain objects in the response tree.
 * This keeps the frontend compatible with the old MongoDB `_id` field convention.
 */
const withId = (obj) => {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj
  if (Array.isArray(obj)) return obj.map(withId)
  if (typeof obj !== 'object') return obj

  const result = { ...obj }
  if (result.id !== undefined && result._id === undefined) {
    result._id = result.id
  }
  for (const key of Object.keys(result)) {
    const val = result[key]
    if (val && typeof val === 'object' && !(val instanceof Date)) {
      result[key] = withId(val)
    }
  }
  return result
}

module.exports = { withId }
