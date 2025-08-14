import { DashboardData } from "@/types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "APIError";
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard-data`);

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(`Failed to fetch dashboard data: ${error}`);
  }
}
