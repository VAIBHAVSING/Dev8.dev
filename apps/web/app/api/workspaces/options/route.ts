import { NextResponse } from "next/server";

const OPTIONS = {
  providers: [
    { id: "aws", name: "AWS" },
    { id: "gcp", name: "GCP" },
    { id: "azure", name: "Azure" },
    { id: "local", name: "Local" },
  ],
  images: [
    { id: "ubuntu-22", label: "Ubuntu 22.04" },
    { id: "ubuntu-20", label: "Ubuntu 20.04" },
    { id: "debian-12", label: "Debian 12" },
    { id: "docker", label: "Dockerfile" },
  ],
  sizes: [
    { id: "small", cpu: 2, ramGb: 4 },
    { id: "medium", cpu: 4, ramGb: 8 },
    { id: "large", cpu: 8, ramGb: 16 },
  ],
  regions: [
    { id: "us-east", label: "US East" },
    { id: "us-west", label: "US West" },
    { id: "eu-west", label: "EU West" },
    { id: "ap-south", label: "AP South" },
  ],
};

export async function GET() {
  return NextResponse.json(OPTIONS);
}
