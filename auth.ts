import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    jwt({ token, account }) {
      // `account` exists only at sign-in. Save Google's permanent account id so it is identical on every login.
      if (account?.providerAccountId) token.uid = `${account.provider}:${account.providerAccountId}`;
      return token;
    },
    session({ session, token }) {
      const id = (token.uid as string | undefined) ?? token.sub;
      if (id) (session.user as { id?: string }).id = id;
      return session;
    },
  },
});