import {
  createSessionToken,
  getSessionExpirationDate,
  hashPassword,
  hashSessionToken,
  type AuthUser,
  verifyPassword
} from "@/lib/auth";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";

export type AuthResult = {
  user: AuthUser;
  token: string;
  source: "database" | "mock";
};

function makeMockUser(email: string, name = "Admin Demo", storeName = "Doce Maria"): AuthUser {
  return {
    id: "mock-user",
    name,
    email,
    role: "ADMIN",
    storeId: "mock-store",
    storeSlug: "doce-maria",
    storeName
  };
}

function mapUserToAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
  storeId: string;
  store: {
    name: string;
    publicSlug: string;
  };
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    storeSlug: user.store.publicSlug,
    storeName: user.store.name
  };
}

export async function registerStoreOwner(input: {
  storeName: string;
  storeSlug: string;
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  if (!isDatabaseConfigured()) {
    return {
      user: makeMockUser(input.email, input.name, input.storeName),
      token: createSessionToken(),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const passwordHash = await hashPassword(input.password);
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpirationDate();

  const user = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        name: input.storeName,
        publicSlug: input.storeSlug,
        onlineOrdersEnabled: true,
        pickupEnabled: true,
        deliveryEnabled: false
      }
    });
    const user = await tx.user.create({
      data: {
        storeId: store.id,
        name: input.name,
        email: input.email,
        passwordHash,
        role: "ADMIN"
      },
      include: {
        store: true
      }
    });

    await tx.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return user;
  });

  return {
    user: mapUserToAuthUser(user),
    token,
    source: "database"
  };
}

export async function loginStoreUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult | null> {
  if (!isDatabaseConfigured()) {
    return {
      user: makeMockUser(input.email),
      token: createSessionToken(),
      source: "mock"
    };
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    },
    include: {
      store: true
    }
  });

  if (!user) return null;

  const validPassword = await verifyPassword(input.password, user.passwordHash);
  if (!validPassword) return null;

  const token = createSessionToken();

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: getSessionExpirationDate()
    }
  });

  return {
    user: mapUserToAuthUser(user),
    token,
    source: "database"
  };
}

export async function getCurrentAuthUser(token: string | undefined) {
  if (!token) return null;

  if (!isDatabaseConfigured()) {
    return makeMockUser("admin@demo.local");
  }

  const prisma = getPrismaClient();
  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token)
    },
    include: {
      user: {
        include: {
          store: true
        }
      }
    }
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({
      where: {
        id: session.id
      }
    });

    return null;
  }

  return mapUserToAuthUser(session.user);
}

export async function logoutSession(token: string | undefined) {
  if (!token || !isDatabaseConfigured()) return;

  const prisma = getPrismaClient();

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(token)
    }
  });
}
