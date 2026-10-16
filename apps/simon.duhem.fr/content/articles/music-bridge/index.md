---
tags:
  - posts
  - side-project
title: Music Bridge
description: "Une extension de navigateur qui ouvre n'importe quel lien de musique sur votre plateforme de streaming : Deezer, Spotify, Apple Music, YouTube Music... Un side project commencé fin 2022, que je viens de reprendre."
date: 2026-10-16
ogImage: og.png
layout: 'layouts/post.njk'
---

## Au départ, Deezer Link

J'écoute ma musique sur Deezer, dans l'application de bureau.
Quand on m'envoie un lien Deezer, il s'ouvre pourtant dans le navigateur. J'avais donc fait une petite extension, Deezer Link, qui ouvre ces liens directement dans l'application.

Mais on m'envoie aussi beaucoup de liens d'autres plateformes, comme Spotify ou Apple Music.
Et là, il faut copier le titre, ouvrir Deezer, le chercher... Je me suis dit qu'il devait y avoir moyen d'élargir l'idée.

## Music Bridge

C'est comme ça qu'est née Music Bridge, fin 2022.

Le principe est simple : on choisit sa plateforme une fois dans les options, et chaque lien vers un titre ou un album d'une autre plateforme s'ouvre directement sur la sienne.

![Un lien Spotify ? Ouvert sur Deezer.](./1.png)

Ça marche dans tous les sens, entre Deezer, Spotify, Apple Music, YouTube Music, Amazon Music, YouTube, SoundCloud, Tidal et Pandora.

![Les plateformes prises en charge](./2.png)

On peut aussi ouvrir la musique dans l'application de bureau de sa plateforme (Deezer, Spotify ou Apple Music, sur Windows et macOS), et fermer l'onglet resté ouvert.

## Comment ça marche

Tout repose sur l'API d'[Odesli](https://odesli.co/), le service derrière song.link : à partir d'un lien, elle retrouve la même musique sur les autres plateformes.

Au tout début, j'avais demandé à Kurt, son fondateur, s'il était possible que la redirection d'Odesli ouvre directement l'application. Il m'avait expliqué que c'était trop compliqué à faire correctement : l'application n'est pas forcément installée, et les liens d'Apple Music changent selon le système et le navigateur.

J'ai donc fait mon propre service de redirection, qui interroge Odesli et choisit le bon lien. Il tourne aujourd'hui sur Cloudflare Workers.

## La reprise

Le projet était resté en sommeil depuis 2023, avec quelques retours restés sans réponse : un bug sur Firefox sous Linux, et pas d'explication sur ce que faisait l'extension une fois installée.

Je l'ai repris cette année, en regroupant mes extensions dans un seul dépôt et en les reconstruisant avec [WXT](https://wxt.dev/). Au passage :

- Music Bridge est disponible sur Chrome, Edge et Firefox, y compris sur Android ;
- la page d'options s'ouvre à l'installation et explique ce que fait l'extension ;
- elle a été revue pour être simple et accessible ;
- l'option d'application de bureau n'est plus proposée là où elle ne peut pas marcher (Linux, ChromeOS, Android, iOS) ;
- quand Odesli ne trouve pas un titre récent sur Deezer, le service le cherche directement avec l'API de Deezer ;
- le logo change de couleurs à chaque version.

## Les limites

Music Bridge ne gère que les titres et les albums : Odesli ne convertit ni les artistes ni les playlists.

Sur Android, si l'application d'une autre plateforme est installée, ses liens s'ouvrent directement dedans, sans passer par le navigateur. L'extension ne peut donc pas les rediriger.

## Essayer Music Bridge

Music Bridge est disponible pour :

- [Chrome](https://chromewebstore.google.com/detail/music-bridge/mbebbcaajfmockkcflajghbambbimpck)
- [Firefox](https://addons.mozilla.org/firefox/addon/music-bridge/), sur ordinateur et sur Android
- [Edge](https://microsoftedge.microsoft.com/addons/detail/kfbedaeciahfjnknbjkcnjknkbdlcnld)

Le code est sur [GitHub](https://github.com/smndhm/web-extensions).

C'est encore jeune, il reste sûrement des cas que je n'ai pas prévus. N'hésitez pas à l'installer et à me dire ce que vous en pensez !
