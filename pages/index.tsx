
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

export default function Home() {
    const { products, isLoading } = usePublicProducts(1, 1);
    const product = products[0];

    const [quantity, setQuantity] = useState(1);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);

    const skus: Sku[] = useMemo(() => (Array.isArray(product?.skus) ? product.skus : []), [product]);
    const specs: Record<string, string> = product?.specifications || {};
    const seller = product?.sellerInfo || {};
    const reviews = product?.reviews || {};
    const shipping = product?.shippingInfo?.text || 'Livraison mondiale';

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Aucun produit disponible</h1>
                    <p className="text-gray-600 mb-8">Ajoutez un produit depuis le panneau d&apos;administration.</p>
                    <Link
                        href="/admin/products"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Aller à l&apos;administration
                    </Link>
                </div>
            </div>
        );
    }

    const displayPrice = product.markupPrice;
    const specEntries = Object.entries(specs);

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
                    {/* Image Gallery */}
                    <div className="flex flex-col">
                        <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                            {images.length > 0 ? (
                                <img
                                    src={images[activeImage]}
                                    alt={product.title}
                                    className="w-full h-full object-center object-contain"
                                />
                            ) : (
                                <span className="text-gray-400">Aucune image disponible</span>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-4 grid grid-cols-5 gap-2">
                                {images.slice(0, 10).map((image: string, index: number) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setActiveImage(index)}
                                        className={`aspect-square rounded-md overflow-hidden border-2 ${
                                            activeImage === index ? 'border-indigo-500' : 'border-transparent'
                                        }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.title} ${index + 1}`}
                                            className="h-full w-full object-cover hover:opacity-75"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.title}</h1>

                        {/* Rating */}
                        {(reviews.rating || reviews.count) && (
                            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                                {reviews.rating && reviews.rating !== 'N/A' && (
                                    <span className="flex items-center font-medium text-amber-500">
                                        ★ {reviews.rating}
                                    </span>
                                )}
                                {reviews.count && (
                                    <span>({reviews.count} avis)</span>
                                )}
                            </div>
                        )}

                        <div className="mt-3">
                            <p className="text-3xl text-gray-900">€{displayPrice}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="sr-only">Description</h3>
                            <div
                                className="text-base text-gray-700 space-y-6 prose max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        product.description ||
                                        'Produit de haute qualité avec livraison rapide dans le monde entier.',
                                }}
                            />
                        </div>

                        {/* Variant selector */}
                        {skus.length > 1 && (
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Variante
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {skus.map((sku) => (
                                        <button
                                            key={sku.skuId}
                                            type="button"
                                            onClick={() => setSelectedSkuId(sku.skuId)}
                                            disabled={sku.stock <= 0}
                                            className={`flex items-center gap-2 border rounded-md px-3 py-2 text-sm ${
                                                selectedSkuId === sku.skuId
                                                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            } ${sku.stock <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            {sku.image && (
                                                <img src={sku.image} alt={sku.properties} className="h-8 w-8 rounded object-cover" />
                                            )}
                                            <span>{sku.properties || sku.skuAttr}</span>
                                        </button>
                                    ))}
                                </div>
                                {selectedSku && selectedSku.stock > 0 && (
                                    <p className="mt-2 text-sm text-gray-500">{selectedSku.stock} en stock</p>
                                )}
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantité
                            </label>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </button>
                                <span className="w-16 text-center text-lg">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Buy Button */}
                        <div className="mt-8">
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isCheckingOut ? 'Traitement...' : 'Acheter maintenant'}
                            </button>
                        </div>

                        {/* Shipping / Seller / Features */}
                        <div className="mt-8 border-t pt-8 space-y-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {shipping}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Paiement sécurisé avec Stripe
                            </div>
                            {seller.name && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7l1.5 12a2 2 0 002 2h9a2 2 0 002-2L21 7M3 7l2-4h14l2 4" />
                                    </svg>
                                    Vendeur : {seller.name}
                                    {seller.rating && seller.rating !== 'N/A' && ` (${seller.rating})`}
                                </div>
                            )}
                        </div>

                        {/* Specifications */}
                        {specEntries.length > 0 && (
                            <div className="mt-8 border-t pt-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Caractéristiques</h3>
                                <dl className="divide-y divide-gray-100">
                                    {specEntries.map(([key, value]) => (
                                        <div key={key} className="py-2 grid grid-cols-3 gap-4 text-sm">
                                            <dt className="text-gray-500">{key}</dt>
                                            <dd className="text-gray-900 col-span-2">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="bg-gray-800 mt-20">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-base text-gray-400">
                            &copy; 2026 Exclusive Store. Tous droits réservés.
                        </p>
                        <div className="mt-4">
                            <Link href="/admin" className="text-gray-400 hover:text-gray-300">
                                Administration
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
