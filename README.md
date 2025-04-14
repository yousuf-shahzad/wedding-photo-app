# Wedding Photo Sharing App

A web application for wedding guests to upload photos and for the bride and groom to view them in a private gallery.

## Features

- Guest photo upload page with file validation
- Private password-protected gallery
- QR code generation for easy access
- Mobile-friendly interface
- Local file storage

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm run dev
```

3. Access the application:
- Guest upload page: http://localhost:3000/upload
- Private gallery: http://localhost:3000/gallery (password: wedding2025)

### QR Code

The QR code linking to the upload page is generated automatically and saved as `qr-code.png` in the server directory.

## Security

- The gallery is protected with a password (wedding2025)
- File uploads are restricted to JPEG/PNG files under 10MB
- HTTPS is used for secure communication

## Project Structure

```
wedding-photo-app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/                    # Node.js backend
│   ├── uploads/               # Folder for uploaded photos
│   ├── index.js
│   ├── package.json
│   └── qr-code.png           # Generated QR code
└── README.md
``` 