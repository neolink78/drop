import { ReactNode } from 'react';
import Link from 'next/link';
import Head from 'next/head';

interface LegalLayoutProps {
    title: string;
    children: ReactNode;
}

export default function LegalLayout({ title, children }: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>{title} · Nuvo</title>
            </Head>
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold tracking-tight">Nuvo</Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Boutique</Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
                <div className="prose prose-gray max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">
                    {children}
                </div>
                <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                    <Link href="/mentions-legales" className="hover:text-gray-900">Mentions légales</Link>
                    <Link href="/cgv" className="hover:text-gray-900">CGV</Link>
                    <Link href="/confidentialite" className="hover:text-gray-900">Confidentialité</Link>
                    <Link href="/retours" className="hover:text-gray-900">Retours & remboursements</Link>
                    <Link href="/contact" className="hover:text-gray-900">Contact</Link>
                    <Link href="/suivi" className="hover:text-gray-900">Suivre ma commande</Link>
                </div>
            </main>
        </div>
    );
}
