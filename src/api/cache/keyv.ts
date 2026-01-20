import Keyv from "keyv";
import KeyvRedis from "@keyv/redis";

export const cache = new Keyv({
  store: new KeyvRedis({
    url: "redis://localhost:6379",
  }),
  ttl: 60_000, // 1 Minutes
});

cache.on("error", (err) => {
  throw new Error("Keyv Connection Error", err);
});
