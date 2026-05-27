import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import {
  deleteProductAsAdmin,
  listProductsAsAdmin,
  requireAdmin,
  saveProductAsAdmin,
  uploadProductImageAsAdmin,
  type SaveProductInput,
  type UploadProductImageInput,
} from "./admin.server";

export const checkAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireAdmin(getRequestHeader("authorization"));
  return { ok: true, email: user.email ?? null };
});

export const getAdminProducts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin(getRequestHeader("authorization"));
  return listProductsAsAdmin();
});

export const saveAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((data: SaveProductInput) => data)
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeader("authorization"));
    return saveProductAsAdmin(data);
  });

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeader("authorization"));
    return deleteProductAsAdmin(data.id);
  });

export const uploadAdminProductImage = createServerFn({ method: "POST" })
  .inputValidator((data: UploadProductImageInput) => data)
  .handler(async ({ data }) => {
    await requireAdmin(getRequestHeader("authorization"));
    return uploadProductImageAsAdmin(data);
  });