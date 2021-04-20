# Parallel History

A browser extension that replaces your new tab page with history. A collaboration with the [Edvo](https://edvo.com) team.

## What it does

Parallel History shows temporal history on the left, and _relational_ history on the right.

It's an interface experiment where parallel views enable fluid scrolling of a fixed list, and salient surfacing of a dynamic list.

## Installation

Download `web-ext-artifacts/parallel-history-0.0.1.zip`, unzip it. Load an unpacked extension in Firefox/Chrome (developer mode may be required).

## Development

Requires node, yarn, and Firefox.

Uses React.js, Typescript, web-ext, and Estrella (based on ESBuild).

### Setup

```
yarn
```

### Running

```
yarn start
```

Firefox should auto-launch in a special live-reloading dev mode.

### Building (for production)

```
yarn run build
```

The built extension will be in the `web-ext-artifacts` folder.

## Further Work

- [ ] Infinite scroll (window'll fill up fast)
- [ ] Animations during reordering
- [ ] Self-similarity proximity (if two right column entries are related, make them proximate)
- [x] URL Canonicalization
