import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/kanban/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/conversations/:path*",
    "/settings/:path*",
  ],
};
