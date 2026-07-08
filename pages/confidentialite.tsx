/* eslint-disable react/no-unescaped-entities */
import LegalLayout from '@/components/LegalLayout';

export default function Confidentialite() {
    return (
        <LegalLayout title="Politique de confidentialité">
            <p><em>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</em></p>

            <p>
                Nuvo accorde une grande importance à la protection de vos données personnelles,
                conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>

            <h2>Responsable du traitement</h2>
            <p>[À COMPLÉTER — nom / entreprise], joignable à contact@shopnuvo.fr.</p>

            <h2>Données collectées</h2>
            <p>Nous collectons uniquement les données nécessaires au traitement de votre commande :</p>
            <ul>
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Adresse postale de livraison</li>
                <li>Numéro de téléphone (requis par le transporteur)</li>
            </ul>
            <p>
                Les données de paiement (carte bancaire) sont traitées directement par Stripe et ne
                sont jamais stockées sur nos serveurs.
            </p>

            <h2>Finalités</h2>
            <p>
                Vos données servent à traiter et expédier votre commande, à vous tenir informé de son
                suivi, et à répondre à vos demandes de support.
            </p>

            <h2>Partage des données</h2>
            <p>
                Pour assurer la livraison, certaines données (nom, adresse, téléphone) sont transmises
                à notre fournisseur/transporteur. Le paiement est géré par Stripe. Nous ne vendons
                jamais vos données à des tiers.
            </p>

            <h2>Durée de conservation</h2>
            <p>
                Vos données sont conservées le temps nécessaire au traitement de la commande et aux
                obligations légales (notamment comptables), puis supprimées ou anonymisées.
            </p>

            <h2>Vos droits</h2>
            <p>
                Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de
                portabilité de vos données. Pour les exercer, écrivez à contact@shopnuvo.fr. Vous
                pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
            </p>

            <h2>Cookies</h2>
            <p>
                Le site utilise uniquement les cookies strictement nécessaires à son fonctionnement et,
                le cas échéant, ceux de nos prestataires (Stripe). Aucun cookie publicitaire n'est
                déposé sans votre consentement.
            </p>
        </LegalLayout>
    );
}
