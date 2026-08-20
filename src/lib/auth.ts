import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifyPassword } from "@/lib/password";
import { getUserByEmail } from "@/lib/user-store";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET ?? "dev-insecure-secret-change-me",
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
                },
            },
        }),
        CredentialsProvider({
            name: "Email Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email?.trim();
                const password = credentials?.password;

                if (!email || !password) {
                    return null;
                }

                const user = await getUserByEmail(email);
                if (!user) {
                    return null;
                }

                const isValid = await verifyPassword(password, user.passwordHash);
                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
                token.name = user.name;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.sub;
                session.user.name = token.name;
                session.user.email = token.email;
            }
            return session;
        },
    },
};
