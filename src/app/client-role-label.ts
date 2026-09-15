export const clientRoleLabel = (role: string) => {
  if (role === "Сотрудник клиента") return "Сотрудник";
  if (role === "Администратор клиента") return "Администратор";
  return role;
};
