import { traverse, compose } from '../'

const { strictEqual: is, deepEqual: deep } = assert

describe('traverse', function () {
  it('is a function', function () {
    is(typeof traverse, 'function')
  })
  it('to get a empty object', function () {
    const schema = {
      contents: {
        age: { },
        name: { contents: { first: { }, last: { } } },
        phones: { contents: [{ }] },
      },
    }

    const middleware = () => () => next => async value => await next(value)

    return traverse(schema)(middleware)()().then((val) => {
      deep(
        val,
        {
          age: undefined,
          name: { first: undefined, last: undefined },
          phones: [],
        }
      )
    })
  })
  it('to fill some value', function () {
    const schema = {
      contents: {
        age: { autofill: 10 },
        name: { contents: { first: { autofill: 'Charles' }, last: { } } },
        phones: { contents: [{ }] },
      },
    }

    const middleware = ({ autofill }) => () => next => async (value) => {
      const children = await next(value)

      if (autofill && !children) return await autofill

      return children
    }

    return traverse(schema)(middleware)()().then((val) => {
      deep(
        val,
        {
          age: 10,
          name: { first: 'Charles', last: undefined },
          phones: [],
        }
      )
    })
  })

  it('receive context, resolve revised value', function () {
    const value = { name: 'Charles', age: 33 }
    const schema = {
      contents: {
        name: { type: 'String' },
        age: {
          type: 'Number',
        },
      },
    }
    const middleware = () => () => next => async val => await next(val)

    return traverse(schema)(middleware)()(value).then((val) => {
      deep(val, { name: 'Charles', age: 33 })
    })
  })
  it('compose', function () {
    const value = { name: 'Charles', age: 33 }
    const schema = {
      type: 'Object',
      contents: {
        name: { type: 'String' },
        age: {
          type: 'Number',
          autofill: 10,
        },
      },
    }

    const makeEmpty = ({ type }) => () => next => async () => {
      let init
      if (type === 'Object') {
        init = { }
      } else {
        init = ''
      }

      return await next(init)
    }
    const makeAutofill = ({ autofill }) => () => next => async (val) => {
      if (!autofill) return await next(val)

      await next(val)
      return autofill
    }

    const middleware = compose([makeEmpty, makeAutofill])

    return traverse(schema)(middleware)()(value).then((val) => {
      deep(val, { name: '', age: 10 })
    })
  })
  it('validate', function () {
    const value = { name: 'Charles', age: 33 }
    const schema = {
      type: 'Object',
      validator: () => 'root error',
      contents: {
        name: {
          type: 'Object',
          contents: {
            firstname: {
              type: 'String',
              validator: () => 'name error',
            },
          },
        },
        age: {
          type: 'Number',
          validator: () => 'age error',
        },
      },
    }
    const validation = ({ validator, type }) => () => next => async (val) => {
      if (!validator) return await next(val)

      const result = validator(val)
      const childrenResult = await next(val)

      if (result && type === 'Object') {
        return {
          __self: result,
          ...childrenResult,
        }
      }
      return result
    }

    return traverse(schema)(validation)()(value).then((val) => {
      deep(val, {
        __self: 'root error',
        name: {
          firstname: 'name error',
        },
        age: 'age error',
      })
    })
  })
  it('can revise value after traversing children', function () {
    const value = { name: 'Charles', age: 33 }
    const schema = {
      type: 'Object',
      hook: async (val, next) => {
        const v = await next(val)
        return { ...v, age: v.age + 5 }
      },
      contents: {
        name: { type: 'String' },
        age: {
          type: 'Number',
          hook: val => val - 20,
        },
      },
    }

    const takeHook = ({ hook }) => () => next => async (val) => {
      if (hook) return await hook(val, next)
      return await next(val)
    }

    return traverse(schema)(takeHook)()(value).then((val) => {
      deep(val, { name: 'Charles', age: 18 })
    })
  })
})
