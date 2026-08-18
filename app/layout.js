import './styles.css';

export const metadata = {
  title: 'Mağaza',
  description: 'Mobil uyumlu tek sayfa mağaza'
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
