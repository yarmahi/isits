import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  async redirects() {
    return [
      { source: "/users/new", destination: "/users", permanent: false },
      {
        source: "/users/:id/edit",
        destination: "/users",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
