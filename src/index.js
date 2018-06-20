/* eslint-disable no-param-reassign */

const isPromise = v => (
  v && typeof v === 'object' && typeof v.then === 'function'
)

const buildOutput = (values, schemas, keys) => {
  const output = Array.isArray(schemas) ? [] : {}
  values.forEach((v, i) => (output[keys[i]] = v))
  return output
}

const makeNext = (schemas, ctx, path, goNext) => getKeys => (input) => {
  const keys = getKeys(input)

  let fallback = null
  const results = keys.map((key) => {
    const schema = schemas[key] || fallback
    fallback = schema
    return goNext(schema, ctx, input && input[key], [...path, key])
  })

  if (results.some(isPromise)) {
    return Promise.all(results)
      .then(values => buildOutput(values, schemas, keys))
  }

  return buildOutput(results, schemas, keys)
}

const traverse = schema => middleware => ctx => (value, path = []) => {
  // traverse next with schema and value. wrap middleware in advance
  const goNext = (sch, c, val, p) => traverse(sch)(middleware)(c)(val, p)

  const { contents } = schema

  const traverseNextKeys = makeNext(contents, ctx, path, goNext)

  let next
  if (Array.isArray(contents)) {
    next = traverseNextKeys(input => (input || []).map((v, i) => i))
  } else if (typeof contents === 'object') {
    next = traverseNextKeys(() => Object.keys(contents))
  } else {
    next = () => {}
  }

  return middleware(schema)(ctx)(next)(value, path)
}

exports.traverse = traverse

const compose = middlewares => schema => ctx => next => middlewares
    .map((m, i, a) => a[a.length - i - 1]) // reverse
    .reduce((nextHandler, mid) => mid(schema)(ctx)(nextHandler), next)

exports.compose = compose
