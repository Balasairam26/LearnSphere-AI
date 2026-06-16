# LearnSphere AI

Personalized Learning Assistant MVP for uploading study material, asking citation-based document questions, generating summaries, creating quizzes, tracking progress, detecting weak topics, and building exam study plans.

## Run locally

Open `index.html` in a browser. The prototype is dependency-free and stores demo data in `localStorage`.

Use **Try demo account** to start with sample Machine Learning notes, or create a local account.

## Implemented MVP features

- Sign up, login, logout, and user dashboard
- Document upload surface for notes, PDFs, PPTs, DOCs, and text files
- Local document library with topic metadata
- RAG-style chat over indexed text with source citations
- Chapter summary, key points, and exam notes generation
- Quiz generator for MCQs, true/false, and short answers
- Quiz scoring, weak topic detection, study streak, and progress metrics
- Personalized recommendations and 7/14/21-day study plan generation

## Production integration notes

The current MVP runs fully in the browser. For production:

- Replace local authentication with Supabase Auth.
- Upload source files to Supabase Storage.
- Extract text server-side for PDFs/PPTs/DOCs.
- Store document metadata, chunks, quiz results, study events, and weak-topic signals in Supabase tables.
- Generate embeddings for chunks and use vector search for real RAG retrieval.
- Call an AI model from a backend route for grounded answers, summaries, quizzes, and study plans.

See `supabase-schema.sql` for a starter database shape.
