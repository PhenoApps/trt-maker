# trt-maker

A browser-based editor for creating and editing [Field Book](https://github.com/PhenoApps/Field-Book) trait files (`.trt`).

**Live app:** https://trife.github.io/trt-maker/

## Features

- **Load and export `.trt` files** in Field Book's JSON trait format
- **Create and edit traits** for all Field Book formats (numeric, categorical, date, photo, etc.) with format-specific options
- **Reorder traits** by drag and drop
- **Import from Crop Ontology** trait dictionary Excel files (`.xlsx`)
- **Import from a BrAPI server** by fetching its observation variables
- **Filter traits** by name, format, growth stage, or status

Everything runs client-side; no data leaves your browser except BrAPI requests to the server you specify.

## Development

```sh
npm install
npm run dev      # start the dev server
npm run build    # type-check and build to dist/
```

Built with React, TypeScript, Vite, and Tailwind CSS. Pushes to `main` deploy to GitHub Pages automatically.

## License

GPL-2.0. See [LICENSE](LICENSE).
