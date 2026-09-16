# OEAvatar project page

Static project-page preview for **OEAvatar: One-shot Animatable Gaussian Head Avatars with Source-adaptive Geometry and Geometry-aligned Appearance**.

This repository contains the website, not the model implementation or model checkpoints. The current preview presents archived self-reenactment images and evaluation results. Continuous Self/Cross comparison videos are in preparation; author and publication resources will be added when finalized.

## Preview locally

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000 . No build step or external runtime dependencies are needed. GitHub Pages serves the root of `main`; preserve `.nojekyll` and relative asset paths.

## Assets and evidence

The four-example image gallery uses reviewed display tiles without retouching. Background and preprocessing differences are disclosed on the page. The image-quality and latency measurements have different sample sets and are documented separately. Referenced methods retain their respective authorship.

Page structure was informed by [FlexAvatar](https://tobias-kirschstein.github.io/flexavatar/) and [GAGAvatar](https://xg-chu.site/project_gagavatar/).
