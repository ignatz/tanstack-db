import { beforeEach, describe, it, vi } from "vitest"
import { createCollection } from "@tanstack/db"
import { trailBaseCollectionOptions } from "../src/trailbase"
import type { TrailBaseCollectionUtils } from "../src/trailbase"
import type {
  Collection,
} from "@tanstack/db"
import { initClient, type Client } from "trailbase"

type Data = {
  id: number | null;
  updated: number | null;
  data: string;
};

describe(`TrailBase Integration`, () => {
  let collection: Collection<Data, string | number, TrailBaseCollectionUtils>

  beforeEach(() => {
    vi.clearAllMocks()

    const client: Client = initClient("http://localhost:4000");
    // Reset mock subscriber
    // mockSubscribe.mockImplementation((callback) => {
    //   subscriber = callback
    //   return () => { }
    // })

    // Create collection with Electric configuration
    const config = {
      recordApi: client.records<Data>("data"),
      getKey: (item: Data): number | number => item.id ?? Math.round(Math.random() * 100000),
    }

    // Get the options with utilities
    const options = trailBaseCollectionOptions(config)

    // Create collection with Electric configuration using the new utility exposure pattern
    collection = createCollection<
      Data,
      string | number,
      TrailBaseCollectionUtils
    >(options)
  })

  it(`TBD`, () => {
    const _ = collection;
  });
})
