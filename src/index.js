const isPromise = v => (typeof v === 'object' && typeof v.then === 'function')

const makeNext = (schemas, goNext) => getKeys => (input) => {
  const keys = getKeys(input)

  let fallback = null
  const results = keys.map((key) => {
    const schema = schemas[key] || fallback
    fallback = schema
    return goNext(schema, input && input[key])
  })

  const buildOutput = (values) => {
    const output = Array.isArray(schemas) ? [] : {}
    values.forEach((v, i) => (output[keys[i]] = v))
    return output
  }

  if (results.some(isPromise)) {
    return Promise.all(results).then(buildOutput)
  }
  return buildOutput(results)
}

const traverse = schema => middleware => ctx => (value) => {
  // traverse next with schema and value. wrap middleware and ctx in advance
  const goNext = (
    (mid, c) => (sch, val) => traverse(sch)(mid)(c)(val)
  )(middleware, ctx)

  const { contents } = schema

  const traverseNextKeys = makeNext(contents, goNext)

  let next
  if (Array.isArray(contents)) {
    next = traverseNextKeys(input => (input || []).map((v, i) => i))
  } else if (typeof contents === 'object') {
    next = traverseNextKeys(() => Object.keys(contents))
  } else {
    next = () => {}
  }

  return middleware(schema)(ctx)(next)(value)
}

const compose = middlewares => schema => ctx => next => middlewares
    .map((m, i, a) => a[a.length - i - 1]) // reverse
    .reduce((nextHandler, mid) => mid(schema)(ctx)(nextHandler), next)


exports.traverse = traverse
exports.compose = compose
