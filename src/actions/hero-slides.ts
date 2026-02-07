"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ---------- Public (no auth) ----------

export type HeroSlidePublic = {
  id: string;
  image: string;
  alt: string;
  link: string | null;
};

/** Get active hero slides for the home page, ordered by sortOrder */
export async function getHeroSlides(): Promise<{ success: boolean; data: HeroSlidePublic[] }> {
  try {
    const slides = await db.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, image: true, alt: true, link: true },
    });
    return { success: true, data: slides };
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return { success: true, data: [] };
  }
}

// ---------- Admin ----------

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session.user;
}

export type HeroSlideAdmin = HeroSlidePublic & {
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function getAdminHeroSlides(): Promise<{
  success: boolean;
  data?: HeroSlideAdmin[];
  error?: string;
}> {
  try {
    await checkAdmin();
    const slides = await db.heroSlide.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { success: true, data: slides };
  } catch (error) {
    console.error("Error fetching admin hero slides:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch slides",
    };
  }
}

export async function createHeroSlide(data: {
  image: string;
  alt?: string;
  link?: string | null;
}): Promise<{ success: boolean; data?: HeroSlideAdmin; error?: string }> {
  try {
    await checkAdmin();
    const maxOrder = await db.heroSlide.aggregate({ _max: { sortOrder: true } });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    const slide = await db.heroSlide.create({
      data: {
        image: data.image,
        alt: data.alt ?? "",
        link: data.link ?? null,
        sortOrder,
      },
    });
    revalidatePath("/");
    return { success: true, data: slide };
  } catch (error) {
    console.error("Error creating hero slide:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create slide",
    };
  }
}

export async function updateHeroSlide(
  id: string,
  data: { image?: string; alt?: string; link?: string | null; isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();
    await db.heroSlide.update({
      where: { id },
      data: {
        ...(data.image !== undefined && { image: data.image }),
        ...(data.alt !== undefined && { alt: data.alt }),
        ...(data.link !== undefined && { link: data.link }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating hero slide:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update slide",
    };
  }
}

export async function deleteHeroSlide(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();
    await db.heroSlide.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete slide",
    };
  }
}

/** Reorder slides by providing ordered ids */
export async function reorderHeroSlides(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin();
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.heroSlide.update({ where: { id }, data: { sortOrder: index } })
      )
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error reordering hero slides:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder slides",
    };
  }
}
