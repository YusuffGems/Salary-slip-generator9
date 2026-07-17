import type { NextAuthConfig } from "next-auth";

// Edge-safe config — used by middleware. No providers here (Credentials +
// bcrypt use Node.js APIs that aren't supported in the Edge Runtime), just
// the session/JWT callbacks needed to check "is this person logged in?".
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};