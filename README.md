# FitX - Ultimate Fitness & Nutrition Tracker 🏋️‍♂️🍎

FitX is a comprehensive, modern fitness and nutrition tracking application built with **React Native** and **Expo**. It empowers users to track workouts, monitor nutrition, and visualize progress with a sleek, dark-mode-optimized interface.

## 🚀 Features

### 💪 Workout Tracking
- **Exercise Library**: Access 18+ pre-seeded exercises with search and filtering by category (Strength, Cardio, etc.).
- **Custom Workouts**: Create and save personalized workout templates.
- **Session Logging**: Track sets, reps, and weights in real-time.
- **Quick Log**: Instantly log single exercises without creating a full routine.

### 🥗 Nutrition Management
- **Macro Tracking**: Monitor daily calories, protein, carbs, and fat.
- **Food Logging**: Easily add food entries with automatic macro calculation.
- **Daily Goals**: Visual progress bars for daily nutritional targets.

### 🎨 User Experience
- **Dark Mode Support**: Fully optimized dark theme for comfortable night usage.
- **Onboarding Flow**: Personalized setup to calculate BMR and fitness goals.
- **OTA Updates**: Seamless over-the-air updates via EAS Update (no APK re-downloads needed!).

## 🛠️ Tech Stack

- **Framework**: React Native (Expo SDK 52)
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite) for robust local storage
- **Navigation**: Expo Router (File-based routing)
- **Styling**: Custom theme system (Light/Dark mode support)
- **Deployment**: EAS Build & EAS Update

## 📱 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your mobile device

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/subash3650/FitX.git
    cd FitX
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the app:**
    ```bash
    npx expo start
    ```

4.  **Scan & Run:**
    - Scan the QR code with the **Expo Go** app (Android/iOS).

## 🔄 Over-The-Air (OTA) Updates

This app is configured with **EAS Update**.
- **Developers**: Push updates instantly using `eas update --branch preview`.
- **Users**: Receive updates automatically upon app restart.

## 📂 Project Structure

```
app/
├── (tabs)/          # Main tab screens (Home, Workouts, Progress, etc.)
├── onboarding/      # User onboarding flow screens
├── exercise/        # Exercise details and logging
├── workout/         # Active workout session management
services/
├── database.ts      # SQLite database schema and helper functions
├── exercises-data.ts # Initial seed data for exercises
constants/
├── theme.ts         # Design system and color palettes
components/          # Reusable UI components (ThemedText, Cards, etc.)
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 👨‍💻 Developer

**Subash**
- Portfolio: [https://subash-portfolio-six.vercel.app/](https://subash-portfolio-six.vercel.app/)
