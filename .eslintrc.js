// [eslint rule docs](http://eslint.org/docs/rules/)

module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  extends: 'airbnb',
  settings: {
    'import/parser': 'babel-eslint',
  },
  plugins: ['babel'],
  rules: {
    semi: ['error', 'never'],
    'space-before-function-paren': ['error', 'always'],
    'func-names': 'off',
    'no-console': 'off',
    'global-require': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-shadow': ['error', { allow: ['t'] }],
    'babel/func-params-comma-dangle': ['error', 'never'],
  },
}
