/* eslint-disable react/no-unescaped-entities */
import LegalLayout from '@/components/LegalLayout';

export default function Retours() {
    return (
        <LegalLayout title="Retours & remboursements">
            <p><em>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</em></p>

            <h2>Droit de rétractation (14 jours)</h2>
            <p>
                Vous disposez de <strong>14 jours</strong> à compter de la réception de votre commande
                pour demander un retour, sans avoir à vous justifier.
            </p>

            <h2>Comment demander un retour ou un remboursement</h2>
            <ol>
                <li>Écrivez-nous à <strong>contact@shopnuvo.fr</strong> en indiquant votre numéro de commande.</li>
                <li>Nous vous répondons sous 48h avec la marche à suivre.</li>
                <li>Une fois le retour validé (ou le problème constaté), nous procédons au remboursement.</li>
            </ol>

            <h2>Remboursement</h2>
            <p>
                Le remboursement est effectué via le moyen de paiement d'origine (Stripe), sous 14
                jours après acceptation du retour. Les frais de retour éventuels sont précisés lors de
                l'échange avec notre support.
            </p>

            <h2>Produit endommagé ou non conforme</h2>
            <p>
                Si vous recevez un produit défectueux, endommagé ou non conforme, contactez-nous sous
                48h après réception avec des photos. Nous vous proposerons un remplacement ou un
                remboursement intégral, sans frais.
            </p>

            <h2>Colis non reçu</h2>
            <p>
                Si votre colis n'arrive pas dans le délai annoncé, contactez-nous : nous ouvrons une
                enquête auprès du transporteur et vous proposons une solution (renvoi ou remboursement).
            </p>

            <p>
                Pour toute question, suivez d'abord l'état de votre commande sur la page
                « Suivre ma commande », puis contactez-nous si besoin.
            </p>
        </LegalLayout>
    );
}
