import { Bucket } from "@monolayer/sdk";

const BananaBucket = new Bucket("bananabucketdev", {
  publicAccess: {
    "generated_images/*": ["get"],
  },
});

export default BananaBucket;
