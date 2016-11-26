import { traverse } from '../'
import extendSchema from '../extendSchema'

const { deepEqual: deep } = assert

describe('extendSchema', function () {
  it('can append new prop in schema', function () {
    const schema = {
      contents: {
        age: { autofill: 10 },
        name: { contents: { first: { autofill: 'Charles' }, last: { } } },
        phones: { contents: [{ }] },
      },
    }

    const addNodeType = ({ contents }) => {
      if (typeof contents === 'object') return { type: 'branch' }
      return { type: 'leaf' }
    }

    deep(
      traverse(schema)(extendSchema(addNodeType))()(),
      {
        type: 'branch',
        contents: {
          age: { type: 'leaf', autofill: 10 },
          name: {
            type: 'branch',
            contents: {
              first: { type: 'leaf', autofill: 'Charles' },
              last: { type: 'leaf' },
            },
          },
          phones: { type: 'branch', contents: [{ type: 'leaf' }] },
        },
      }
    )
  })
})
