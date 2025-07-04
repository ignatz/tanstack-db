/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createCollection } from "@tanstack/db"
import { trailBaseCollectionOptions } from "../src/trailbase"
import type { TrailBaseCollectionUtils } from "../src/trailbase"
import type { Collection } from "@tanstack/db"
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
  list = vi.fn(function (opts?: {
    pagination?: Pagination
    order?: Array<string>
    filters?: Array<FilterOrComposite>
    count?: boolean
    expand?: Array<string>
  }): Promise<ListResponse<T>> {
    return Promise.resolve({
      records: [],
    })
  })

  read = vi.fn(function (
    id: string | number,
    opt?: {
      expand?: Array<string>
    }
  ): Promise<T> {
    return Promise.reject(`read`)
  })

  create = vi.fn(function (record: T): Promise<string | number> {
    return Promise.reject(`create`)
  })
  createBulk = vi.fn(function (
    records: Array<T>
  ): Promise<Array<string | number>> {
    return Promise.reject(`createBulk`)
  })

  update = vi.fn(function (
    id: string | number,
    record: Partial<T>
  ): Promise<void> {
    return Promise.reject(`update`)
  })
  delete = vi.fn(function (id: string | number): Promise<void> {
    return Promise.reject(`delete`)
  })
  subscribe = vi.fn(function (
    id: string | number
  ): Promise<ReadableStream<Event>> {
    return Promise.resolve(
      new ReadableStream({
        start(controller) {
          controller.close()
        },
        // pull(controller) {},
        // cancel() {},
      })
    )
  })
}

function setUp(
  recordApi: MockRecordApi<Data>
): Collection<Data, string | number, TrailBaseCollectionUtils> {
  // Get the options with utilities
  const options = trailBaseCollectionOptions({
    recordApi,
    getKey: (item: Data): number | number =>
      item.id ?? Math.round(Math.random() * 100000),
  })

  return createCollection<Data, string | number, TrailBaseCollectionUtils>(
    options
  )
}

// NOTE: ideally we'd just use Promise.withResolver.
class Completer<T> {
  public readonly promise: Promise<T>
  public complete: (value: PromiseLike<T> | T) => void
  private reject: (reason?: any) => void

  public constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.complete = resolve
      this.reject = reject
    })
  }
}

describe(`TrailBase Integration`, () => {
  let collection: Collection<Data, string | number, TrailBaseCollectionUtils>

  // beforeEach(() => {
  //   vi.clearAllMocks()
  //
  //   const recordApi = new MockRecordApi<Data>()
  //
  //   // Create collection with Electric configuration
  //   const config = {
  //     recordApi,
  //     getKey: (item: Data): number | number =>
  //       item.id ?? Math.round(Math.random() * 100000),
  //   }
  //
  //   // Get the options with utilities
  //   const options = trailBaseCollectionOptions(config)
  //
  //   // Create collection with Electric configuration using the new utility exposure pattern
  //   collection = createCollection<
  //     Data,
  //     string | number,
  //     TrailBaseCollectionUtils
  //   >(options)
  // })

  it(`initial fetch`, async () => {
    const recordApi = new MockRecordApi<Data>()

    const records: Data[] = [
      {
        id: 0,
        updated: 0,
        data: "first",
      },
    ]

    const resolver = new Completer<boolean>()
    recordApi.list.mockImplementation(async (opts) => {
      setInterval(() => resolver.complete(true), 100)
      return {
        total_count: records.length,
        records,
      }
    })

    const collection = setUp(recordApi)

    await resolver.promise

    expect(collection.state).toEqual(new Map(records.map((d) => [d.id, d])))
  })
})
