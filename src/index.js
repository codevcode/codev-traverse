const makeTraverse = (traverseStrategy) => {
  const traverse = schema => middleware => ctx => (value) => {
    const makeNext = traverseStrategy(traverse, middleware, ctx)

    const { contents } = schema
    let next
    if (Array.isArray(contents)) {
      next = makeNext((value || []).map((v, i) => i), contents)
    } else if (typeof contents === 'object') {
      next = makeNext(Object.keys(contents), contents)
    } else {
      next = v => v
    }

    return middleware(schema)(ctx)(next)(value)
  }

  return traverse
}

function asyncTraverse (traverse, middleware, ctx) {
  return function makeNext (keys, schemas) {
    return (input) => {
      let fallback = null
      return Promise.all(keys.map((key) => {
        const schema = schemas[key] || fallback
        fallback = schema
        return traverse(schema)(middleware)(ctx)(input && input[key])
      })).then((values) => {
        const output = Array.isArray(schemas) ? [] : {}
        values.forEach((v, i) => (output[keys[i]] = v))
        return output
      })
    }
  }
}
function syncTraverse (traverse, middleware, ctx) {
  return function makeNext (keys, schemas) {
    return (input) => {
      let fallback = null
      const output = Array.isArray(schemas) ? [] : {}
      keys.forEach((key) => {
        const schema = schemas[key] || fallback
        fallback = schema
        output[key] = traverse(schema)(middleware)(ctx)(input && input[key])
      })
      return output
    }
  }
}

const traverse = makeTraverse(asyncTraverse)
const traverseSync = makeTraverse(syncTraverse)

const compose = middlewares => schema => ctx => next => middlewares
    .map((m, i, a) => a[a.length - i - 1]) // reverse
    .reduce((nextHandler, mid) => mid(schema)(ctx)(nextHandler), next)


exports.traverse = traverse
exports.traverseSync = traverseSync
exports.compose = compose
