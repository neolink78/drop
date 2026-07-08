/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import LegalLayout from '@/components/LegalLayout';

export default function Contact() {
    return (
        <LegalLayout title="Contact">
            <p>
                Une question sur un produit, une commande ou un retour ? Nous sommes là pour vous
                aider.
            </p>

            <h2>Par email</h2>
            <p>
                Écrivez-nous à <a href="mailto:contact@shopnuvo.fr">contact@shopnuvo.fr</a>. Nous
                répondons généralement sous 48 heures ouvrées.
            </p>

            <h2>Suivi de commande</h2>
            <p>
                Pour connaître l'état de votre commande, utilisez la page
                {' '}<Link href="/suivi">Suivre ma commande</Link> avec votre numéro de commande et
                votre email.
            </p>

            <h2>Avant de nous écrire</h2>
            <p>Pour un traitement plus rapide, merci d'indiquer :</p>
            <ul>
                <li>Votre numéro de commande</li>
                <li>L'email utilisé lors de l'achat</li>
                <li>La description de votre demande (avec photos si produit endommagé)</li>
            </ul>
        </LegalLayout>
    );
}
