import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

export type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ATTENDANT";
};

export async function listTeamUsers(storeId: string): Promise<{
  data: TeamUser[];
  source: "database" | "mock";
}> {
  if (!isDatabaseConfigured()) {
    return {
      data: [
        {
          id: "mock-admin",
          name: "Admin Demo",
          email: "admin@demo.local",
          role: "ADMIN"
        },
        {
          id: "mock-attendant",
          name: "Atendente Demo",
          email: "atendente@demo.local",
          role: "ATTENDANT"
        }
      ],
      source: "mock"
    };
  }

  const users = await getPrismaClient().user.findMany({
    where: {
      storeId
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  return {
    data: users,
    source: "database"
  };
}
