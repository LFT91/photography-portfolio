type JsonLdProps = {
  data: unknown;
};

/** Server-safe JSON-LD script. Escapes `<` to avoid breaking out of the tag. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
