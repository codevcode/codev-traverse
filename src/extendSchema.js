module.exports = function extendSchema (createProps) {
  const middleware = schema => () => next => () => {
    const children = next(schema.contents)

    const result = Object.assign({ }, schema, createProps(schema))

    if (!children) return result
    return Object.assign(result, { contents: children })
  }

  return middleware
}
