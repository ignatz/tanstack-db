import { beforeEach, describe, expect, it, vi } from "vitest"
import { createCollection } from "@tanstack/db"
import { trailBaseCollectionOptions } from "../src/trailbase"
import type {
  Event,
  FilterOrComposite,
  ListResponse,
  Pagination,
  RecordApi,
} from "trailbase"

type Data = {
  id: number | null
  updated: number | null
  data: string
}

class MockRecordApi<T> implements RecordApi<T> {
  list = vi.fn(
    async (_opts?: {
      pagination?: Pagination
      order?: Array<string>
      filters?: Array<FilterOrComposite>
      count?: boolean
      expand?: Array<string>
    }): Promise<ListResponse<T>> => {
      return { records: [] }
    }
  )

  read = vi.fn(
    async (
      _id: string | number,
      _opt?: {
        expand?: Array<string>
      }
    ): Promise<T> => {
      throw `read`
    }
  )

  create = vi.fn(async (_record: T): Promise<string | number> => {
    throw `create`
  })
  createBulk = vi.fn(
    async (_records: Array<T>): Promise<Array<string | number>> => {
      throw `createBulk`
    }
  )

  update = vi.fn(
    async (_id: string | number, _record: Partial<T>): Promise<void> => {
      throw `update`
    }
  )
  delete = vi.fn(async (_id: string | number): Promise<void> => {
    throw `delete`
  })
  subscribe = vi.fn(
    async (_id: string | number): Promise<ReadableStream<Event>> => {
      return new ReadableStream({
        start: (controller: ReadableStreamDefaultController<Event>) => {
          controller.close()
        },
      })
    }
  )
}

function setUp(recordApi: MockRecordApi<Data>) {
  // Get the options with utilities
  const options = trailBaseCollectionOptions({
    recordApi,
    getKey: (item: Data): number | number =>
      item.id ?? Math.round(Math.random() * 100000),
  })

  return options
}

describe(`TrailBase Integration`, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it(`initial fetch and simple update`, async () => {
    const records: Array<Data> = [
      {
        id: 0,
        updated: 0,
        data: `first`,
      },
    ]

    // Prepare mock API.
    const recordApi = new MockRecordApi<Data>()
    const listResolver = Promise.withResolvers<boolean>()
    recordApi.list.mockImplementation(async (_opts) => {
      setInterval(() => listResolver.resolve(true), 1)
      return {
        total_count: records.length,
        records,
      }
    })

    const injectEventResolver = Promise.withResolvers<Event>()
    const sentEventResolver = Promise.withResolvers<boolean>()
    const injectEvent = async (event: Event) => {
      injectEventResolver.resolve(event)
      await sentEventResolver.promise
    }

    const cancelResolver = Promise.withResolvers<boolean>()
    recordApi.subscribe.mockResolvedValue(
      new ReadableStream({
        start: (controller: ReadableStreamDefaultController<Event>) => {
          injectEventResolver.promise.then((event) => {
            controller.enqueue(event)
            setInterval(() => sentEventResolver.resolve(true), 1)
          })
        },
        cancel: () => cancelResolver.resolve(true),
      })
    )

    const options = setUp(recordApi)
    const collection = createCollection(options)

    // Await initial fetch and assert state.
    await listResolver.promise
    expect(collection.state).toEqual(new Map(records.map((d) => [d.id, d])))

    // Inject an update event and assert state.
    const updatedRecord: Data = {
      ...records[0]!,
      updated: 1,
    }

    await injectEvent({ Update: updatedRecord })

    expect(collection.state).toEqual(
      new Map([updatedRecord].map((d) => [d.id, d]))
    )

    // Await cancellation.
    options.utils.cancel()
    await cancelResolver.promise
  })
})
