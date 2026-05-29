# AI Career Coach Dashboard 🎯

A robust full-stack AI-Powered Career Platform designed to translate user criteria into highly structured career learning roadmaps. Integrates deep relational database modeling, clean RESTful endpoints, and robust validation monitoring.

## Features ✨
- **Responsive User Interface**: High-fidelity frontend built in Next.js & React to ensure elegant navigation.
- **RESTful Backend Services**: Endpoints that parse target profiles, orchestrate LLM generations, and output clean JSON payloads.
- **Prisma Relational Mapping**: Highly indexed MySQL database schema capturing user history, custom roadmaps, and debug log archives.
- **Security & Integrity**: Integrates SSL session validations, token protection basics, and secure database transactions.
- **Defect Logging & Auditing**: Automatic logging of exception states to database archives for instant troubleshooting and query analytics.

## Database Setup (MySQL / Prisma) 🛠️

Ensure a valid MySQL or PostgreSQL database instance is running and set your local environments in a `.env` file:
```env
DATABASE_URL="mysql://username:password@localhost:3306/career_coach"
```

1. Initialize database schemas:
```bash
npx prisma migrate dev --name init
```

2. Spin up client mapping:
```bash
npx prisma generate
```

## Running the Web Service 🚀
Start the local server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application interface.
