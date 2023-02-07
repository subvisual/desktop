'use strict'

const keytar = require('keytar')
const { generateMnemonic } = require('@zondax/filecoin-signing-tools')
const { default: Filecoin, HDWalletProvider } = require('@glif/filecoin-wallet-provider')
const { CoinType } = require('@glif/filecoin-address')
const { strict: assert } = require('node:assert')
const { Message } = require('@glif/filecoin-message')
const { FilecoinNumber, BigNumber } = require('@glif/filecoin-number')
const { request, gql } = require('graphql-request')
const pMap = require('p-map')

/** @typedef {import('./typings').WalletSeed} WalletSeed */
/** @typedef {import('./typings').GQLStateReplay} GQLStateReplay */
/** @typedef {import('./typings').GQLTipset} GQLTipset */
/** @typedef {import('./typings').GQLMessage} GQLMessage */
/** @typedef {import('./typings').FILTransaction} FILTransaction */
/** @typedef {import('./typings').FILTransactionProcessing} FILTransactionProcessing */
/** @typedef {import('./typings').FILTransactionLoading} FILTransactionLoading */

const DISABLE_KEYTAR = process.env.DISABLE_KEYTAR === 'true'

// eslint-disable-next-line @typescript-eslint/no-empty-function
async function noop () {}

class WalletBackend {
  constructor ({
    disableKeytar = DISABLE_KEYTAR,
    onTransactionSucceeded = noop,
    onTransactionUpdate = noop
  } = {}) {
    /** @type {Filecoin | null} */
    this.provider = null
    /** @type {string | null} */
    this.address = null
    this.url = 'https://graph.glif.link/query'
    /** @type {(FILTransaction|FILTransactionProcessing)[]} */
    this.transactions = []
    this.disableKeytar = disableKeytar
    this.onTransactionSucceeded = onTransactionSucceeded
    this.onTransactionUpdate = onTransactionUpdate
  }

  async setup () {
    const { seed, isNew } = await this.getSeedPhrase()
    this.provider = new Filecoin(new HDWalletProvider(seed), {
      apiAddress: 'https://api.node.glif.io/rpc/v0'
    })
    this.address = await this.getAddress()
    return { seedIsNew: isNew }
  }

  /**
   * @returns {Promise<WalletSeed>}
   */
  async getSeedPhrase () {
    const service = 'filecoin-station-wallet'
    let seed
    if (!this.disableKeytar) {
      seed = await keytar.getPassword(service, 'seed')
      if (seed) {
        return { seed, isNew: false }
      }
    }

    seed = generateMnemonic()
    if (!this.disableKeytar) {
      await keytar.setPassword(service, 'seed', seed)
    }
    return { seed, isNew: true }
  }

  async getAddress () {
    assert(this.provider)
    const [address] = await this.provider.wallet.getAccounts(
      0,
      1,
      CoinType.MAIN
    )
    return address
  }

  async fetchBalance () {
    assert(this.provider)
    assert(this.address)
    return await this.provider.getBalance(this.address)
  }

  /**
   * @param {string} from
   * @param {string} to
   * @param {FilecoinNumber} amount
   * @returns Promise<FilecoinNumber>
   */
  async getGasLimit (from, to, amount) {
    assert(this.provider)
    const message = new Message({
      to,
      from,
      nonce: 0,
      value: amount.toAttoFil(),
      method: 0,
      params: '',
      gasPremium: 0,
      gasFeeCap: 0,
      gasLimit: 0
    })
    const messageWithGas = await this.provider.gasEstimateMessageGas(
      message.toLotusType()
    )
    const feeCapStr = messageWithGas.gasFeeCap.toFixed(0, BigNumber.ROUND_CEIL)
    const feeCap = new FilecoinNumber(feeCapStr, 'attofil')
    const gas = feeCap.times(messageWithGas.gasLimit)
    return gas
  }

