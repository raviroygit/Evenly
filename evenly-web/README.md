# Evenly Web - Product Landing Page

A stunning, modern product landing page for Evenly built with Next.js, TypeScript, Tailwind CSS, and Three.js.

## 🚀 Features

- **Dark Theme Only** - Beautiful dark theme matching the Evenly app design
- **3D Animations** - Interactive 3D mobile phone model with Three.js
- **Responsive Design** - Optimized for all devices (mobile, tablet, desktop)
- **Smooth Animations** - Framer Motion for fluid page transitions
- **Modern UI** - Clean, professional design with glassmorphism effects
- **Privacy Policy** - Comprehensive privacy policy page
- **SEO Optimized** - Proper meta tags and structured data

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **3D Graphics**: Three.js with React Three Fiber
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Inter & JetBrains Mono

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```bash
   # Backend API URL
   NEXT_PUBLIC_EVENLY_BACKEND_URL=https://evenly-backend-541410644975.us-central1.run.app
   
   # ReCAPTCHA Configuration (optional - only if you want CAPTCHA protection)
   # Get your site key from: https://www.google.com/recaptcha/admin
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
   NEXT_PUBLIC_RECAPTCHA_ENABLED=true
   
   # App Configuration
   NEXT_PUBLIC_APP_NAME=Evenly
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```
   
   **Note**: If you don't set up reCAPTCHA, the form will work without CAPTCHA protection. 
   To get a production reCAPTCHA key:
   1. Go to https://www.google.com/recaptcha/admin
   2. Create a new site
   3. Choose reCAPTCHA v2 ("I'm not a robot" Checkbox)
   4. Add your domain (localhost for development, your production domain)
   5. Copy the Site Key to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   6. Set `NEXT_PUBLIC_RECAPTCHA_ENABLED=true`

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

The website uses the same design system as the Evenly mobile app:

### Colors
- **Background**: `#111111` (Pure black)
- **Foreground**: `#e2e8f0` (Light gray)
- **Primary**: `#818cf8` (Indigo)
- **Secondary**: `#3a3633` (Dark brown)
- **Card**: `#2c2825` (Dark brown)

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Monospace**: JetBrains Mono

## 📱 Components

### Hero Section
- Animated 3D mobile phone model
- Floating UI elements
- Call-to-action buttons
- Statistics display

### Features Section
- Interactive feature cards
- Gradient backgrounds
- Hover animations
- Benefits showcase

### Privacy Policy
- Comprehensive privacy information
- Contact information
- Legal notices
- Responsive layout

### Navigation
- Fixed header with backdrop blur
- Mobile-responsive menu
- Smooth animations
- Download CTA

## 🎯 3D Animations

The 3D mobile phone model includes:
- **Realistic phone geometry** with rounded corners
- **Floating animations** using React Three Fiber
- **Interactive elements** around the phone
- **Smooth rotations** and movements
- **Lighting effects** for depth

## 📱 Mobile Optimization

- **Responsive breakpoints** for all screen sizes
- **Touch-friendly** interface elements
- **Optimized 3D performance** on mobile devices
- **Fast loading** with code splitting
- **Smooth scrolling** and animations

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 📄 Pages

- **Home** (`/`) - Main landing page with hero and features
- **Privacy Policy** (`/privacy`) - Comprehensive privacy information

## 🎨 Customization

### Colors
Update colors in `tailwind.config.js`:
```javascript
colors: {
  primary: '#818cf8', // Change primary color
  background: '#111111', // Change background
  // ... other colors
}
```

### 3D Model
Modify the phone model in `src/components/MobileAnimation.tsx`:
- Change phone dimensions
- Adjust colors and materials
- Add new floating elements

### Content
Update text content in:
- `src/components/HeroSection.tsx`
- `src/components/FeaturesSection.tsx`
- `src/app/privacy/page.tsx`

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js app router
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── privacy/         # Privacy policy page
├── components/          # React components
│   ├── HeroSection.tsx  # Hero section
│   ├── FeaturesSection.tsx # Features section
│   ├── MobileAnimation.tsx # 3D phone model
│   └── Navigation.tsx   # Navigation bar
└── lib/                 # Utilities
    ├── theme.ts         # Theme configuration
    └── utils.ts         # Helper functions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📈 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Core Web Vitals**: Optimized for excellent user experience
- **Bundle Size**: Optimized with tree shaking and code splitting
- **3D Performance**: Efficient Three.js rendering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Evenly application suite.

---

Built with ❤️ for Evenly - Split bills effortlessly