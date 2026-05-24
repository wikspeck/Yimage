# Yimage

Yimage is an image-sharing platform built around fast uploads, public post pages, and lightweight social discovery.

The goal of the project is to evolve Yimage from a simple uploader into a clean social image platform with persistent posts, accounts, discovery, interaction, and moderation, while keeping the stack simple and Cloudflare-native.

## Main Features

- Public image posts with shareable URLs
- Discovery feed with search, categories, and hashtags
- Account signup, login, and persistent sessions
- Voting, reposting, comments, and nested replies
- Profiles with follow/unfollow and profile customization
- Image storage in R2 and structured app data in D1
- Moderation, reporting, and content-safety foundations

## Tech Stack

- React
- Vite
- Cloudflare Workers
- Cloudflare Pages
- Cloudflare R2
- Cloudflare D1

## Domain

- `yimage.org`

## Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Deploy:

```bash
npm run deploy
```

## Notes

- Images are stored in R2.
- Users, posts, comments, votes, follows, moderation data, and other structured records are stored in D1.
- Worker/API routing and frontend routes are designed to work together on Cloudflare deployment.
