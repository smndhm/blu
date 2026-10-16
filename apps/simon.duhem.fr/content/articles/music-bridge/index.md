---
tags:
  - posts
  - side-project
title: Music Bridge
description: "Une extension de navigateur qui ouvre n'importe quel lien de musique sur votre plateforme de streaming : Deezer, Spotify, Apple Music, YouTube Music... Un side project commencé fin 2022, enfin terminé."
date: 2026-10-16
layout: 'layouts/post.njk'
---

## Au départ, Deezer Link

J'écoute ma musique sur Deezer, dans l'application de bureau.
Quand on m'envoie un lien Deezer, il s'ouvre pourtant dans le navigateur. J'avais donc fait une petite extension, [Deezer Link](https://github.com/smndhm/web-extensions/tree/main/extensions/dzr-link), qui ouvre ces liens directement dans l'application.

Mais on m'envoie aussi des liens Spotify.
Et là, il faut copier le titre, ouvrir Deezer, le chercher... Je me suis dit qu'il devait y avoir un moyen d'élargir l'idée.

## Music Bridge

C'est comme ça qu'est née Music Bridge, fin 2022.

Le principe est simple : on choisit sa plateforme une fois dans les options, et chaque lien vers un titre ou un album d'une autre plateforme s'ouvre directement sur la sienne.

![Un lien Spotify ? Ouvert sur Deezer.](https://raw.githubusercontent.com/smndhm/web-extensions/music-bridge%401.8.0/extensions/music-bridge/store/screenshot-1280x800-fr-1.png)

Ça marche dans tous les sens, entre Deezer, Spotify, Apple Music, YouTube Music, Amazon Music, YouTube, SoundCloud, Tidal et Pandora.

![Les plateformes prises en charge](https://raw.githubusercontent.com/smndhm/web-extensions/music-bridge%401.8.0/extensions/music-bridge/store/screenshot-1280x800-fr-2.png)

On peut aussi ouvrir la musique dans l'application de bureau de sa plateforme (Deezer, Spotify ou Apple Music, sur Windows et macOS), et fermer l'onglet resté ouvert.

## Comment ça marche

Tout repose sur l'API d'[Odesli](https://odesli.co/) (anciennement Songlink) : à partir d'un lien, elle retrouve la même musique sur les autres plateformes.

Je connais Odesli depuis un moment : quand je travaillais chez Deezer, j'avais été mis en contact avec Kurt, son fondateur, et je les avais aidés à intégrer Deezer dans leur service.

L'extension passe par mon propre service de redirection, qui interroge Odesli et renvoie vers le bon lien.

## Finir ses side projects

Grâce à Claude, je me suis mis à finir tous mes side projects. Music Bridge en faisait partie.

J'ai regroupé mes extensions dans un seul dépôt et je les ai reconstruites avec [WXT](https://wxt.dev/). Au passage :

- Music Bridge est disponible sur Chrome, Edge et Firefox, y compris sur Android ;
- la page d'options s'ouvre à l'installation et explique ce que fait l'extension ;
- elle a été revue pour être simple et accessible ;
- l'option d'application de bureau n'est plus proposée là où elle ne peut pas marcher (Linux, ChromeOS, Android, iOS).

## Les limites

Comme Music Bridge utilise l'API d'Odesli, elle se limite elle aussi à rediriger les titres et les albums : pas les artistes ni les playlists.

Sur Android, si l'application d'une autre plateforme est installée, ses liens s'ouvrent directement dedans, sans passer par le navigateur. L'extension ne peut donc pas les rediriger.

## Essayer Music Bridge

Music Bridge est disponible pour :

- [Chrome](https://chromewebstore.google.com/detail/music-bridge/mbebbcaajfmockkcflajghbambbimpck)
- [Firefox](https://addons.mozilla.org/firefox/addon/music-bridge/), sur ordinateur et sur Android
- [Edge](https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld)

Le code est sur [GitHub](https://github.com/smndhm/web-extensions).

C'est encore jeune, il reste sûrement des cas que je n'ai pas prévus. N'hésitez pas à l'installer et à me dire ce que vous en pensez !
