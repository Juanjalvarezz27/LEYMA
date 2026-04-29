import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        correo: { label: "Correo", type: "email" },
        clave: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.clave) {
          throw new Error("Por favor ingresa tu correo y contraseña.");
        }

        const usuario = await prisma.usuario.findUnique({
          where: { correo: credentials.correo }
        });

        if (!usuario || !usuario.activo) {
          throw new Error("El usuario no existe o está inactivo.");
        }

        const claveCorrecta = await bcrypt.compare(credentials.clave, usuario.clave);

        if (!claveCorrecta) {
          throw new Error("Contraseña incorrecta.");
        }

        // Si todo está bien, retornamos la data que queremos guardar en la sesión
        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          rolId: usuario.rolId.toString(),
        };
      }
    })
  ],
  callbacks: {
    // Guardamos el rol en el token para poder validar permisos luego
    async jwt({ token, user }) {
      if (user) {
        token.rolId = (user as any).rolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).rolId = token.rolId;
        (session.user as any).id = token.sub; // sub es el id del usuario
      }
      return session;
    }
  },
  pages: {
    signIn: "/", // Le decimos a NextAuth dónde está nuestra vista de login
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Exportamos los métodos GET y POST que Next.js requiere para sus APIs
export { handler as GET, handler as POST };