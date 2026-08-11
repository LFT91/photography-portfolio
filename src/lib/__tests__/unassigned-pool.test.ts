import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyLocalUnassignedAllocation,
  assignedPhotoIdSet,
  filterUnassignedPhotos,
  planUnassignedAllocation,
  type MembershipRef,
} from "../unassigned-pool";

const photos = [
  { id: "a", title: "Alpha" },
  { id: "b", title: "Beta" },
  { id: "c", title: "Gamma" },
  { id: "d", title: "Delta" },
];

describe("unassigned pool filter", () => {
  it("excludes a photo assigned elsewhere on the same site", () => {
    const memberships: MembershipRef[] = [
      { photo_id: "a", collection_id: "fatni-nature", sort_order: 0 },
      { photo_id: "b", collection_id: "fatni-urban", sort_order: 0 },
    ];
    const assigned = assignedPhotoIdSet(memberships);
    const unassigned = filterUnassignedPhotos(photos, assigned);
    assert.deepEqual(
      unassigned.map((p) => p.id).sort(),
      ["c", "d"],
    );
    assert.ok(!unassigned.some((p) => p.id === "b"));
  });

  it("excludes a photo assigned on the other site", () => {
    const memberships: MembershipRef[] = [
      { photo_id: "a", collection_id: "ayoub-after-dark", sort_order: 0 },
    ];
    const assigned = assignedPhotoIdSet(memberships);
    const unassigned = filterUnassignedPhotos(photos, assigned);
    assert.ok(!unassigned.some((p) => p.id === "a"));
    assert.equal(unassigned.length, 3);
  });

  it("includes zero-membership photos", () => {
    const memberships: MembershipRef[] = [
      { photo_id: "a", collection_id: "fatni-nature", sort_order: 0 },
    ];
    const unassigned = filterUnassignedPhotos(
      photos,
      assignedPhotoIdSet(memberships),
    );
    assert.ok(unassigned.some((p) => p.id === "c"));
    assert.ok(unassigned.some((p) => p.id === "d"));
  });
});

describe("unassigned allocation", () => {
  it("allocating an unassigned photo creates exactly one membership plan", () => {
    const memberships: MembershipRef[] = [
      { photo_id: "a", collection_id: "fatni-nature", sort_order: 0 },
      { photo_id: "a2", collection_id: "fatni-nature", sort_order: 1 },
    ];
    const plan = planUnassignedAllocation({
      photoId: "c",
      destinationCollectionId: "fatni-nature",
      memberships,
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.sort_order, 2);

    const assigned = assignedPhotoIdSet(memberships);
    const beforeCount = filterUnassignedPhotos(photos, assigned).length;
    const applied = applyLocalUnassignedAllocation({
      photoId: "c",
      destinationCollectionId: "fatni-nature",
      sortOrder: plan.sort_order,
      memberships,
      assignedPhotoIds: assigned,
    });
    const forPhoto = applied.memberships.filter((m) => m.photo_id === "c");
    assert.equal(forPhoto.length, 1);
    assert.equal(forPhoto[0].collection_id, "fatni-nature");
    assert.equal(forPhoto[0].sort_order, 2);

    const afterCount = filterUnassignedPhotos(
      photos,
      applied.assignedPhotoIds,
    ).length;
    assert.equal(afterCount, beforeCount - 1);
  });

  it("unassigned count decreases by one after successful allocate", () => {
    const memberships: MembershipRef[] = [];
    const assigned = assignedPhotoIdSet(memberships);
    assert.equal(filterUnassignedPhotos(photos, assigned).length, 4);
    const plan = planUnassignedAllocation({
      photoId: "a",
      destinationCollectionId: "ayoub-mono",
      memberships,
    });
    assert.ok(plan.ok);
    if (!plan.ok) return;
    const applied = applyLocalUnassignedAllocation({
      photoId: "a",
      destinationCollectionId: "ayoub-mono",
      sortOrder: plan.sort_order,
      memberships,
      assignedPhotoIds: assigned,
    });
    assert.equal(
      filterUnassignedPhotos(photos, applied.assignedPhotoIds).length,
      3,
    );
  });

  it("duplicate/racing allocation fails closed when photo already assigned", () => {
    const memberships: MembershipRef[] = [
      { photo_id: "c", collection_id: "fatni-street", sort_order: 5 },
    ];
    const plan = planUnassignedAllocation({
      photoId: "c",
      destinationCollectionId: "fatni-nature",
      memberships,
    });
    assert.equal(plan.ok, false);
    if (plan.ok) return;
    assert.equal(plan.reason, "already_assigned");
  });

  it("appends contiguous sort_order in an empty destination", () => {
    const plan = planUnassignedAllocation({
      photoId: "d",
      destinationCollectionId: "new-empty",
      memberships: [],
    });
    assert.equal(plan.ok, true);
    if (!plan.ok) return;
    assert.equal(plan.sort_order, 0);
  });
});
