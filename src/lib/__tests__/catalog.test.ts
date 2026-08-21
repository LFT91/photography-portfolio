import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  flattenCollectionRows,
  shouldUseLocalCatalog,
} from "../catalog";
import { mapCollectionMemberships } from "../photo-map";

describe("shouldUseLocalCatalog", () => {
  it("is on only when explicitly requested", () => {
    assert.equal(
      shouldUseLocalCatalog({ USE_LOCAL_CATALOG: "1", NODE_ENV: "production" }, true),
      true,
    );
  });

  it("is on in development when Supabase env is absent", () => {
    assert.equal(
      shouldUseLocalCatalog({ NODE_ENV: "development" }, false),
      true,
    );
  });

  it("never turns on because a production query would fail", () => {
    assert.equal(
      shouldUseLocalCatalog({ NODE_ENV: "production" }, false),
      false,
    );
    assert.equal(
      shouldUseLocalCatalog({ NODE_ENV: "production" }, true),
      false,
    );
  });
});

describe("flattenCollectionRows", () => {
  it("maps nested collection memberships into catalogue photos", () => {
    const flat = flattenCollectionRows([
      {
        title: "Nature",
        slug: "nature",
        sort_order: 0,
        collection_photos: [
          {
            sort_order: 1,
            photo: {
              id: "p2",
              title: "Second",
              storage_path: "b.jpg",
              public_url: "/images/b.jpg",
              display_scale: 1,
            },
          },
          {
            sort_order: 0,
            photo: {
              id: "p1",
              title: "First",
              storage_path: "a.jpg",
              public_url: "/images/a.jpg",
              display_scale: 1.5,
            },
          },
        ],
      },
    ]);

    const photos = mapCollectionMemberships(flat);
    assert.equal(photos.length, 2);
    assert.equal(photos[0]?.title, "First");
    assert.equal(photos[0]?.collectionOrders?.Nature, 0);
    assert.equal(photos[1]?.title, "Second");
    assert.equal(photos[1]?.displayScale, 1);
  });
});
