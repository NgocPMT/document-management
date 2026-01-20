import Keyv from "keyv";
import KeyvRedis from "@keyv/redis";
import { secret } from "encore.dev/config";

const redisURL = secret("REDIS_URL");

export const cache = new Keyv({
  store: new KeyvRedis({
    url: redisURL(),
  }),
  ttl: 60_000, // 1 Minutes
});

cache.on("error", (err) => {
  console.error(err);
  throw new Error("Keyv Connection Error", err);
});
