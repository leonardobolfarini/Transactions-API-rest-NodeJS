import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be list all created transactions', async () => {
    const createdTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)

    const cookies = createdTransactionResponse.get('Set-Cookie')!

    const listAllTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listAllTransactions.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 6500,
      }),
    ])
  })

  it('should be list a specifically transaction', async () => {
    const createdTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)

    const cookies = createdTransactionResponse.get('Set-Cookie')!

    const listAllTransactions = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listAllTransactions.body.transactions[0].id

    const listTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransaction.body).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 6500,
      }),
    )
  })

  it('should be able to get summary', async () => {
    const creditTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 6500,
        type: 'credit',
      })
      .expect(201)

    const cookies = creditTransaction.get('Set-Cookie')!

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2500,
        type: 'debit',
      })
      .expect(201)

    const getTransactionsSummary = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionsSummary.body.summary).toEqual({
      amount: 4000,
    })
  })
})
