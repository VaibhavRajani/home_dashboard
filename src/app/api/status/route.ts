import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/services/dashboard-service";

export async function GET() {
  try {
    const dashboardService = DashboardService.getInstance();
    const systemStatus = await dashboardService.getSystemStatus();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: systemStatus,
    });
  } catch (error) {
    console.error("Error in status API:", error);
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to fetch system status",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
