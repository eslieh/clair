# 🌌 Clair — Next‑Gen P2P Video Calling

Clair is a high-performance, peer-to-peer video calling application built for presence and privacy. By leveraging direct P2P connections and a low-latency signaling server, Clair provides crystal-clear communication without the overhead of traditional meeting apps.

![Clair Landing Page](/web/public/images/hero.png)

## ✨ Features

- **Crystal-Clear P2P Video**: Direct WebRTC connections for minimum latency and maximum privacy.
- **Immersive Presence**: Smooth animations and a minimalist UI designed to keep you "in the room."
- **Real-Time Signaling**: Custom Node.js WebSocket server for instant call requests and state management.
- **Push Notifications**: Receive call alerts even when the app is closed via Service Workers and Web Push.
- **Secure by Design**: Integration with Supabase for robust authentication and profile management.
- **Modern Aesthetic**: Built with a "premium-first" design philosophy using Framer Motion and custom CSS systems.

## 🛠 Technology Stack

### Frontend (`/web`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS Modules (Glassmorphism & High-end aesthetics)
- **Database/Auth**: [Supabase](https://supabase.com/)

### Backend/Signaling (`/node-server`)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Signaling**: [WebSockets (`ws`)](https://github.com/websockets/ws)
- **Notifications**: [Web Push](https://github.com/web-push-libs/web-push)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase Project
- VAPID Keys for Push Notifications

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/eslieh/clair.git
   cd clair
   ```

2. **Frontend Setup**:
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   # Fill in your Supabase & Signaling URLs
   npm run dev
   ```

3. **Backend Setup**:
   ```bash
   cd node-server
   npm install
   cp .env.example .env
   # Fill in your VAPID keys and Supabase credentials
   npm run dev
   ```

## 📐 Architecture

Clair uses a decoupled architecture to separate concerns:
- **Signaling Server**: Facilitates the initial "handshake" between clients using WebSockets before the WebRTC P2P stream is established.
- **Web Client**: Handles the media streams, user interface, and persistent state using Supabase.
- **WebRTC**: Once signaled, the video/audio data travels directly between peers, ensuring privacy and speed.

## 📄 License
This project is licensed under the MIT License.
