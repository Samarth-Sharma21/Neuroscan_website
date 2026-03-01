import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Neuroscan — MRI-Based Dementia Screening",
  description:
    "Neuroscan is a research tool that uses a deep learning model to classify stages of dementia from brain MRI scans and visualize regions of interest through attention maps.",
  keywords: [
    "dementia screening",
    "MRI classification",
    "attention heatmap",
    "brain imaging",
    "deep learning",
    "Neuroscan",
  ],
  openGraph: {
    title: "Neuroscan — MRI-Based Dementia Screening",
    description:
      "A research-driven tool for classifying dementia stages from brain MRI scans with attention-based visualization.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
