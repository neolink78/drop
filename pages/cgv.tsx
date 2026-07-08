/* eslint-disable react/no-unescaped-entities */
import LegalLayout from '@/components/LegalLayout';

export default function CGV() {
    return (
        <LegalLayout title="Conditions Générales de Vente">
            <p><em>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</em></p>

            <h2>1. Objet</h2>
            <p>
                Les présentes conditions régissent les ventes conclues sur le site shopnuvo.fr entre
                Nuvo (le vendeur) et toute personne effectuant un achat (le client).
            </p>

            <h2>2. Produits</h2>
            <p>
                Les produits proposés sont décrits avec la plus grande exactitude possible. Les photos
                sont non contractuelles. Les produits sont expédiés par nos partenaires fournisseurs.
            </p>

            <h2>3. Prix</h2>
            <p>
                Les prix sont indiqués en euros, toutes taxes comprises. Nuvo se réserve le droit de
                modifier ses prix à tout moment ; le produit est facturé sur la base du tarif en
                vigueur au moment de la commande.
            </p>

            <h2>4. Commande et paiement</h2>
            <p>
                Le paiement s'effectue en ligne par carte bancaire via notre prestataire sécurisé
                Stripe. La commande est validée après confirmation du paiement. Un email de
                confirmation est envoyé au client.
            </p>

            <h2>5. Livraison</h2>
            <p>
                Les produits sont livrés à l'adresse indiquée par le client lors de la commande. Le
                délai de livraison estimé est communiqué sur la fiche produit et peut varier selon la
                destination. En cas de retard important, le client peut nous contacter à
                contact@shopnuvo.fr.
            </p>

            <h2>6. Droit de rétractation</h2>
            <p>
                Conformément aux articles L.221-18 et suivants du Code de la consommation, le client
                dispose d'un délai de <strong>14 jours</strong> à compter de la réception du produit
                pour exercer son droit de rétractation, sans avoir à justifier de motif. Les modalités
                sont détaillées sur la page « Retours & remboursements ».
            </p>

            <h2>7. Garanties</h2>
            <p>
                Les produits bénéficient des garanties légales de conformité (art. L.217-4 et suivants
                du Code de la consommation) et des vices cachés (art. 1641 et suivants du Code civil).
            </p>

            <h2>8. Données personnelles</h2>
            <p>
                Le traitement des données personnelles est décrit dans notre Politique de
                confidentialité.
            </p>

            <h2>9. Litiges</h2>
            <p>
                Les présentes CGV sont soumises au droit français. En cas de litige, une solution
                amiable sera recherchée avant toute action judiciaire (voir la médiation indiquée dans
                les mentions légales).
            </p>
        </LegalLayout>
    );
}
