module.exports = {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    /* 禁止布局中的 px（border 1px 除外） */
    'unit-disallowed-list': [['px'], { severity: 'warning' }],
    'color-no-invalid-hex': true,
    'selector-class-pattern': null,
    'scss/dollar-variable-pattern': null,
  },
}
