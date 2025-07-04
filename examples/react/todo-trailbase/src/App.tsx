import { createCollection, useLiveQuery } from "@tanstack/react-db"

import { useState } from "react"
import { initClient } from "trailbase"
import { trailBaseCollectionOptions } from "./lib/trailbase.ts"
import type { FormEvent } from "react"

import "./App.css"

const client = initClient(`http://localhost:4000`)

type Data = {
  id: number | null
  updated: number | null
  data: string
}

const dataCollection = createCollection(
  trailBaseCollectionOptions<Data>({
    client,
    recordApi: `data`,
    getKey: (item) => item.id ?? -1,
  })
)

function App() {
  const [input, setInput] = useState(``)

  const { data } = useLiveQuery((q) =>
    q
      .from({ dataCollection })
      .orderBy(`@updated`)
      .select(`@id`, `@updated`, `@data`)
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault() // Don't reload the page.

    const form = e.target
    const formData = new FormData(form as HTMLFormElement)

    const formJson = Object.fromEntries(formData.entries())
    const text = formJson.text as string

    if (text) {
      dataCollection.insert({
        id: null,
        updated: null,
        data: formJson.text as string,
      })
    }
  }

  return (
    <>
      <h1>Local First</h1>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>updated</th>
              <th>data</th>
            </tr>
          </thead>

          <tbody>
            {data.map((d, idx) => (
              <tr key={`row-${idx}`}>
                <td>{d.id}</td>
                <td>{d.updated}</td>
                <td>{d.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form method="post" onSubmit={handleSubmit}>
        <p className="read-the-docs">
          <input
            name="text"
            type="text"
            onInput={(e) => setInput(e.currentTarget.value)}
          />

          <button type="submit" disabled={input === ``}>
            submit
          </button>
        </p>
      </form>
    </>
  )
}

export default App
