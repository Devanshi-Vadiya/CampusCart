import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

const providers = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Please enter your email and password");
      }

      await connectDB();
      const user = await User.findOne({
        email: String(credentials.email).toLowerCase().trim(),
      });

      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password");
      }

      const isValid = await bcrypt.compare(String(credentials.password), user.passwordHash);
      if (!isValid) {
        throw new Error("Invalid email or password");
      }

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "USER",
        image: user.image || "",
      };
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        let existingUser = await User.findOne({ email: user.email.toLowerCase().trim() });
        if (!existingUser) {
          existingUser = await User.create({
            name: user.name || "Student",
            email: user.email.toLowerCase().trim(),
            image: user.image || "",
            role: "USER",
          });
        }
        user.id = existingUser._id.toString();
        user.role = existingUser.role || "USER";
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role || "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
});
