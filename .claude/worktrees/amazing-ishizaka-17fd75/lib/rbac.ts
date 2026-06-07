export function hasPermission(
  permissions: string[] | undefined,
  required: string,
) {
  if (!permissions?.length) return false;
  return permissions.includes(required) || permissions.includes("center:manage");
}

