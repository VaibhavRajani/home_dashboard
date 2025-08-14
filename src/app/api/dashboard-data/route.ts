import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const dashboardService = DashboardService.getInstance();
    const data = await dashboardService.getDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in dashboard data API:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
