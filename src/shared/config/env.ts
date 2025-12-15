export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "PM-OS",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
