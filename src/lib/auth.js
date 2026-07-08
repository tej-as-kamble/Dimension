import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          '+password'
        );

        if (!user) {
          throw new Error('No account found with this email');
        }

        if (!user.password) {
          throw new Error(
            'This account uses Google sign-in. Please use Google to log in.'
          );
        }

        const isMatch = await user.comparePassword(credentials.password);

        if (!isMatch) {
          throw new Error('Invalid password');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();

        // Check if user already exists
        let existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user from Google OAuth
          existingUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            authProvider: 'google',
          });
        } else if (!existingUser.image && user.image) {
          // Update image if not set
          existingUser.image = user.image;
          await existingUser.save();
        }

        // Attach the MongoDB _id for use in the jwt callback
        user.id = existingUser._id.toString();
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // Handle session updates (e.g., after profile changes)
      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
        token.image = session.image || token.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.image = token.image;
      }
      return session;
    },
  },
});
