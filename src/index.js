const traverse = schema => middleware => ctx => (value) => {
  function makeNext (keys, schemas) {
    return (input) => {
      let fallback = null
      return Promise.all(keys.map((key) => {
        const sch = schemas[key] || fallback
        fallback = sch
        return traverse(sch)(middleware)(ctx)(input[key])
      })).then((values) => {
        const output = Array.isArray(schemas) ? [] : {}
        values.forEach((v, i) => (output[keys[i]] = v))
        return output
      })
    }
  }

  const { contents } = schema
  let next
  if (Array.isArray(contents)) {
    next = makeNext(value.map((v, i) => i), contents)
  } else if (typeof contents === 'object') {
    next = makeNext(Object.keys(contents), contents)
  } else {
    next = v => v
  }

  return middleware(schema)(ctx)(next)(value)
}

const compose = middlewares => schema => ctx => next => middlewares
    .map((m, i, a) => a[a.length - i - 1]) // reverse
    .reduce((nextHandler, mid) => mid(schema)(ctx)(nextHandler), next)


exports.default = traverse
exports.traverse = traverse
exports.compose = compose
