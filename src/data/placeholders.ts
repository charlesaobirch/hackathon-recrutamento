// Substitua estes valores pelos dados reais quando estiverem disponíveis.
// Os textos do Figma são usados como fallback em todo o app.

export const profile = {
  name: "Beatriz Santos",
  role: "Talent Partner",
  workspace: "Studio People",
  plan: "Workspace  /  Pro",
};

export const textOverrides: Record<string, string> = {
  "Beatriz Santos": profile.name,
  "Talent Partner": profile.role,
  "Studio People": profile.workspace,
  "Workspace  /  Pro": profile.plan,
};
