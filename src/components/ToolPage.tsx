import type { ReactNode } from 'react';

type ToolPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const ToolPage = ({ title, description, children }: ToolPageProps) => (
  <main className="mx-auto max-w-screen-lg px-4 py-12">
    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
    <p className="mt-3 max-w-2xl text-lg">{description}</p>
    {children}
  </main>
);
