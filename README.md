# PraisePoint

A modern web application for managing and sharing worship songs and playlists.

## Features

- Song management with lyrics and chords
- Playlist creation and organization
- Search functionality with language filtering
- User authentication
- Responsive design

## Tech Stack

- SvelteKit
- TypeScript
- PocketBase
- TailwindCSS

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/AtheeshaAnarga/PraisePoint.git
cd PraisePoint
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your PocketBase configuration:
```env
PUBLIC_POCKETBASE_URL=your_pocketbase_url
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
```

## Deployment

The application is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and set the environment variables.

## License

MIT
