/**
 * One-time seed: loads the original 14 customer screenshots from /public/reviews into the Review
 * table, so the site shows the same reviews it did before the admin existed.
 *
 * Safe by design:
 *  - touches only the Review table (settings use code defaults until changed in the admin);
 *  - does nothing if the table already has rows;
 *  - prints the target database and writes only when run with --yes.
 *
 * Usage (after `prisma migrate deploy`):  npx tsx prisma/seed-reviews.ts --yes
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ReviewSource } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const SCREENSHOTS: Array<{
  file: string;
  width: number;
  height: number;
  source: ReviewSource;
  customerName: string;
  caption: string;
  isFeatured: boolean;
}> = [
  { file: "IMG_0381.JPG.jpeg", width: 720, height: 1600, source: "MESSENGER", customerName: "Mehdiur R.", caption: "Got the muscle tees from you. Excellent quality, very happy with the product.", isFeatured: true },
  { file: "IMG_0058.JPG.jpeg", width: 720, height: 1600, source: "PHOTO", customerName: "", caption: "Wearing the henley tee they ordered.", isFeatured: true },
  { file: "IMG_0059.JPG.jpeg", width: 720, height: 1600, source: "MESSENGER", customerName: "Johny K.", caption: "I believe in Maneel quality, already bought 3 henley t-shirts. Ordering again.", isFeatured: true },
  { file: "IMG_0348.PNG", width: 1242, height: 2688, source: "MESSENGER", customerName: "Alif K.", caption: "Got the product, quality is very good. Exactly what I expected at this price.", isFeatured: true },
  { file: "IMG_0377.JPG.jpeg", width: 773, height: 1280, source: "PHOTO", customerName: "", caption: "Ringer tee, sent to us after delivery.", isFeatured: true },
  { file: "IMG_0062.JPG.jpeg", width: 720, height: 1600, source: "MESSENGER", customerName: "", caption: "Satisfied with the quality and texture. Really happy with the design and the fabric.", isFeatured: true },
  { file: "IMG_0387.JPG.jpeg", width: 576, height: 1280, source: "MESSENGER", customerName: "Arpon O.", caption: "Product quality is very good. I am satisfied.", isFeatured: true },
  { file: "IMG_0378.JPG.jpeg", width: 576, height: 1280, source: "INSTAGRAM", customerName: "Alif", caption: "The product is great, really happy with it.", isFeatured: true },
  { file: "IMG_0384.JPG.jpeg", width: 960, height: 1280, source: "PHOTO", customerName: "", caption: "Full sleeve henley, sent to us after delivery.", isFeatured: true },
  { file: "IMG_0380.JPG.jpeg", width: 576, height: 1280, source: "MESSENGER", customerName: "Adit Q.", caption: "The product is very good. Should have ordered a half sleeve too.", isFeatured: true },
  { file: "IMG_0385.JPG.jpeg", width: 720, height: 1600, source: "INSTAGRAM", customerName: "Hazzaz", caption: "Your product looks really beautiful. Thank you.", isFeatured: false },
  { file: "IMG_0388.JPG.jpeg", width: 576, height: 1280, source: "MESSENGER", customerName: "Araf A.", caption: "Sent us a photo wearing his order as a review.", isFeatured: false },
  { file: "IMG_0383.JPG.jpeg", width: 576, height: 1280, source: "MESSENGER", customerName: "Efaz", caption: "Shared his photo in the tee. Thanks for your product.", isFeatured: false },
  { file: "IMG_0379.JPG.jpeg", width: 576, height: 1280, source: "INSTAGRAM", customerName: "Mehebub", caption: "Tagged us in his story wearing the henley.", isFeatured: false },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const target = new URL(url);
  console.log(`Target database: ${target.hostname}:${target.port}${target.pathname}`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const existing = await prisma.review.count();
    if (existing > 0) {
      console.log(`Review table already has ${existing} rows. Nothing to do.`);
      return;
    }
    if (!process.argv.includes("--yes")) {
      console.log(`Would insert ${SCREENSHOTS.length} reviews. Re-run with --yes to write.`);
      return;
    }
    const result = await prisma.review.createMany({
      data: SCREENSHOTS.map(({ file, ...rest }, index) => ({
        ...rest,
        image: `/reviews/${file}`,
        sortOrder: index,
      })),
    });
    console.log(`Inserted ${result.count} reviews.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
