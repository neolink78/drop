/* eslint-disable react/no-unescaped-entities */
import LegalLayout from '@/components/LegalLayout';

export default function MentionsLegales() {
    return (
        <LegalLayout title="Mentions légales">
            <p><em>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</em></p>

            <h2>Éditeur du site</h2>
            <p>
                Le site <strong>shopnuvo.fr</strong> (ci-après « Nuvo ») est édité par :
            </p>
            <ul>
                <li>Nom / Raison sociale : [À COMPLÉTER — votre nom ou nom de l'entreprise]</li>
                <li>Statut juridique : [À COMPLÉTER — ex. entrepreneur individuel / micro-entreprise / SASU]</li>
                <li>Adresse : [À COMPLÉTER — adresse postale]</li>
                <li>Email : contact@shopnuvo.fr</li>
                <li>SIREN / SIRET : [À COMPLÉTER]</li>
                <li>Numéro de TVA intracommunautaire : [À COMPLÉTER si applicable]</li>
                <li>Directeur de la publication : [À COMPLÉTER]</li>
            </ul>

            <h2>Hébergement</h2>
            <p>
                Le site est hébergé par OVH SAS, 2 rue Kellermann, 59100 Roubaix, France —
                www.ovhcloud.com.
            </p>

            <h2>Propriété intellectuelle</h2>
            <p>
                L'ensemble des contenus présents sur le site (textes, visuels, logos) est protégé.
                Certaines images de produits proviennent des fournisseurs et restent la propriété de
                leurs détenteurs respectifs.
            </p>

            <h2>Responsabilité</h2>
            <p>
                Nuvo s'efforce d'assurer l'exactitude des informations diffusées mais ne saurait être
                tenu responsable d'éventuelles erreurs ou omissions. Les prix et disponibilités sont
                donnés à titre indicatif et peuvent évoluer.
            </p>

            <h2>Médiation de la consommation</h2>
            <p>
                Conformément à l'article L.612-1 du Code de la consommation, le client peut recourir
                gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un
                litige : [À COMPLÉTER — nom et coordonnées du médiateur choisi].
            </p>
            <p>
                Plateforme européenne de règlement des litiges en ligne :
                https://ec.europa.eu/consumers/odr
            </p>
        </LegalLayout>
    );
}
