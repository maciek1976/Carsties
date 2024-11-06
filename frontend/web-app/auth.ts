import NextAuth, { Profile } from "next-auth"
import DuendeIDS6Provider from "next-auth/providers/duende-identity-server6"
import { OIDCConfig } from 'next-auth/providers'
 
export const { handlers, signIn, signOut, auth } = NextAuth({
    session: {
        strategy: 'jwt'
    },
    providers: [
        DuendeIDS6Provider({
            id: 'id-server',
            clientId: "nextApp",
            clientSecret: "secret",
            issuer: "http://localhost:5000",
            authorization: {params: {scope: 'openid profile auctionApp'}},
            idToken: true
        } as OIDCConfig<Omit<Profile, 'username'>>)
    ],
    callbacks: {
        async authorized({auth}) {
            return !!auth;
        },
        async jwt({token, user, account, profile}) {
            console.log({token, user, account, profile});
            if (account && account.access_token) {
                token.accessToken = account.access_token;
            }          
            if(profile) {
                token.username = profile.username;
            }
            return token;
        },
        async session({session, token}) {
            if (token) {
                session.user.username = token.username;
                session.accessToken = token.accessToken;
            }
            return session;
        }
    }
})