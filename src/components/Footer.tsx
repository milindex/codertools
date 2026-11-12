import { AppConfig } from '@/utils/AppConfig';

export const Footer = () => (
  <footer className="border-t border-gray-300 py-8 text-center text-sm">
    © {new Date().getFullYear()} {AppConfig.siteName}
  </footer>
);
