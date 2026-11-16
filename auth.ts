import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// JWT sessions: no database adapter needed. The Google account id (token.sub) is our user id.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" }, // use our own sign-in page
  callbacks: {
    session({ session, token }) {
      if (token.sub) (session.user as { id?: string }).id = token.sub;
      return session;
    },
  },
});