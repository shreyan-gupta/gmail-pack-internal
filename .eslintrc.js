module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    mocha: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['ban', 'filenames', 'local', '@typescript-eslint'],
  rules: {
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': ['error', {default: 'array-simple', readonly: 'array-simple'}],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: 'Avoid using the `Object` type. Did you mean `object`?',
          Function: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
          Boolean: 'Avoid using the `Boolean` type. Did you mean `boolean`?',
          Number: 'Avoid using the `Number` type. Did you mean `number`?',
          String: 'Avoid using the `String` type. Did you mean `string`?',
          Symbol: 'Avoid using the `Symbol` type. Did you mean `symbol`?',
        },
      },
    ],
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'no-public',
        overrides: {
          constructors: 'off',
        },
      },
    ],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow',
      },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/naming-convention': [
      // TODO: re-enable once violations are fixed or we figure out how to correctly configure naming-conventions.
      'off',
      {
        "selector": "default",
        "format": ["camelCase"]
      },

      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "parameter",
        "format": ["camelCase"],
        "leadingUnderscore": "allow"
      },

      {
        "selector": "memberLike",
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      },

      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': ['error', {ignoreVoid: true}],
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-namespace': ['error', {allowDeclarations: true}],
    // TODO: re-enable once violations are fixed and we have dev consensus.
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-parameter-properties': 'error',
    '@typescript-eslint/no-unused-expressions': ['error', {allowShortCircuit: true, allowTernary: true}],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {vars: 'all', ignoreRestSiblings: true, varsIgnorePattern: '_.*', argsIgnorePattern: '_.*'},
    ],
    '@typescript-eslint/no-use-before-declare': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/triple-slash-reference': ['error', {path: 'never', types: 'never', lib: 'never'}],
    '@typescript-eslint/type-annotation-spacing': 'off',
    '@typescript-eslint/unified-signatures': 'error',

    // eslint-plugin-ban
    'ban/ban': [
      'error',
      {
        name: ['_', 'assign'],
        message: "Use the native 'Object#assign' method instead of the Lodash library.",
      },
      {
        name: ['_', 'chain'],
        message: 'Use native ES6 constructs or individual Lodash methods',
      },
      {
        name: ['_', 'includes'],
        message: "Use the native 'Array#includes' method instead of the Lodash library.",
      },
      {
        name: ['Promise', 'race'],
        message: 'Avoid Promise.race since it can lead to memory leaks.',
      },
      {
        name: ['*', 'spread'],
        message: 'Use Promise#then(([...]) => ...) instead of Promise#spread for correctly-inferred types.',
      },
      {
        name: ['ReactDOM', 'findDOMNode'],
        message: 'Use domProps.findDOMNode() instead of React.findDOMNode()',
      },
      {
        name: ['window', 'setImmediate'],
        message: 'Use TimersService.getInstance().setImmediate() instead of window.setImmediate()',
      },
      {
        name: ['window', 'clearImmediate'],
        message: 'Use TimersService.getInstance().clearImmediate() instead of window.clearImmediate()',
      },
      {
        name: ['React', 'cloneElement'],
        message:
          'Use cloneElement() or cloneElementWithDomProps() from @kr-modules/browser/helpers instead of React.cloneElement()',
      },
      {
        name: ['DOM', 'a'],
        message: 'DOM.a can be unsafe with user input hrefs. Use react-components/link instead.',
      },
      {
        name: ['it', 'only'],
        message: 'Do not commit Mocha it.only',
      },
      {
        name: ['describe', 'only'],
        message: 'Do not commit Mocha describe.only',
      },
    ],

    // eslint-plugin-filenames
    'filenames/match-regex': ['error', '^[a-z][a-z0-9_.]+$', true],

    // ESLint Built-ins
    // TODO(Chris): Consider turning this one back on
    'arrow-body-style': 'off',
    'arrow-parens': ['error', 'as-needed'],
    camelcase: ['error', {ignoreDestructuring: true, allow: ['drive_v?', 'auth_session', 'utm_.*']}],
    complexity: 'off',
    'constructor-super': 'error',
    curly: 'error',
    'dot-notation': 'error',
    'eol-last': 'off',
    eqeqeq: ['error', 'always', {null: 'ignore'}],
    'guard-for-in': 'error',
    'jsx-quotes': ['error', 'prefer-double'],
    'linebreak-style': 'off',
    'max-len': [
      'error',
      {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignorePattern: '^import ',
      },
    ],
    'max-classes-per-file': 'off',
    'member-ordering': 'off',
    'new-parens': 'off',
    'newline-per-chained-call': 'off',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-cond-assign': 'error',
    'no-console': 'error',
    'no-debugger': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'off',
    'no-empty-functions': 'off',
    'no-eval': 'error',
    'no-extra-semi': 'off',
    'no-fallthrough': 'off',
    'no-invalid-this': 'off',
    'no-irregular-whitespace': 'off',
    'no-multiple-empty-lines': 'off',
    'no-new-wrappers': 'error',
    'no-restricted-imports': [
      'error',
      {
        paths: ['eventemitter3', 'events', 'moment', 'moment-timezone', 'moment-weekday-calc'],
        patterns: ['**/postload/private/**/*', 'lodash', '!@kr-modules/js-core/lodash'],
      },
    ],
    'no-return-await': 'error',
    'no-throw-literal': 'off',
    'no-undef-init': 'error',
    'no-unsafe-finally': 'error',
    'no-unused-labels': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'prefer-arrow-callback': 'error',
    // TODO(Chris): Re-enable this rule later, too many errors at the moment as part of the eslint migration.
    'prefer-const': 'off',
    'quote-props': ['error', 'as-needed'],
    quotes: ['error', 'single', {avoidEscape: true, allowTemplateLiterals: true}],
    radix: 'error',
    'space-before-function-paren': 'off',
    'spaced-comment': ['error', 'always', {exceptions: ['*']}],
    'use-isnan': 'error',
    'valid-typeof': 'off',

    // ESLint coda rules
    'local/test-helper-required': 'error',
    'local/coda-import-style': 'error',
    'local/coda-import-ordering': 'error',
    'local/disallow-cross-scope-imports': 'error',
    'local/disallow-express-next-shorthand': 'error',
    'local/less-files-valid': 'error',
    'local/no-date-construct': 'error',
    'local/no-shadow': 'error',
  }
}
