# Photographic masters

Camera originals are **not stored in this repository**.

Set `MASTERS_DIR` to the directory that contains the original photographs
(`after-dark/`, `nature/`, `urban`, …):

```bash
MASTERS_DIR=/path/to/fatni-photography-masters/images npm run images
```

The generator writes web derivatives under `public/images/`, regenerates
`src/data/image-manifest.json`, and deletes stale generated files. It never
writes to the masters directory.

If a photograph listed in `src/content/photos.ts` has no matching master, the
command fails before pruning.
