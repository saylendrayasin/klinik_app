import "./globals.css";
import { Toaster } from "react-hot-toast"; // <== tambahkan ini

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-center" reverseOrder={false} />{" "}
      </body>
    </html>
  );
}
