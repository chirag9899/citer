# GenAI Research Assistant

A full-stack, production-ready research assistant for semantic search and citation over scientific document chunks, built with Next.js, Pinecone, and Gemini/OpenAI LLMs.

---

## 🚀 Overview
- **Upload**: Drag-and-drop JSON files of pre-chunked journal content.
- **Semantic Search**: Ask questions and retrieve the most relevant document chunks using vector search.
- **Citations**: See accurate, clickable citations for every answer.
- **Filters**: Refine search by year, journal, or attributes.
- **Usage Analytics**: Tracks and visualizes most-cited articles per session.

---

## 🏗️ Architecture
- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: Next.js API routes
- **Vector DB**: Pinecone (cloud-native, production-grade)
- **LLM**: Gemini (for answer synthesis)
- **Embeddings**

---

## ⚙️ Setup & Running Locally
1. **Clone the repo**
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Set environment variables** in `.env.local`:
   ```env
   PINECONE_API_KEY=your-pinecone-api-key
   PINECONE_ENVIRONMENT=us-east-1-aws
   PINECONE_INDEX=your-index-name
   GEMINI_API_KEY=your-gemini-api-key (optional)
   ```
4. **Run the app**
   ```sh
   npm run dev
   ```
5. **Upload your chunks** via the UI (see below for format)

---

## 📦 Chunk Format Example
```json
{
  "id": "mucuna_01_intro",
  "source_doc_id": "extension_brief_mucuna.pdf",
  "chunk_index": 1,
  "section_heading": "Overview & Botanical Description",
  "doi": "TBD_DOI",
  "journal": "TBD_JOURNAL",
  "publish_year": 2023,
  "usage_count": 42,
  "attributes": ["Botanical description", "Morphology"],
  "link": "https://cgspace.cgiar.org/server/api/core/bitstreams/68bfaec0-8d32-4567-9133-7df9ec7f3e23/content",
  "text": "Velvet bean (Mucuna pruriens var. utilis) is a twining annual legume..."
}
```

---

## 🖥️ Usage
- **Upload**: Use the upload form to add new document chunks (JSON array).
- **Ask**: Enter a question and (optionally) filter by year, journal, or attributes.
- **Results**: See answers, citations, and a chart of most-cited articles.

---

## 🔌 API Endpoints
- `POST /api/upload` — Upload chunks (JSON array)
- `POST /api/similarity_search` — Search with filters (query, publish_year, journal, attributes)
- `GET /api/journal/[journal_id]` — Get all chunks for a journal
- `POST /api/llm_answer` — Get LLM answer for a question and context

---

## 🧠 Design Decisions & Trade-offs
- **Pinecone** chosen for serverless, scalable vector search (ChromaDB not deployable on Vercel).
- **Chunk schema** is rich for flexible search and citation.
- **Filters** applied client-side after Pinecone query (due to Pinecone limitations).
- **Usage tracking** updates chunk metadata in Pinecone on every retrieval.

---

## 🧠 Vector DB Choice: Why Pinecone?

I chose **Pinecone** as the vector database for this project for several reasons:

- **Serverless & Scalable**: Pinecone is a fully managed, cloud-native vector database. It scales automatically and requires no infrastructure management, which is ideal for production deployments and rapid prototyping.
- **Vercel/VPS Compatibility**: Unlike some open-source alternatives (e.g., ChromaDB), Pinecone can be used in serverless environments like Vercel, which is important for modern Next.js deployments.
- **Performance**: Pinecone offers fast, approximate nearest neighbor (ANN) search, which is critical for real-time semantic search over large document collections.
- **Production-Ready**: Pinecone handles sharding, replication, and durability, so I don't have to worry about the operational complexity of running my own vector DB.

**Trade-offs:**  
- Pinecone is a managed, paid service (with a free tier), so it may not be ideal for all open-source or hobby projects.
- Some advanced filtering is limited compared to self-hosted solutions, so I apply some filters client-side after retrieval.

---

## 🏗️ Why Next.js and This Stack?

I chose **Next.js** for its hybrid static/server rendering, API route support, and seamless integration with Vercel for deployment. The React/Tailwind frontend enables rapid UI development, while the modular API routes make it easy to extend or swap backend services. This stack is ideal for building modern, production-ready research tools.

---

## 🔄 Swapping Out Pinecone

If I needed to use a different vector DB (e.g., ChromaDB, Qdrant, or a self-hosted solution), I would:
- Refactor the vector search and upsert logic in `PineconeService.ts` to use the new DB's API.
- Update the API routes to call the new service.
- Ensure the chunk schema and search interface remain consistent for the frontend.

This modular approach makes the backend easily swappable for future needs or cost considerations.

---

## ✨ Optional Features Included

- **Upload UI**: Drag-and-drop JSON upload for pre-chunked documents.
- **Semantic Search**: Uses Pinecone for vector search, returning the most relevant chunks for a given query.
- **Citations**: Every answer includes clickable citations, making it easy to trace information back to the source.
- **Filters**: Users can filter results by year, journal, and attributes.
- **Usage Analytics**: Tracks and visualizes the most-cited articles in the current session.
- **Modern UI/UX**: Onboarding, example questions, and a beautiful, responsive interface.
- **LLM Integration**: Uses Gemini/OpenAI to synthesize answers from retrieved chunks.
- **Extensible API**: Modular design for easy extension (e.g., more filters, authentication, new vector DBs).

---

## 📊 `/api/similarity_search` Endpoint

**Accepts:**
```json
{
  "query": "your question here",
  "k": 10,
  "min_score": 0.25,
  "publish_year": "optional",
  "journal": "optional",
  "attributes": ["optional", "array"]
}
```
- `query` (string): The semantic search query.
- `k` (number): The number of top results to return (default: 10).
- `min_score` (number): Minimum similarity score (default: 0.25).
- `publish_year`, `journal`, `attributes`: Optional filters.

**Returns:**
- The top-k most semantically similar document chunks, each with metadata and a similarity score.

---

## 📝 Documentation Summary

- **Why Pinecone?**: Chosen for scalability, serverless compatibility, and production readiness.
- **Why Next.js?**: For hybrid rendering, API routes, and easy deployment.
- **Optional Features**: Upload, semantic search, citations, filters, analytics, modern UI, LLM integration.
- **API**: `/api/similarity_search` supports flexible, production-grade semantic search with filtering.
- **Swappability**: Backend vector DB can be swapped with minimal changes.

---

## 🚀 Lessons Learned & Future Improvements

- **Lesson:** Managed vector DBs like Pinecone are great for rapid prototyping and production, but may have cost or flexibility trade-offs for some use cases.
- **Lesson:** Modular API/service design makes it easy to swap out infrastructure as needs evolve.
- **Future:** Add authentication, more granular filters, and mobile UI polish.
- **Future:** Consider open-source/self-hosted vector DBs for cost-sensitive or private deployments.

---

## 🛠️ Extending This Project
- **Add more filters**: e.g., by section, author, etc.
- **Add authentication**: Protect upload/search APIs.
- **Add tests**: Use Jest or Vitest for API and service logic.
- **Improve UI**: Add dropdowns for filter values, mobile polish, etc.

---

## 📚 License
MIT

---

## ⏱️ NOTE

I built this project in one day due to a busy schedule. My focus was on delivering a working, extensible, and well-documented research assistant MVP. There are many areas for future polish and expansion!
