# fostplus-ical-webserver

A Node.js web application that lets users look up their Belgian home address and generate a **personalised iCal subscription URL** for their Fostplus waste-collection schedule (next 12 months).

Built with [Express](https://expressjs.com/) and the [`@leventhan/fostplus-api-wrapper`](https://github.com/LeventHAN/fostplus-api-wrapper) library.

---

## Features

- 🏠 Multi-step address wizard (postal code → street → house number → options)
- 🌍 Language selection for fraction names: Dutch (default), English, French
- 😀 Optional emoji mode (🌿 📄 ♻️ 🗑️ …) instead of text labels
- 📆 Optional day-grouping: combine all fractions of the same day into one calendar event
- 🔗 Generates a stable, shareable iCal URL for your address
- 📅 Returns all upcoming waste-collection events for the next 12 months
- 📋 One-click copy button and direct browser link
- Works with any calendar app that supports iCal subscriptions (Google Calendar, Apple Calendar, Outlook, …)

---

## Prerequisites

- Node.js 18+
- A Fostplus API consumer key (`x-consumer` header value).  
  This value is publicly used by the Fostplus recycling website. You can find it by inspecting the network requests on [fostplus.be](https://www.fostplus.be/) or from the [`fostplus-api-wrapper`](https://github.com/LeventHAN/fostplus-api-wrapper) project tests.

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/CatLabInteractive/fostplus-ical-webserver.git
cd fostplus-ical-webserver

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and set FOSTPLUS_CONSUMER_KEY=<your key>

# 4. Build and start (production)
npm run build
npm start

# – or run in development mode (auto-reload)
npm run dev
```

The server will start on <http://localhost:3000> (or the `PORT` from your `.env`).

---

## Environment variables

| Variable                | Required | Default | Description                              |
|-------------------------|----------|---------|------------------------------------------|
| `FOSTPLUS_CONSUMER_KEY` | ✅ yes   | —       | The `x-consumer` key for the Fostplus API |
| `PORT`                  | no       | `3000`  | TCP port the server listens on            |

---

## API endpoints

| Method | Path                                   | Description                                         |
|--------|----------------------------------------|-----------------------------------------------------|
| `GET`  | `/`                                    | Address wizard UI                                   |
| `GET`  | `/api/zipcodes?q=<term>`               | Search for postal codes matching `term`             |
| `GET`  | `/api/streets?q=<term>&zipcodeId=<id>` | Search for streets matching `term` in the given zip |
| `GET`  | `/ical/:zipcodeId/:streetId/:houseNumber` | Download / subscribe to the iCal feed            |

### iCal query parameters

| Parameter | Values              | Default | Description                                                    |
|-----------|---------------------|---------|----------------------------------------------------------------|
| `lang`    | `nl`, `en`, `fr`    | `nl`    | Language for fraction names (Dutch, English, French)           |
| `emoji`   | `true`, `false`     | `false` | Replace text labels with emojis (🌿 📄 ♻️ 🗑️ …)              |
| `group`   | `true`, `false`     | `false` | Group all fractions of the same day into a single event        |

### iCal URL examples

```
# Dutch (default), individual events
http://localhost:3000/ical/zipcode-id-here/street-id-here/42

# English, emoji labels, grouped by day
http://localhost:3000/ical/zipcode-id-here/street-id-here/42?lang=en&emoji=true&group=true

# French, text labels
http://localhost:3000/ical/zipcode-id-here/street-id-here/42?lang=fr
```

Subscribe to this URL in your calendar app to receive automatic updates.

---

## Project structure

```
.
├── public/
│   └── index.html       # Single-page address wizard
├── src/
│   ├── app.ts           # Express app entry point
│   └── routes/
│       ├── api.ts       # /api/zipcodes and /api/streets
│       └── ical.ts      # /ical/:zipcodeId/:streetId/:houseNumber
├── .env.example
├── package.json
└── tsconfig.json
```
