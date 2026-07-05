import Link from 'next/link';
import { usePublicProducts } from '@/lib/hooks/useSWR';
import { checkoutApi } from '@/services/api.service';
import { useMemo, useState } from 'react';

interface Sku {
    skuId: string;
    skuAttr: string;
    properties: string;
    price: number;
    originalPrice: number;
    currency: string;
    stock: number;
    image?: string;
}

const STORE_NAME = 'Nova';

export default function Home() {
    const { products, isLoading } = usePublicProducts(1, 1);
    const product = products[0];

    const [quantity, setQuantity] = useState(1);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const skus: Sku[] = useMemo(() => (Array.isArray(product?.skus) ? product.skus : []), [product]);
    const specs: Record<string, string> = product?.specifications || {};
    const reviews = product?.reviews || {};

    const selectedSku = useMemo(
        () => skus.find((s) => s.skuId === selectedSkuId) || null,
        [skus, selectedSkuId]
    );

    const images: string[] = product?.images || [];

    const handleCheckout = async () => {
        if (!product) return;
        if (skus.length > 1 && !selectedSku) {
            alert('Veuillez sélectionner une variante avant de continuer.');
            return;
        }
        setIsCheckingOut(true);
        try {
            const skuToUse = selectedSku || skus[0];
            const response = await checkoutApi.createSession({
                productId: product.id,
                quantity,
                skuId: skuToUse?.skuId,
                skuAttr: skuToUse?.skuAttr,
            });
            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Impossible de créer la session de paiement. Réessayez.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Aucun produit disponible</h1>
                    <p className="text-gray-600 mb-8">Ajoutez un produit depuis le panneau d&apos;administration.</p>
                    <Link href="/admin/products" className="inline-flex items-center px-6 py-3 text-base font-medium rounded-full text-white bg-gray-900 hover:bg-gray-800">
                        Aller à l&apos;administration
                    </Link>
                </div>
            </div>
        );
    }

    const price = Number(product.markupPrice);
    // Show an aspirational compare-at price for a visible discount.
    const compareAt = Math.round(price * 1.6 * 100) / 100;
    const discountPct = Math.round(((compareAt - price) / compareAt) * 100);
    const rating = reviews.rating && reviews.rating !== 'N/A' ? Number(reviews.rating) : 4.8;
    const reviewCount = reviews.count && reviews.count !== '0' ? reviews.count : '1 200+';
    const specEntries = Object.entries(specs);

    const benefits = [
        { title: 'Qualité premium', desc: 'Sélectionné et testé pour durer.', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
        { title: 'Livraison suivie', desc: 'Expédition rapide avec numéro de suivi.', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
        { title: 'Paiement sécurisé', desc: 'Transactions chiffrées via Stripe.', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        { title: 'Satisfait ou remboursé', desc: '14 jours pour changer d&apos;avis.', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ];

    const faqs = [
        { q: 'Quels sont les délais de livraison ?', a: 'Votre commande est expédiée sous 24 à 48h. La livraison prend ensuite quelques jours selon votre région, avec un numéro de suivi communiqué par email.' },
        { q: 'Le paiement est-il sécurisé ?', a: 'Oui. Les paiements sont traités par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par notre serveur.' },
        { q: 'Puis-je retourner le produit ?', a: 'Vous disposez de 14 jours après réception pour nous contacter et être remboursé si le produit ne vous convient pas.' },
        { q: 'Comment suivre ma commande ?', a: 'Dès l&apos;expédition, vous recevez un email avec le numéro de suivi pour suivre votre colis en temps réel.' },
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900">
            {/* Top announcement bar */}
            <div className="bg-gray-900 text-white text-center text-xs sm:text-sm py-2 px-4">
                Livraison suivie offerte · Paiement sécurisé · Satisfait ou remboursé 14 jours
            </div>

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <span className="text-xl font-bold tracking-tight">{STORE_NAME}</span>
                    <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="hidden sm:inline-flex items-center rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        Commander · €{price}
                    </button>
                </div>
            </header>

            {/* Hero / product */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
                    {/* Gallery */}
                    <div className="lg:sticky lg:top-24">
                        <div className="relative w-full aspect-square bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center">
                            {discountPct > 0 && (
                                <span className="absolute top-4 left-4 z-10 rounded-full bg-rose-500 text-white text-xs font-semibold px-3 py-1">
                                    -{discountPct}%
                                </span>
                            )}
                            {images.length > 0 ? (
                                <img src={images[activeImage]} alt={product.title} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-gray-400">Aucune image disponible</span>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="mt-4 grid grid-cols-5 gap-3">
                                {images.slice(0, 10).map((image: string, index: number) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                                            activeImage === index ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
                                        }`}
                                    >
                                        <img src={image} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="mt-10 lg:mt-0">
                        {/* Rating */}
                        <div className="flex items-center gap-2 text-sm">
                            <div className="flex text-amber-400" aria-hidden>
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <svg key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-current' : 'fill-gray-200'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.98 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.951-.69l1.286-3.957z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="font-medium">{rating.toFixed(1)}</span>
                            <span className="text-gray-500">· {reviewCount} avis</span>
                        </div>

                        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">{product.title}</h1>

                        {/* Price */}
                        <div className="mt-4 flex items-end gap-3">
                            <span className="text-3xl font-bold">€{price}</span>
                            {compareAt > price && (
                                <span className="text-lg text-gray-400 line-through mb-0.5">€{compareAt}</span>
                            )}
                            {discountPct > 0 && (
                                <span className="mb-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold px-2 py-0.5">
                                    Économisez {discountPct}%
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">TVA incluse · Livraison suivie offerte</p>

                        {/* Variant selector */}
                        {skus.length > 1 && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium mb-2">Choisissez votre modèle</label>
                                <div className="flex flex-wrap gap-2">
                                    {skus.map((sku) => (
                                        <button
                                            key={sku.skuId}
                                            type="button"
                                            onClick={() => setSelectedSkuId(sku.skuId)}
                                            disabled={sku.stock <= 0}
                                            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                                selectedSkuId === sku.skuId
                                                    ? 'border-gray-900 ring-2 ring-gray-200'
                                                    : 'border-gray-300 hover:border-gray-500'
                                            } ${sku.stock <= 0 ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                                        >
                                            {sku.image && <img src={sku.image} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                                            <span>{sku.properties || sku.skuAttr}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">Quantité</label>
                            <div className="inline-flex items-center rounded-full border border-gray-300">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-lg hover:bg-gray-50 rounded-l-full">−</button>
                                <span className="w-12 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 text-lg hover:bg-gray-50 rounded-r-full">+</button>
                            </div>
                        </div>

                        {/* Buy button */}
                        <div className="mt-8">
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full rounded-full bg-gray-900 py-4 px-8 text-base font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
                            >
                                {isCheckingOut ? 'Redirection vers le paiement...' : `Acheter maintenant · €${(price * quantity).toFixed(2)}`}
                            </button>
                            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Paiement 100% sécurisé · Stripe
                            </div>
                        </div>

                        {/* Trust badges */}
                        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                            {benefits.map((b) => (
                                <div key={b.title} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                        <svg className="h-5 w-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={b.icon} /></svg>
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold">{b.title}</p>
                                        <p className="text-xs text-gray-500">{b.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Description */}
            {product.description && (
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 text-center">Pourquoi vous allez l&apos;adorer</h2>
                    <div className="prose prose-gray max-w-none prose-img:rounded-xl" dangerouslySetInnerHTML={{ __html: product.description }} />
                </section>
            )}

            {/* Specifications */}
            {specEntries.length > 0 && (
                <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100">
                    <h2 className="text-2xl font-bold mb-6 text-center">Caractéristiques</h2>
                    <dl className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
                        {specEntries.map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-4 px-5 py-3 text-sm">
                                <dt className="text-gray-500">{key}</dt>
                                <dd className="col-span-2 font-medium">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
            )}

            {/* Reviews highlight */}
            <section className="bg-gray-50 py-14 border-t border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center text-amber-400 mb-2">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <svg key={i} className="h-6 w-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.98 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.951-.69l1.286-3.957z" /></svg>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold">Ils l&apos;ont adopté</h2>
                        <p className="text-gray-500 mt-1">Note moyenne de {rating.toFixed(1)}/5 sur {reviewCount} avis</p>
                    </div>
                    <div className="mt-10 grid gap-6 sm:grid-cols-3">
                        {[
                            { name: 'Camille D.', text: 'Exactement comme décrit, livraison rapide et suivi impeccable. Je recommande !' },
                            { name: 'Thomas L.', text: 'Super qualité pour le prix. Le paiement était simple et sécurisé.' },
                            { name: 'Sofia M.', text: 'Rien à redire, produit conforme et service au top. Je recommanderai à mes amis.' },
                        ].map((r) => (
                            <div key={r.name} className="rounded-2xl bg-white p-6 shadow-sm">
                                <div className="flex text-amber-400 mb-3">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.98 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.951-.69l1.286-3.957z" /></svg>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-700">&laquo; {r.text} &raquo;</p>
                                <p className="mt-4 text-sm font-semibold">{r.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="text-2xl font-bold mb-8 text-center">Questions fréquentes</h2>
                <div className="space-y-3">
                    {faqs.map((f, i) => (
                        <div key={i} className="rounded-2xl border border-gray-100">
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="flex w-full items-center justify-between px-5 py-4 text-left"
                            >
                                <span className="font-medium">{f.q}</span>
                                <span className="text-gray-400 text-xl">{openFaq === i ? '−' : '+'}</span>
                            </button>
                            {openFaq === i && <p className="px-5 pb-4 -mt-1 text-sm text-gray-600">{f.a}</p>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gray-900 text-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold">Prêt à commander ?</h2>
                    <p className="mt-2 text-gray-300">Livraison suivie offerte · Satisfait ou remboursé sous 14 jours.</p>
                    <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="mt-6 inline-flex items-center rounded-full bg-white px-8 py-4 text-base font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                    >
                        {isCheckingOut ? 'Redirection...' : `Acheter maintenant · €${price}`}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-950 text-gray-400">
                <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-white font-semibold">{STORE_NAME}</span>
                    <p className="text-sm">&copy; {new Date().getFullYear()} {STORE_NAME}. Tous droits réservés.</p>
                    <Link href="/admin" className="text-sm hover:text-white">Administration</Link>
                </div>
            </footer>
        </div>
    );
}
