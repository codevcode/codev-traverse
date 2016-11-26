/* eslint-disable no-param-reassign */

const isPromise = v => (
  v && typeof v === 'object' && typeof v.then === 'function'
)

const buildOutput = (values, schemas, keys) => {
  const output = Array.isArray(schemas) ? [] : {}
  values.forEach((v, i) => (output[keys[i]] = v))
  return output
}

const makeNext = (schemas, ctx, goNext) => getKeys => (input) => {
  const keys = getKeys(input)

  let fallback = null
  const { thisPath } = ctx
  const results = keys.map((key) => {
    const schema = schemas[key] || fallback
    fallback = schema

    ctx.thisPath = thisPath.concat(key)
    ctx.thisKey = key
    return goNext(schema, ctx, input && input[key])
  })

  if (results.some(isPromise)) {
    return Promise.all(results)
      .then(values => buildOutput(values, schemas, keys))
  }

  return buildOutput(results, schemas, keys)
}

const traverse = schema => middleware => ctx => (value) => {
  // traverse next with schema and value. wrap middleware in advance
  const goNext = (
    mid => (sch, c, val) => traverse(sch)(mid)(c)(val)
  )(middleware)

  const { contents } = schema

  const traverseNextKeys = makeNext(contents, ctx, goNext)

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

exports.traverse = schema => middleware => (ctx = { }) => {
  // init ctx
  ctx.thisPath = []
  ctx.thisKey = ''
  return value => traverse(schema)(middleware)(ctx)(value)
}


const compose = middlewares => schema => ctx => next => middlewares
    .map((m, i, a) => a[a.length - i - 1]) // reverse
    .reduce((nextHandler, mid) => mid(schema)(ctx)(nextHandler), next)


exports.compose = compose
