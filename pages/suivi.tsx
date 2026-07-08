import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { publicOrderApi } from '@/services/api.service';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'En attente', color: 'bg-gray-100 text-gray-700' },
    PAID: { label: 'Payée', color: 'bg-yellow-100 text-yellow-800' },
    ORDERING: { label: 'En préparation', color: 'bg-blue-100 text-blue-800' },
    ORDERED: { label: 'Confirmée chez le fournisseur', color: 'bg-indigo-100 text-indigo-800' },
    SHIPPED: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800' },
    DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
    FAILED: { label: 'En cours de traitement', color: 'bg-gray-100 text-gray-700' },
    REFUNDED: { label: 'Remboursée', color: 'bg-orange-100 text-orange-800' },
};

interface OrderStatus {
    orderId: string;
    status: string;
    productTitle: string;
    quantity: number;
    totalPaid: string;
    trackingNumber: string | null;
    createdAt: string;
}

export default function TrackOrder() {
    const router = useRouter();
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [result, setResult] = useState<OrderStatus | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const lookup = async (o: string, e: string) => {
        setError('');
        setResult(null);
        setIsLoading(true);
        try {
            const res = await publicOrderApi.getStatus(o, e);
            if (res.success) setResult(res.data);
            else setError(res.error || 'Commande introuvable.');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Commande introuvable. Vérifiez le numéro et l\'email.');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-lookup when arriving from an email link (?order=...&email=...)
    useEffect(() => {
        if (!router.isReady) return;
        const o = (router.query.order as string) || '';
        const e = (router.query.email as string) || '';
        if (o) setOrderId(o);
        if (e) setEmail(e);
        if (o && e) lookup(o, e);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.isReady]);

    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        lookup(orderId, email);
    };

    const statusInfo = result ? STATUS_LABELS[result.status] || { label: result.status, color: 'bg-gray-100 text-gray-700' } : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold tracking-tight">Nuvo</Link>
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Boutique</Link>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Suivre ma commande</h1>
                <p className="text-sm text-gray-600 mb-8">
                    Entrez votre numéro de commande et l&apos;email utilisé lors de l&apos;achat.
                </p>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de commande</label>
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            required
                            placeholder="Ex : cmr9s4gr..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="vous@email.com"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-gray-900 focus:border-gray-900"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-full bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isLoading ? 'Recherche...' : 'Suivre ma commande'}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</div>
                )}

                {result && statusInfo && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-500">Commande {result.orderId.slice(0, 10)}…</span>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Produit</dt>
                                <dd className="text-gray-900 text-right max-w-[60%]">{result.productTitle} × {result.quantity}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Total payé</dt>
                                <dd className="text-gray-900">{result.totalPaid} €</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Date</dt>
                                <dd className="text-gray-900">{new Date(result.createdAt).toLocaleDateString('fr-FR')}</dd>
                            </div>
                            {result.trackingNumber && (
                                <div className="flex justify-between">
                                    <dt className="text-gray-500">Numéro de suivi</dt>
                                    <dd className="text-gray-900 font-medium">{result.trackingNumber}</dd>
                                </div>
                            )}
                        </dl>
                        {result.trackingNumber && (
                            <a
                                href={`https://global.cainiao.com/detail.htm?mailNoList=${encodeURIComponent(result.trackingNumber)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
                            >
                                Suivre le colis →
                            </a>
                        )}
                        {!result.trackingNumber && (
                            <p className="mt-4 text-xs text-gray-500">
                                Le numéro de suivi apparaîtra ici dès l&apos;expédition de votre colis.
                            </p>
                        )}
                    </div>
                )}

                <p className="mt-8 text-center text-sm text-gray-500">
                    Une question ? <a href="mailto:contact@shopnuvo.fr" className="text-gray-900 underline">Contactez-nous</a>
                </p>
            </main>
        </div>
    );
}