  /**
   * @param {string} from
   * @param {string} to
   * @param {FilecoinNumber} amount
   * @returns {Promise<string>}
   */
  async transferFunds (from, to, amount) {
    assert(this.provider)

    /** @type {FILTransactionProcessing} */
    const transaction = {
      timestamp: new Date().getTime(),
      status: 'processing',
      outgoing: true,
      amount: amount.toString(),
      address: to
    }
    this.transactions.push(transaction)
    this.onTransactionUpdate()

    try {
      const gasLimit = await this.getGasLimit(from, to, amount)
      const message = new Message({
        to,
        from,
        nonce: await this.provider.getNonce(from),
        value: amount.minus(gasLimit).toAttoFil(),
        method: 0,
        params: ''
      })
      const messageWithGas = await this.provider.gasEstimateMessageGas(
        message.toLotusType()
      )
      const lotusMessage = messageWithGas.toLotusType()
      const msgValid = await this.provider.simulateMessage(lotusMessage)
      assert(msgValid, 'Message is invalid')
      const signedMessage = await this.provider.wallet.sign(from, lotusMessage)
      const { '/': cid } = await this.provider.sendMessage(signedMessage)

      transaction.hash = cid
      this.onTransactionUpdate()

      return cid
    } catch (err) {
      transaction.status = 'failed'
      this.onTransactionUpdate()

      throw err
    }
  }

  /**
   * @param {string} cid
   * @returns {Promise<GQLStateReplay>}
   */
  async getStateReplay (cid) {
    const query = gql`
      query StateReplay($cid: String!) {
        stateReplay(cid: $cid) {
          receipt {
            return
            exitCode
            gasUsed
          }
          executionTrace {
            executionTrace
          }
        }
      }
    `
    const variables = { cid }
    /** @type {{stateReplay: GQLStateReplay}} */
    const { stateReplay } = await request(this.url, query, variables)
    return stateReplay
  }

  /**
   * @param {number} height
   * @returns Promise<GQLTipset>
   */
  async getTipset (height) {
    const query = gql`
      query Tipset($height: Uint64!) {
        tipset(height: $height) {
          minTimestamp
        }
      }
    `
    const variables = { height }
    const { tipset } = await request(this.url, query, variables)
    return tipset
  }

  /**
   * @param {string} address
   * @returns Promise<GQLMessage[]>
   */
  async getMessages (address) {
    const query = gql`
      query Messages($address: String!, $limit: Int!, $offset: Int!) {
        messages(address: $address, limit: $limit, offset: $offset) {
          cid
          to {
            robust
          }
          from {
            robust
          }
          nonce
          height
          method
          params
          value
        }
      }
    `
    const variables = {
      address,
      limit: 100,
      offset: 0
    }
    /** @type {{messages: GQLMessage[] | null}} */
    const { messages } = await request(this.url, query, variables)
    return messages || []
  }

  /**
   * @returns {Promise<void>}
   */
  async fetchAllTransactions () {
    assert(this.address)

    // Load messages
    const messages = await this.getMessages(this.address)

    // Convert messages to transactions (loading)
    /** @type {FILTransactionLoading[]} */
    const transactionsLoading = messages.map(message => ({
      height: message.height,
      hash: message.cid,
      outgoing: message.from.robust === this.address,
      amount: new FilecoinNumber(message.value, 'attofil').toFil(),
      address: message.from.robust === this.address
        ? message.to.robust
        : message.from.robust
    }))

    // Fill in already loaded data
    const transactions = transactionsLoading.map(transactionLoading =>
      this.transactions.find(tx => tx.hash === transactionLoading.hash) ||
      transactionLoading
    )

    // Fetch `.timestamp`
    await pMap(transactions, async transaction => {
      if (!transaction.timestamp && transaction.height) {
        try {
          transaction.timestamp =
            (await this.getTipset(transaction.height)).minTimestamp * 1000
        } catch (err) {
          transaction.error = 'Failed fetching tipset'
        }
      }
    }, { concurrency: 1 })

    // Fetch `.status`
    await pMap(transactions, async transaction => {
      if (
        transaction.hash &&
        (!transaction.status || transaction.status === 'processing')
      ) {
        const { hash } = transaction
        transaction.status = 'processing'
        try {
          const stateReplay = await this.getStateReplay(hash)
          console.log(stateReplay)
          transaction.status = stateReplay.receipt.exitCode === 0
            ? 'succeeded'
            : 'failed'
          if (transaction.status === 'succeeded') {
            try {
              await this.onTransactionSucceeded()
            } catch {}
          }
        } catch (err) {
          transaction.error = 'Failed fetching state replay'
        }
      }
    }, { concurrency: 1 })

    // Add locally known transactions not yet returned by the API
    for (const transaction of this.transactions) {
      if (!transactions.find(tx => tx.hash === transaction.hash)) {
        transactions.push(transaction)
        break
      }
    }

    // Update state
    this.transactions =
      /** @type {(FILTransaction|FILTransactionProcessing)[]} */ (transactions)
    this.onTransactionUpdate()
  }
}

module.exports = {
  WalletBackend
}