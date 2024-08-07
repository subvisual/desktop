'use strict'

const { formatTokenValue, validateExternalURL } = require('../utils')
const assert = require('assert').strict

describe('formatTokenValue', function () {
  it('should correctly round a typical value', function () {
    const input = 0.004567687
    const expectedOutput = 0.004568
    const result = formatTokenValue(input)
    assert.equal(result, expectedOutput)
  })

  it('should reduce a big number to 6 decimal places',
    function () {
      const input = 123.45678923456
      const expectedOutput = 123.456789
      const result = formatTokenValue(input)
      assert.equal(result, expectedOutput)
    })

  it('should reduce a very small number to 6 decimal places',
    function () {
      const input = 0.000123456789
      const expectedOutput = 0.000123
      const result = formatTokenValue(input)
      assert.equal(result, expectedOutput)
    })

  it('should round up', function () {
    const input = 0.0001289
    const expectedOutput = 0.000129
    const result = formatTokenValue(input)
    assert.equal(result, expectedOutput)
  })

  it('should map 0 to 0', function () {
    const input = 0
    const expectedOutput = 0
    const result = formatTokenValue(input)
    assert.equal(result, expectedOutput)
  })

  it('should leave a big integer alone', function () {
    const input = 123456789
    const expectedOutput = 123456789
    const result = formatTokenValue(input)
    assert.equal(result, expectedOutput)
  })

  it('should show 6 decimal places for numbers smaller than 0.000001',
    function () {
      const input = 0.000000000123456789
      const expectedOutput = 0.000000
      const result = formatTokenValue(input)
      assert.equal(result, expectedOutput)
    })

  it('should not add zeroes to a number that is has no trailing zeroes',
    function () {
      const input = 123.4
      const expectedOutput = 123.4
      const result = formatTokenValue(input)
      assert.equal(result, expectedOutput)
    })
})

describe('validateExternalURL', function () {
  it('should throw on empty string', function () {
    assert.throws(() => {
      validateExternalURL('')
    })
  })

  it('should throw on URL not in allowlist', function () {
    assert.throws(() => {
      validateExternalURL('https://google.com')
    })
  })

  it('should not throw for allowed URL', function () {
    assert.doesNotThrow(() => {
      validateExternalURL('https://filspark.com/')
    })
  })

  it('should not throw when url matches allowed pattern', function () {
    assert.doesNotThrow(() => {
      validateExternalURL('https://beryx.zondax.ch/v1/search/fil/mainnet/address/123')
    })
  })

  it('should throw when url doesnt match allowed pattern', function () {
    assert.throws(() => {
      validateExternalURL('https://bery.zonda.ch/v1/search/fil/mainnet/address/123')
    })
  })
})
