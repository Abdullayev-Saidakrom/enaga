import './globals.css';

export const metadata = {
  title: 'Enaga — ishonchli yordamchi topish',
  description: 'Farzandingiz uchun ishonchli enaga toping',
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>
        <div className="max-w-md mx-auto min-h-screen bg-bg">{children}</div>
      </body>
    </html>
  );
}
