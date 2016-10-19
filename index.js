const traverse = schema => middleware => ctx => async (value) => {
  function makeNext (keys, schemas) {
    return async (input) => {
      const output = Array.isArray(schemas) ? [] : {}

      // let fallback = null
      // for (const key of keys) {
      //   const sch = schemas[key] || fallback
      //   fallback = sch
      //   output[key] = await traverse(sch)(middleware)(ctx)(input[key])
      // }

      let fallback = null
      await Promise.all(keys.map(async (key) => {
        const sch = schemas[key] || fallback
        fallback = sch
        output[key] = await traverse(sch)(middleware)(ctx)(input[key])
      }))

      return output
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
    .reduce(
      (chainedNext, middleware) => middleware(schema)(ctx)(chainedNext), next
    )


export default traverse
export { compose }
