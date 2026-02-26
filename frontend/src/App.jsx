import { useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function App() {
  const [file, setFile] = useState(null)
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestMessage, setIngestMessage] = useState('')

  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [chatError, setChatError] = useState('')

  const canIngest = useMemo(() => Boolean(file) && !ingestLoading, [file, ingestLoading])
  const canAsk = useMemo(() => question.trim().length > 0 && !chatLoading, [question, chatLoading])

  async function handleIngest(event) {
    event.preventDefault()

    if (!file) {
      setIngestMessage('Please choose a PDF file first.')
      return
    }

    try {
      setIngestLoading(true)
      setIngestMessage('Uploading and indexing PDF...')

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE_URL}/ingest`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.detail || 'Failed to ingest PDF')
      }

      const data = await response.json()
      setIngestMessage(`Indexed ${data.chunks_indexed} chunks from ${data.filename}.`)
    } catch (error) {
      setIngestMessage(error.message)
    } finally {
      setIngestLoading(false)
    }
  }

  async function handleAsk(event) {
    event.preventDefault()

    try {
      setChatLoading(true)
      setChatError('')
      setAnswer('')
      setSources([])

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.detail || 'Failed to get chat response')
      }

      const data = await response.json()
      setAnswer(data.answer)
      setSources(data.sources || [])
    } catch (error) {
      setChatError(error.message)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <main className="page">
      <h1>PDF QA Chatbot</h1>
      <p className="subtitle">Upload your PDF, then ask questions from the extracted content.</p>

      <section className="card">
        <h2>1) Upload PDF</h2>
        <form onSubmit={handleIngest}>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <button type="submit" disabled={!canIngest}>
            {ingestLoading ? 'Indexing...' : 'Upload & Index'}
          </button>
        </form>
        {ingestMessage ? <p className="status">{ingestMessage}</p> : null}
      </section>

      <section className="card">
        <h2>2) Ask Question</h2>
        <form onSubmit={handleAsk}>
          <textarea
            rows={4}
            placeholder="Ask something about your PDF..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <button type="submit" disabled={!canAsk}>
            {chatLoading ? 'Thinking...' : 'Ask'}
          </button>
        </form>

        {chatError ? <p className="error">{chatError}</p> : null}

        {answer ? (
          <div className="answerBlock">
            <h3>Answer</h3>
            <p>{answer}</p>

            {sources.length > 0 ? (
              <>
                <h3>Sources</h3>
                <ul>
                  {sources.map((source, index) => (
                    <li key={`${index}-${source.score}`}>
                      <strong>Score:</strong> {source.score?.toFixed?.(4) ?? source.score}
                      <br />
                      {source.text}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  )
}
